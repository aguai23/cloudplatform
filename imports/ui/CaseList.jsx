import React, { Component } from 'react';
import { Media, Label, Row, Col, Grid, Table, ControlLabel, Well, Button } from 'react-bootstrap';
import { Cases } from '../api/cases';
import { DataCollections } from '../api/dataCollections';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

export default class CaseList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      CaseList: []
    };
    // this.deleteCase = this.deleteCase.bind(this)
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

  render() {
    // const textStyle = { margin: '50px' }
    const allCase = Cases.find({}).fetch();
    const that = this;
    return (

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
          {allCase.length && allCase.map((Case, index) => {
            return (
              <tr>
                <td>{Case.name}</td>
                <td>{Case.profile.age}</td>
                <td>{Case.profile.gender}</td>
                <td>{Case.profile.source}</td>
                <td>{Case.profile.createAt}</td>
                <td>
                  <span className="glyphicon glyphicon-pencil"></span>
                  &nbsp;&nbsp;&nbsp;
                  <span className="glyphicon glyphicon-trash" onClick={that.deleteCase.bind(this, Case._id)}></span></td>
              </tr>
            )
          })
          }
        </tbody>
      </Table>
    )
  }
}

CaseList.contextTypes = {
  router: React.PropTypes.object
}