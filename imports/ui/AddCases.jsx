import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { browserHistory } from 'react-router';
import { Cases } from '../api/cases';
import { Session } from "meteor/session";
import { HTTP } from 'meteor/http';
import { Col, Radio, Form, Button, FormGroup, FormControl, ControlLabel, Nav, Modal } from 'react-bootstrap';
import Gallery from 'react-fine-uploader';
import FineUploaderTraditional from 'fine-uploader-wrappers';
import { ToastContainer, toast } from 'react-toastify';
import { withTracker } from 'meteor/react-meteor-data';
import 'react-toastify/dist/ReactToastify.min.css';

import 'react-fine-uploader/gallery/gallery.css';

var isUploadFinished = true,
  imageArray = [];

export class AddCase extends Component {
  constructor(props) {
    super(props);
    var that = this;
    const oldCase = Cases.findOne({ _id: props.location.query.id });
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
          onAllComplete: function () {
            // console.log("imageArray", imageArray);
            that.setState({ isUploadFinished: true });
          },
          onComplete: function (id, name, response) {
            // console.log('response', response);
            imageArray.push(response.filePath);
          },
          onUpload: function () {
            that.setState({ isUploadFinished: false });
          }
        }
      }
    });

    this.state = {
      collectionId: this.props.location.query.collection,
      Case: {},
      oldFileList: oldCase ? oldCase.files : [],
      oldCase: oldCase,
      isUploadFinished: true,
      showFilesList: false
    };
    this.onCaseChange = this.onCaseChange.bind(this);
    this.submitCases = this.submitCases.bind(this);
    this.modifyCase = this.modifyCase.bind(this);
    this.changeModalState = this.changeModalState.bind(this);
    // this.deleteFile = this.deleteFile.bind(this);
  }
  componentDidMount() {
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.case !== this.state.oldCase) {
      this.setState({
        oldCase: nextProps.case,
        oldFileList: nextProps.case.files
      });
    }
  }

  onCaseChange(input) {
    if (this.state.oldCase) {
      const { oldCase } = this.state;
      if (['age', 'gender', 'source', 'description'].indexOf(input.target.id) < 0) {
        oldCase[input.target.id] = input.target.value;
      } else {
        if (input.target.id === 'age' && input.target.value < 0) {
          toast.error("年龄错误", { position: toast.POSITION.BOTTOM_RIGHT });
          return;
        }
        oldCase.profile[input.target.id] = input.target.value
      }
      this.setState({
        oldCase
      })
    } else {
      const { Case } = this.state;
      Case[input.target.id] = input.target.value;
      if (input.target.id === 'age' && input.target.value < 0) {
        toast.error("年龄错误", { position: toast.POSITION.BOTTOM_RIGHT });
        return;
      }
      this.setState({
        Case
      })
    }
  }

  submitCases(event) {
    event.preventDefault();

    if (!isUploadFinished) return;

    const { Case } = this.state;
    const flag = Case.name && Case.type && Case.class && Case.label && Case.gender && Case.age && Case.source && Case.source && Case.description && Case.createAt
    if (!flag) {
      toast.error("请检验并完善信息", { position: toast.POSITION.BOTTOM_RIGHT });
      return;
    } else {
      const standardCase = {
        name: Case.name,
        type: Case.type,
        class: Case.class,
        label: Case.label,
        files: imageArray,
        profile: {
          gender: Case.gender,
          age: Case.age,
          source: Case.source,
          description: Case.description
        },
        createAt: Case.createAt,
        collectionId: this.state.collectionId,
        ownerId: Meteor.userId(),
      }
      Meteor.call('insertCase', standardCase, (error) => {
        if (error) {
          toast.error(`somethings wrong${error.reason}`, { position: toast.POSITION.BOTTOM_RIGHT });
        } else {
          toast.success("病例添加成功", { position: toast.POSITION.BOTTOM_RIGHT });
          Meteor.setTimeout(browserHistory.goBack, 2000)
        }
      });
    }
  }

  modifyCase(event) {
    event.preventDefault();
    let oldCase = this.state.oldCase;
    oldCase.files = oldCase.files.concat(imageArray);
    Meteor.call('modifyCase', oldCase, (error) => {
      if (error) {
        toast.error(`somethings wrong${error.reason}`, { position: toast.POSITION.BOTTOM_RIGHT });
      } else {
        toast.success("病例修改成功", { position: toast.POSITION.BOTTOM_RIGHT });
        Meteor.setTimeout(browserHistory.goBack, 2000)
      }
    })
  }

  changeModalState() {
    const showState = this.state.showFilesList
    this.setState({
      showFilesList: !showState
    })
  }

  deleteFile(file) {
    let fileInfo = file.split('/');
    HTTP.call("DELETE", `/delete/${fileInfo[2]}`, (err, result) => {
      if (err) {
        toast.error(`somethings wrong${error.reason}`, { position: toast.POSITION.BOTTOM_RIGHT });
      } else {
        let list = this.state.oldFileList;
        let position = list.indexOf(file);
        list.splice(position, 1);
        let newCase = this.state.oldCase;
        newCase.files = list
        Meteor.call('modifyCase', newCase, (error) => {
          if (error) {
            toast.error(`somethings wrong${error.reason}`, { position: toast.POSITION.BOTTOM_RIGHT });
          } else {
            this.setState({
              oldFileList: list
            });
          }
        });
        toast.success(result.content, { position: toast.POSITION.BOTTOM_RIGHT });
      }
    })
  }

  render() {
    const wellStyles = { marginTop: '20px' };
    const toastStyle = { zIndex: 1999 };
    const filesList = this.state.oldFileList;
    const oldCase = this.state.oldCase;
    const Case = this.state.Case;
    return (
      <div className="container">
        <h3>{oldCase ? `修改病例` : '添加新病例'}</h3>
        <Form horizontal>
          <div className="well" style={wellStyles}>
            <FormGroup controlId="name">
              <Col componentClass={ControlLabel} sm={2}>
                病例名称
                      </Col>
              <Col sm={6}>
                <FormControl value={oldCase ? oldCase.name : Case.name} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="type">
              <Col componentClass={ControlLabel} sm={2}>
                种类
                      </Col>
              <Col sm={6}>
                <FormControl value={oldCase ? oldCase.type : Case.type} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="class">
              <Col componentClass={ControlLabel} sm={2}>
                类别
                      </Col>
              <Col sm={6}>
                <FormControl value={oldCase ? oldCase.class : Case.class} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="label">
              <Col componentClass={ControlLabel} sm={2}>
                标签
                      </Col>
              <Col sm={6}>
                <FormControl value={oldCase ? oldCase.label : Case.label} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>
          </div>
          <div className="well" style={wellStyles}>
            <FormGroup controlId="formHorizontalPassword">
              <Col componentClass={ControlLabel} sm={2}>
                图片
                      </Col>
              <Col sm={6}>
                <Gallery uploader={this.uploader} />
              </Col>
              <Col>
                {oldCase &&
                  <Button onClick={this.changeModalState}>查看已有图片</Button>
                }
              </Col>
            </FormGroup>
          </div>

          <div className="well" style={wellStyles}>

            <FormGroup controlId="age">
              <Col componentClass={ControlLabel} sm={2}>
                年龄
                      </Col>
              <Col sm={2}>
                <FormControl value={oldCase ? oldCase.profile.age : Case.age} onChange={this.onCaseChange} type="number" />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                性别
                      </Col>
              <Col sm={6}>
                <Radio checked={oldCase ? oldCase.profile.gender === 'male' : Case.gender === 'male'} onChange={this.onCaseChange} id="gender" name="gender" value="male" inline>男</Radio>{' '}
                <Radio checked={oldCase ? oldCase.profile.gender === 'female' : Case.gender === 'female'} onChange={this.onCaseChange} id="gender" name="gender" value="female" inline>女</Radio>{' '}
              </Col>
            </FormGroup>

            <FormGroup controlId="source">
              <Col componentClass={ControlLabel} sm={2}>
                来源
                      </Col>
              <Col sm={6}>
                <FormControl value={oldCase ? oldCase.profile.source : Case.source} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="description">
              <Col componentClass={ControlLabel} sm={2}>
                描述
                      </Col>
              <Col sm={6}>
                <FormControl value={oldCase ? oldCase.profile.description : Case.description} onChange={this.onCaseChange} componentClass="textarea" />
              </Col>
            </FormGroup>

            <FormGroup controlId="createAt">
              <Col componentClass={ControlLabel} sm={2}>
                创建时间
                      </Col>
              <Col sm={6}>
                <input value={oldCase ? oldCase.createAt : Case.createAt} id="createAt" type="date" onChange={this.onCaseChange} />
              </Col>
            </FormGroup>

          </div>

          <FormGroup>
            <Col smOffset={3} sm={8}>
              {oldCase ? <Button onClick={this.modifyCase} bsStyle="success" disabled={!this.state.isUploadFinished}>修改</Button> :
                <Button onClick={this.submitCases} bsStyle="success" disabled={!this.state.isUploadFinished}>新建</Button>
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
          style={toastStyle}
        />

        <Modal show={this.state.showFilesList} onHide={this.changeModalState}>
          <Modal.Header closeButton>
            <Modal.Title>文件列表</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {filesList &&
              filesList.map((file, index) => {
                return (
                  <p key={file}>{file}<a onClick={this.deleteFile.bind(this, file)}>删除</a></p>
                )
              })
            }
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.changeModalState}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
}

AddCase.contextTypes = {
  router: React.PropTypes.object
}

export default withTracker(props => {
  const handle = Meteor.subscribe('cases');
  return {
    case: Cases.findOne({ _id: props.location.query.id }),
  }
})(AddCase);