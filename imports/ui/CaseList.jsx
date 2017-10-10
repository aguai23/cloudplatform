import React, { Component } from 'react';
import { Media, Label, Row, Col, Grid, ControlLabel, Well,Button } from 'react-bootstrap';
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
      <div>
        {allCase.length && allCase.map((Case, index) => {
          return (
            <Row key={Case._id}>
              <Col componentClass={ControlLabel} xs={4} md={2} >
                  <p>{Case.name}</p>
                  <p> <Label>年龄:</Label>{Case.profile.age}</p>
                  <p> <Label>性别:</Label>{Case.profile.gender}</p>
                  <p> <Label>来源:</Label>{Case.profile.source}</p>
                  <p> <Label>描述:</Label>{Case.profile.description}</p>
                  <p>
                    <span className="glyphicon glyphicon-pencil"></span>
                    &nbsp;&nbsp;&nbsp;
                    <span className="glyphicon glyphicon-trash" onClick={that.deleteCase.bind(this,Case._id)}></span>
                  </p>
              </Col>
              <Col xs={14} md={10}>
                <img width={165} height={165} src='http://i8.baidu.com/it/u=3976128583,2113847052&fm=85&s=E193C73A5F6373011066D840030010FA' alt="Image" />&nbsp;&nbsp;
                <img width={165} height={165} src='http://i8.baidu.com/it/u=3976128583,2113847052&fm=85&s=E193C73A5F6373011066D840030010FA' alt="Image" />&nbsp;&nbsp;
                <img width={165} height={165} src='http://i8.baidu.com/it/u=3976128583,2113847052&fm=85&s=E193C73A5F6373011066D840030010FA' alt="Image" />&nbsp;&nbsp;
            </Col>
            </Row>
          )
        })
        }
      </div>
    )
  }
}

CaseList.contextTypes = {
  router: React.PropTypes.object
}