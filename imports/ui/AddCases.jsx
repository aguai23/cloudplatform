import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { browserHistory } from 'react-router';
import { Cases } from '../api/cases';
import { Session } from "meteor/session";
import { Col, Checkbox, Radio, Form, ButtonToolbar, Button, FormGroup, HelpBlock, FormControl, FieldGroup, ControlLabel, Nav, NavItem } from 'react-bootstrap'
export default class AddCase extends Component {
  constructor(props) {
    super(props);
    this.state = {
      collectionId: Session.get('collectionId'),
      Case: {}
    };
    this.onCaseChange = this.onCaseChange.bind(this);
    this.submitDataCollection = this.submitDataCollection.bind(this)
  }
  componentDidMount() {

  }

  onCaseChange(input) {
    const { Case } = this.state;
    Case[input.target.id] = input.target.value
    if(input.target.id === 'age' && input.target.value <=0){
      alert('年龄错误')
      return;
    }
    this.setState({
      Case
    })
  }

  submitDataCollection(event) {
    event.preventDefault();

    const { Case } = this.state;
    const flag = Case.name && Case.type && Case.class && Case.label && Case.gender && Case.age && Case.source && Case.source && Case.description
    if (!flag) {
      alert('请检验并完善信息');
      return;
    } else {
      const standardCase = {
        name: Case.name,
        type: Case.type,
        class: Case.class,
        label: Case.label,
        files: ['todo'],
        profile: {
          gender: Case.gender,
          age: Case.age,
          source: Case.source,
          description: Case.description
        },
        collectionId: this.state.collectionId? this.state.collectionId:'test' ,
        ownerId: Meteor.userId(),
      }
      Meteor.call('insertCase', standardCase, (error) => {
        if (error) {
          alert("somethings wrong" + error.reason);
        } else {
          alert("Case added");
          browserHistory.push('/datasets');
        }
      });
    }
  }

  render() {
    const wellStyles = { marginTop: '20px' };

    return (
      <div className="container">
        <h3>添加新病例{this.state.user}</h3>
        <Form horizontal>
          <div className="well" style={wellStyles}>
            <FormGroup controlId="name">
              <Col componentClass={ControlLabel} sm={2}>
                病例名称
                      </Col>
              <Col sm={6}>
                <FormControl onChange={this.onCaseChange} type="text"  />
              </Col>
            </FormGroup>

            <FormGroup controlId="type">
              <Col componentClass={ControlLabel} sm={2}>
                种类
                      </Col>
              <Col sm={6}>
                <FormControl onChange={this.onCaseChange} type="text"  />
              </Col>
            </FormGroup>

            <FormGroup controlId="class">
              <Col componentClass={ControlLabel} sm={2}>
                类别
                      </Col>
              <Col sm={6}>
                <FormControl onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="label">
              <Col componentClass={ControlLabel} sm={2}>
                标签
                      </Col>
              <Col sm={6}>
                <FormControl onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>
          </div>
          <div className="well" style={wellStyles}>
            <FormGroup controlId="formHorizontalPassword">
              <Col componentClass={ControlLabel} sm={2}>
                图片
                      </Col>
              <Col sm={6}>
                <FormControl onChange={this.onCaseChange} type="file" />
              </Col>
            </FormGroup>
          </div>

          <div className="well" style={wellStyles}>

            <FormGroup controlId="age">
              <Col componentClass={ControlLabel} sm={2}>
                年龄
                      </Col>
              <Col sm={2}>
                <FormControl onChange={this.onCaseChange} type="number" />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                性别
                      </Col>
              <Col sm={6}>
                <Radio onClick={this.onCaseChange} id="gender" name="gender" value="a" inline>男</Radio>{' '}
                <Radio onClick={this.onCaseChange} id="gender" name="gender" value="b" inline>女</Radio>{' '}
              </Col>
            </FormGroup>

            <FormGroup controlId="source">
              <Col componentClass={ControlLabel} sm={2}>
                来源
                      </Col>
              <Col sm={6}>
                <FormControl onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="description">
              <Col componentClass={ControlLabel} sm={2}>
                描述
                      </Col>
              <Col sm={6}>
                <FormControl onChange={this.onCaseChange} componentClass="textarea" />
              </Col>
            </FormGroup>

          </div>

          <FormGroup>
            <Col smOffset={3} sm={8}>
              <Button onClick={this.submitDataCollection} bsStyle="success">提交</Button> &nbsp;&nbsp;
              <Button onClick={()=>{browserHistory.push('/datasets');}}>返回</Button>

            </Col>
          </FormGroup>
        </Form>
      </div>
    )
  }
}

AddCase.contextTypes = {
  router: React.PropTypes.object
}
