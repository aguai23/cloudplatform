import React, { Component } from 'react';
import { Navbar, FormGroup, FormControl, Table, Button } from 'react-bootstrap';
import { Cases } from '../api/cases';
import { DataCollections } from '../api/dataCollections';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { browserHistory, Link } from 'react-router';
import { toast, ToastContainer } from 'react-toastify';

const style = {
  searchResult: {
    marginTop: '10px',
    marginBottom: '20px',
    paddingLeft: '20px',
    fontSize: '18px'
  }
}

export class CaseList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      cases: Cases.find({collectionId: this.props.params.collectionId}).fetch(),
      isSearchClicked: false
    };

    this.searchCase = this.searchCase.bind(this);
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

  searchCase() {
    let name = this.input.value;

    if(this.state.isSearchClicked) return;

    if(name === undefined || name.length === 0) {
      return alert("查询条件不能为空");
    }

    this.setState({
      isSearchClicked: true,
      cases: Cases.find({ name: {$regex: '.*'  + name + '.*', $options:"i"}}).fetch()
    });
  }

  reset() {
    this.input.value = "";
    this.setState({
      isSearchClicked: false,
      cases: this.props.cases
    });
  }

  render() {
    const that = this;
    let tHead = this.state.cases.length > 0 ? ( !this.state.isSearchClicked ?
                  (<tr>
                      <th>病例名</th>
                      <th>年龄</th>
                      <th>性别</th>
                      <th>来源</th>
                      <th>创建时间</th>
                      <th>操作</th>
                    </tr>) :
                    (<tr>
                      <th>病例名</th>
                      <th>年龄</th>
                      <th>性别</th>
                      <th>来源</th>
                      <th>创建时间</th>
                      <th>所属数据集</th>
                      <th>操作</th>
                    </tr>)) :
                  <tr><th>未找到符合搜索条件的病例</th></tr>;

    let searchResult = this.state.isSearchClicked ? ("共计" + this.state.cases.length + "条搜索结果") : undefined;

    return (
      <div>
        <Navbar>
          <Navbar.Header>
            <Navbar.Brand>
            <Link to={`/newCase?collection=${this.props.params.collectionId}`}>新建</Link>
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
              <Button onClick={() => this.reset()}>重置</Button>
            </Navbar.Form>
          </Navbar.Collapse>
        </Navbar>

        <div className="container">
        <div style={style.searchResult}>{searchResult}</div>
        <Table striped bordered condensed hover>
          <thead>
            {tHead}
          </thead>
          <tbody>
            {this.state.cases.length > 0 && this.state.cases.map((specificCase, index) => {
              let collectionCol = this.state.isSearchClicked ? <td>{specificCase.collectionId}</td> : undefined;
              return (
                <tr key={specificCase._id}>
                  <td>{specificCase.name}</td>
                  <td>{specificCase.profile.age}</td>
                  <td>{specificCase.profile.gender}</td>
                  <td>{specificCase.profile.source}</td>
                  <td>{specificCase.createAt}</td>
                  {collectionCol}
                  <td>
                    <Link to={`/viewer?caseId=${specificCase._id}`} className="glyphicon glyphicon-picture"></Link>
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
        <ToastContainer
          position="bottom-right"
          type="info"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          pauseOnHover
        />
      </div>
    )
  }
}

CaseList.contextTypes = {
  router: React.PropTypes.object
}

export default withTracker(props => {
  const handle = Meteor.subscribe('cases');

  return {
    cases: Cases.find({collectionId: props.params.collectionId}).fetch(),
    listLoading: !handle.ready()
  }
})(CaseList);
