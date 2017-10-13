import React, { Component } from 'react';
import { Navbar, FormGroup, FormControl, Table, Button } from 'react-bootstrap';
import { Cases } from '../api/cases';
import { DataCollections } from '../api/dataCollections';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { browserHistory, Link } from 'react-router';

var collectionId;

export class CaseList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      cases: Cases.find({}).fetch()
    };

    this.searchCase = this.searchCase.bind(this);

    collectionId = this.props.params.caseId;

  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.cases !== this.state.cases) {
      this.setState({cases: nextProps.cases});
    }
  }

  deleteCase(caseId) {
    Meteor.call('deleteCase', caseId, (error) => {
      if (error) {
        alert("somethings wrong" + error.reason);
      } else {
        alert("Case deleted");
      }
    });
  }

  onClickViewImage(caseId, index) {
    Meteor.call('getDicoms', caseId, index, (error, result) => {
      if(error) {
        return console.log("error", error);
      }

      // console.log("result", result);
    });
  }

  searchCase() {
    const name = this.input.value;
    const targetCase = Cases.find({ name: name }).fetch()
    if (targetCase && targetCase.length) {
      this.setState({
        cases: targetCase
      })
    } else {
      alert('找不到该病例')
      return
    }
  }

  render() {
    const that = this;
    const newTo = { pathname: "/newCase"};

    return (
      <div>
        <Navbar>
          <Navbar.Header>
            <Navbar.Brand>
            <Link to={newTo}>新建</Link>
            </Navbar.Brand>
            <Navbar.Toggle />
          </Navbar.Header>
          <Navbar.Collapse>
            <Navbar.Form pullLeft>
              <FormGroup>
                <FormControl inputRef={ref => { this.input = ref }} type="text" placeholder="输入病例名称" />
              </FormGroup>
              {' '}
              <Button onClick={this.searchCase}>查询</Button>
            </Navbar.Form>
          </Navbar.Collapse>
        </Navbar>

        <Table striped bordered condensed hover>
          <thead>
            <tr>
              <th>病例名</th>
              <th>年龄</th>
              <th>性别</th>
              <th>来源</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {this.state.cases.length > 0 && this.state.cases.map((specificCase, index) => {
              return (
                <tr key={specificCase._id}>
                  <td>{specificCase.name}</td>
                  <td>{specificCase.profile.age}</td>
                  <td>{specificCase.profile.gender}</td>
                  <td>{specificCase.profile.source}</td>
                  <td>{specificCase.createAt}</td>
                  <td>
                    <a className="glyphicon glyphicon-picture" onClick={() => this.onClickViewImage(specificCase._id, 0)}></a>
                    &nbsp;&nbsp;&nbsp;
                    <Link  to={`/newCase?id=${specificCase._id}`} className="glyphicon glyphicon-pencil"></Link>
                    &nbsp;&nbsp;&nbsp;
                    <span className="glyphicon glyphicon-trash" onClick={that.deleteCase.bind(this, specificCase._id)}></span>
                  </td>
                </tr>
                )
              })
            }
          </tbody>
        </Table>

      </div>
    )
  }
}

CaseList.contextTypes = {
  router: React.PropTypes.object
}

export default withTracker(props => {
  const handle = Meteor.subscribe('cases');

  //cases should be modified as follows later
  //cases: Cases.find({collectionId: collectionId}).fetch()
  return {
    cases: Cases.find({}).fetch(),
    listLoading: !handle.ready()
  }
})(CaseList);
