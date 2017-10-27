import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { browserHistory } from 'react-router';
import { Cases } from '../api/cases';
import { Session } from "meteor/session";
import { HTTP } from 'meteor/http';
import { Col, Radio, Form, Button, FormGroup, FormControl, ControlLabel, Nav, Modal, Table } from 'react-bootstrap';
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
      Case: {
        accessionNumber: undefined,
        patientID: undefined,
        otherPatientIDs: undefined,
        patientName: undefined,
        patientBirthDate: undefined,
        patientSex: undefined,
        institutionName: undefined,
        referringPhysicianName: undefined,
        requestedProcedureDescription: undefined,
        studyDate: undefined,
        studyID: undefined,
        studyInstanceUID: undefined,
        description: undefined,
        diagnoseResult: undefined,
        seriesList: undefined,
      },
      // oldFileList: oldCase ? oldCase.files : [],
      oldCase: oldCase,
      isUploadFinished: true,
      showFilesList: false,
      showSeriesList: false,
    };
    this.onCaseChange = this.onCaseChange.bind(this);
    this.submitCases = this.submitCases.bind(this);
    this.modifyCase = this.modifyCase.bind(this);
    this.changeFilesModalState = this.changeFilesModalState.bind(this);
    // this.changeSeriesModalState = this.changeSeriesModalState.bind(this);
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
      if (['seriesNumber', 'seriesInstanceUid', 'files', 'description'].indexOf(input.target.id) < 0) {
        oldCase[input.target.id] = input.target.value;
      } else {
        //seriesData
        if (!oldCase.seriesList[index]) {
          oldCase.seriesList[index] = {}
        }
        oldCase.seriesList[index][input.target.id] = input.target.value
      }
      this.setState({
        oldCase
      })
    } else {
      const { Case } = this.state;
      if (['seriesNumber', 'seriesInstanceUid', 'files', 'serirsDescription', 'total'].indexOf(input.target.id) < 0) {
        Case[input.target.id] = input.target.value;
      } else {
        //seriesData
        let index = this.state.seriesIndex;
        if (!Case.seriesList[index]) {
          Case.seriesList[index] = {}
        }
        Case.seriesList[index][input.target.id] = input.target.value
      }
      this.setState({
        Case
      })
    }
    console.log(this.state.Case)
  }

  submitCases(event) {
    event.preventDefault();

    if (!isUploadFinished) return;

    const { Case } = this.state;
    const flag = Case.accessionNumber && Case.patientID && Case.otherPatientIDs && Case.patientName && Case.patientBirthDate
      && Case.patientSex && Case.institutionName && Case.referringPhysicianName && Case.requestedProcedureDescription
      && Case.studyDate && Case.studyID && Case.studyInstanceUID && Case.studyDescription && Case.seriesList

    if (!flag) {
      toast.error("请检验并完善信息", { position: toast.POSITION.BOTTOM_RIGHT });
      return;
    } else {
      const standardCase = {
        accessionNumber: Case.accessionNumber,
        patientID: Case.patientID,
        otherPatientIDs: Case.otherPatientIDs,
        patientName: Case.patientName,
        patientBirthDate: patientBirthDate,
        patientSex: Case.patientSex,
        institutionName: Case.institutionName,
        referringPhysicianName: Case.referringPhysicianName,
        requestedProcedureDescription: Case.requestedProcedureDescription,
        studyDate: Case.studyDate,
        studyID: Case.studyID,
        studyInstanceUID: Case.studyInstanceUID,
        studyDescription: Case.studyDescription,
        seriesList: Case.seriesList,
        collectionId: this.state.collectionId,
        creator: Meteor.userId(),
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

  changeFilesModalState() {
    const showState = this.state.showFilesList
    this.setState({
      showFilesList: !showState
    })
  }

  changeSeriesModalState(index) {
    const showSeriesState = this.state.showSeriesList
    if (!showSeriesState) {
      this.setState({
        showSeriesList: !showSeriesState,
        seriesIndex: index
      })
    } else {
      this.setState({
        showSeriesList: !showSeriesState
      })

    }
  }

  removeSeriesHandle() {
    let index = this.state.seriesIndex;
    //TODO: remove single series
    this.changeSeriesModalState()
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
    const filesList = this.state.oldFileList;
    const oldCase = this.state.oldCase;
    const Case = this.state.Case;
    return (
      <div className="container">
        <h3>{oldCase ? `修改病例` : '添加新病例'}</h3>
        <Form horizontal>
          <div className="well" style={wellStyles}>
            <FormGroup controlId="patientName">
              <Col componentClass={ControlLabel} sm={2}>
                患者姓名
                      </Col>
              <Col sm={6}>
                <FormControl onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="patientBirthDate">
              <Col componentClass={ControlLabel} sm={2}>
                出生日期
                      </Col>
              <Col sm={6}>
                <FormControl value={oldCase ? oldCase.class : Case.class} onChange={this.onCaseChange} type="date" />
              </Col>
            </FormGroup>

            <FormGroup controlId="patientSex">
              <Col componentClass={ControlLabel} sm={2}>
                患者性别
                    </Col>
              <Col sm={6}>
                <Radio checked={Case.patientSex === 'male'} onChange={this.onCaseChange} id="patientSex" name="patientSex" value="male" inline>男</Radio>{' '}
                <Radio checked={oldCase ? oldCase.patientSex === 'female' : Case.patientSex === 'female'} onChange={this.onCaseChange} id="patientSex" name="patientSex" value="female" inline>女</Radio>{' '}
              </Col>
            </FormGroup>

            <FormGroup controlId="patientID">
              <Col componentClass={ControlLabel} sm={2}>
                患者编号
                      </Col>
              <Col sm={6}>
                <FormControl onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="description">
              <Col componentClass={ControlLabel} sm={2}>
                患者描述
                      </Col>
              <Col sm={6}>
                <FormControl onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>
          </div>

          <div className="well" style={wellStyles}>
            <FormGroup controlId="accessionNumber">
              <Col componentClass={ControlLabel} sm={2}>
                accessionNumber
                      </Col>
              <Col sm={6}>
                <FormControl onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="institutionName">
              <Col componentClass={ControlLabel} sm={2}>
                institutionName
                      </Col>
              <Col sm={6}>
                <FormControl onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="referringPhysicianName">
              <Col componentClass={ControlLabel} sm={2}>
                referringPhysicianName
                      </Col>
              <Col sm={6}>
                <FormControl onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="requestedProcedureDescription">
              <Col componentClass={ControlLabel} sm={2}>
                requestedProcedureDescription
                      </Col>
              <Col sm={6}>
                <FormControl onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="studyDate">
              <Col componentClass={ControlLabel} sm={2}>
                studyDate
                      </Col>
              <Col sm={6}>
                <FormControl onChange={this.onCaseChange} type="date" />
              </Col>
            </FormGroup>

            <FormGroup controlId="studyID">
              <Col componentClass={ControlLabel} sm={2}>
                studyID
                      </Col>
              <Col sm={6}>
                <FormControl onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="studyInstanceUID">
              <Col componentClass={ControlLabel} sm={2}>
                studyInstanceUID
                      </Col>
              <Col sm={6}>
                <FormControl onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>
          </div>

          { this.state.Case.seriesList &&
            <div className="well" style={wellStyles}>
              <Table striped bordered condensed hover>
                <thead>
                  <tr>
                    <th>seriesNumber</th>
                    <th>seriesInstanceUID</th>
                    <th>series description</th>
                    <th>total slice number</th>
                    <th>option</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.Case.seriesList.map((obj, index) => {
                    return (
                      <tr key={index}>
                        <td>{obj.seriesNumber}</td>
                        <td>{obj.seriesInstanceUid}</td>
                        <td>{obj.seriesDescription}</td>
                        <td>{obj.total}</td>
                        <td><Button onClick={this.changeSeriesModalState.bind(this, index)}>查看删除</Button></td>
                      </tr>)
                  })
                  }

                </tbody>
              </Table>

            </div>}

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
                  <Button onClick={this.changeFilesModalState}>查看已有图片</Button>
                }
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
          style={{ zIndex: 1999 }}
        />

        <Modal show={this.state.showFilesList} onHide={this.changeFilesModalState}>
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
            <Button onClick={this.changeFilesModalState}>Close</Button>
          </Modal.Footer>
        </Modal>

        <Modal bsSize="small" show={this.state.showSeriesList} onHide={this.changeSeriesModalState.bind(this)}>
          <Modal.Header closeButton>
            <Modal.Title>seriesInstanceUID</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form inline>
              <FormGroup controlId="seriesNumber">
                <ControlLabel>seriesNumber</ControlLabel>
                {' '}
                <FormControl onChange={this.onCaseChange} type="text" />
              </FormGroup>
            </Form>
            <Form inline>
              <FormGroup controlId="seriesInstanceUid">
                <ControlLabel>seriesInstanceUid</ControlLabel>
                {' '}
                <FormControl onChange={this.onCaseChange} type="text" />
              </FormGroup>
            </Form>
            <Form inline>
              <FormGroup controlId="seriesDescription">
                <ControlLabel>seriesDescription</ControlLabel>
                {' '}
                <FormControl onChange={this.onCaseChange} type="text" />
              </FormGroup>
            </Form>
            <Form inline>
              <FormGroup controlId="total">
                <ControlLabel>total slice number</ControlLabel>
                {' '}
                <FormControl onChange={this.onCaseChange} type="text" />
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.removeSeriesHandle.bind(this)} bsStyle="warning">删除</Button>
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