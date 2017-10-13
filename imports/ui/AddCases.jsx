import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { browserHistory } from 'react-router';
import { Cases } from '../api/cases';
import { Session } from "meteor/session";

import { Col, Checkbox, Radio, Form, ButtonToolbar, Button, FormGroup, HelpBlock, FormControl, FieldGroup, ControlLabel, Nav, NavItem } from 'react-bootstrap';
import Gallery from 'react-fine-uploader';
import FineUploaderTraditional from 'fine-uploader-wrappers';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

import 'react-fine-uploader/gallery/gallery.css';


export default class AddCase extends Component {
  constructor(props) {
    super(props);
    const oldCase = Cases.findOne({ _id: this.props.location.query.id });

    this.uploader = new FineUploaderTraditional({
      options: {
        chunking: {
            enabled: false
        },
        deleteFile: {
          enabled: true,
          endpoint: '/delete',
          method: 'DELETE'
        },
        request: {
          endpoint: '/uploads'
        },
        retry: {
          enableAuto: true
        },
        callbacks: {
          onAllComplete: function() {
            console.log("onAllComplete");
          },
          onComplete: function(id) {
            console.log(id);
          },
          onUpload: function() {
            console.log("onUpload");
          }
        }
      }
    });

    this.state = {
      collectionId: Session.get('collectionId'),
      Case: {},
      oldCase: oldCase,
    };
    this.onCaseChange = this.onCaseChange.bind(this);
    this.submitCases = this.submitCases.bind(this);
    this.modifyCase = this.modifyCase.bind(this);
  }
  componentDidMount() {
  }

  onCaseChange(input) {
    const { Case } = this.state;
    Case[input.target.id] = input.target.value
    if (input.target.id === 'age' && input.target.value <= 0) {
      toast.error("年龄错误", {position: toast.POSITION.BOTTOM_RIGHT});
      return;
    }
    this.setState({
      Case
    })

  }

  submitCases(event) {
    event.preventDefault();

    const { Case } = this.state;
    const flag = Case.name && Case.type && Case.class && Case.label && Case.gender && Case.age && Case.source && Case.source && Case.description && Case.createAt
    if (!flag) {
      toast.error("请检验并完善信息", {position: toast.POSITION.BOTTOM_RIGHT});
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
        collectionId: this.state.collectionId ? this.state.collectionId : 'test',
        ownerId: Meteor.userId(),
      }
      Meteor.call('insertCase', standardCase, (error) => {
        if (error) {
          toast.error(`somethings wrong${error.reason}`, {position: toast.POSITION.BOTTOM_RIGHT});
        } else {
          toast.success("病例添加成功", {position: toast.POSITION.BOTTOM_RIGHT});
          Meteor.setTimeout(browserHistory.goBack,2000)
        }
      });
    }
  }

  modifyCase(event) {
    event.preventDefault();
    //遍历Case
    const newCase = this.state.oldCase
    for (let key in this.state.Case) {
      if (['gender','age','source','description'].indexOf(key) < 0) {
        newCase[key] = this.state.Case[key]
      } else {
        newCase.profile[key] = this.state.Case[key]
      }
    }
    Meteor.call('modifyCase',newCase,(error)=>{
      if(error) {
        toast.error(`somethings wrong${error.reason}`, {position: toast.POSITION.BOTTOM_RIGHT});
      } else {
        toast.success("病例修改成功", {position: toast.POSITION.BOTTOM_RIGHT});
        Meteor.setTimeout(browserHistory.goBack,2000)
      }
    })
  }

  render() {
    const wellStyles = { marginTop: '20px' };
    const oldCase = this.state.oldCase
    return (
      <div className="container">
        <h3>{oldCase ? `修改${oldCase.name}病例` : '添加新病例'}</h3>
        <Form horizontal>
          <div className="well" style={wellStyles}>
            <FormGroup controlId="name">
              <Col componentClass={ControlLabel} sm={2}>
                病例名称
                      </Col>
              <Col sm={6}>
                <FormControl defaultValue={oldCase && oldCase.name} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="type">
              <Col componentClass={ControlLabel} sm={2}>
                种类
                      </Col>
              <Col sm={6}>
                <FormControl defaultValue={oldCase && oldCase.type} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="class">
              <Col componentClass={ControlLabel} sm={2}>
                类别
                      </Col>
              <Col sm={6}>
                <FormControl defaultValue={oldCase && oldCase.class} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="label">
              <Col componentClass={ControlLabel} sm={2}>
                标签
                      </Col>
              <Col sm={6}>
                <FormControl defaultValue={oldCase && oldCase.label} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>
          </div>
          <div className="well" style={wellStyles}>
            <FormGroup controlId="formHorizontalPassword">
              <Col componentClass={ControlLabel} sm={2}>
                图片
                      </Col>
              <Col sm={6}>
                <Gallery uploader={ this.uploader }/>
              </Col>
            </FormGroup>
          </div>

          <div className="well" style={wellStyles}>

            <FormGroup controlId="age">
              <Col componentClass={ControlLabel} sm={2}>
                年龄
                      </Col>
              <Col sm={2}>
                <FormControl defaultValue={oldCase && oldCase.profile.age} onChange={this.onCaseChange} type="number" />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                性别
                      </Col>
              <Col sm={6}>
                <Radio defaultChecked={oldCase && oldCase.profile.gender === 'male'} onClick={this.onCaseChange} id="gender" name="gender" value="male" inline>男</Radio>{' '}
                <Radio defaultChecked={oldCase && oldCase.profile.gender === 'female'} onClick={this.onCaseChange} id="gender" name="gender" value="female" inline>女</Radio>{' '}
              </Col>
            </FormGroup>

            <FormGroup controlId="source">
              <Col componentClass={ControlLabel} sm={2}>
                来源
                      </Col>
              <Col sm={6}>
                <FormControl defaultValue={oldCase && oldCase.profile.source} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="description">
              <Col componentClass={ControlLabel} sm={2}>
                描述
                      </Col>
              <Col sm={6}>
                <FormControl defaultValue={oldCase && oldCase.profile.description} onChange={this.onCaseChange} componentClass="textarea" />
              </Col>
            </FormGroup>

            <FormGroup controlId="createAt">
              <Col componentClass={ControlLabel} sm={2}>
                创建时间
                      </Col>
              <Col sm={6}>
                <input defaultValue={oldCase && oldCase.createAt} id="createAt" type="date" onChange={this.onCaseChange} />
              </Col>
            </FormGroup>

          </div>

          <FormGroup>
            <Col smOffset={3} sm={8}>
              {oldCase ? <Button onClick={this.modifyCase} bsStyle="success">修改</Button> :
                <Button onClick={this.submitCases} bsStyle="success">新建</Button>
              }
              &nbsp;&nbsp;
              <Button onClick={browserHistory.goBack}>返回</Button>

            </Col>
          </FormGroup>
        </Form>
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

AddCase.contextTypes = {
  router: React.PropTypes.object
}
