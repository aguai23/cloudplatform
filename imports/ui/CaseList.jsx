import React, { Component } from 'react';
import { Navbar, FormGroup, FormControl, Table, Button } from 'react-bootstrap';
import { Cases } from '../api/cases';
import { DataCollections } from '../api/dataCollections';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

export default class CaseList extends Component {
  constructor(props) {
    super(props);
    const allCase = Cases.find({}).fetch();
    this.state = {
      CaseList: [],
      allCase: allCase
    };
    this.searchCase = this.searchCase.bind(this)
  }
  componentWillMount() {

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

  searchCase(){
    const name = this.input.value;
    const targetCase = Cases.find({name:name}).fetch()
    if(targetCase && targetCase.length){
      this.setState({
        allCase: targetCase
      })
    } else{
      alert('找不到该病例')
      return
    }
  }

  render() {
    const that = this;
    return (
      <div>
        <Navbar>
          <Navbar.Header>
            <Navbar.Brand>
              <p>搜索</p>
            </Navbar.Brand>
            <Navbar.Toggle />
          </Navbar.Header>
          <Navbar.Collapse>
            <Navbar.Form pullLeft>
              <FormGroup>
                <FormControl inputRef={ref=>{this.input = ref}} type="text" placeholder="输入病例名称" />
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
            {this.state.allCase.length && this.state.allCase.map((Case, index) => {
              return (
                <tr key={Case._id}>
                  <td>{Case.name}</td>
                  <td>{Case.profile.age}</td>
                  <td>{Case.profile.gender}</td>
                  <td>{Case.profile.source}</td>
                  <td>{Case.profile.createAt}</td>
                  <td>
                    <span className="glyphicon glyphicon-picture"></span>
                    &nbsp;&nbsp;&nbsp;
                  <span className="glyphicon glyphicon-pencil"></span>
                    &nbsp;&nbsp;&nbsp;
                  <span className="glyphicon glyphicon-trash" onClick={that.deleteCase.bind(this, Case._id)}></span>
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

Meteor.subscribe('cases')