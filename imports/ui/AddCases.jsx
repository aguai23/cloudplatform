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
          enabled: false,
          endpoint: '/delete',
          method: 'DELETE'
        },
        request: {
          endpoint: '/uploads'
        },
        retry: {
          enableAuto: false
        },
        callbacks: {
          onAllComplete: function (ids) {
            // console.log("imageArray", imageArray);
            that.setState({ isUploadFinished: true });
          },
          onComplete: function (id, name, response) {
            let seriesInstanceUIDList = that.state.seriesInstanceUIDList && that.state.seriesInstanceUIDList.length > 0 ? that.state.seriesInstanceUIDList : [];
            if (seriesInstanceUIDList.indexOf(response.dicomInfo.seriesInstanceUID) < 0) {
              let caseInstance = Object.assign({}, that.state.Case);
              for (let key in response.dicomInfo) {
                caseInstance[key] = response.dicomInfo[key];
              }
              let seriesInfo = {
                seriesNumber: caseInstance.seriesNumber,
                seriesInstanceUID: caseInstance.seriesInstanceUID,
                seriesDescription: caseInstance.seriesDescription,
                seriesDate: caseInstance.seriesDate,
                seriesTime: caseInstance.seriesTime
              }
              if (caseInstance.seriesList && caseInstance.seriesList.length) {
                caseInstance.seriesList.push(seriesInfo)
              } else {
                caseInstance.seriesList = [seriesInfo]
              }
              seriesInstanceUIDList.push(seriesInfo.seriesInstanceUID)
              that.setState({
                Case: caseInstance,
                seriesInstanceUIDList: seriesInstanceUIDList
              });
            }
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
        patientName: undefined,
        patientBirthDate: undefined,
        patientAge: undefined,
        patientSex: undefined,
        studyID: undefined,
        studyInstanceUID: '',
        studyDate: undefined,
        studyTime: undefined,
        modality: undefined,
        bodyPart: undefined,
        studyDescription: undefined,
        seriesList: undefined,
      },
      // oldFileList: oldCase ? oldCase.files : [],
      oldCase: oldCase,
      isUploadFinished: true,
      showFilesList: false,
      showSeriesList: false,

      selectedFiles: []
    };

    this.onCaseChange = this.onCaseChange.bind(this);
    this.submitCases = this.submitCases.bind(this);
    this.modifyCase = this.modifyCase.bind(this);
    this.changeFilesModalState = this.changeFilesModalState.bind(this);
    // this.changeSeriesModalState = this.changeSeriesModalState.bind(this);
  }
  componentDidMount() {
    let fileInput = ReactDOM.findDOMNode(this.refs.customAttributes);
    // fileInput.setAttribute('webkitdirectory', '');
    // fileInput.setAttribute('directory', '');
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
      // const { oldCase } = this.state;
      // if (['seriesNumber', 'seriesInstanceUID', 'files', 'seriesDescription', 'total'].indexOf(input.target.id) < 0) {
      //   oldCase[input.target.id] = input.target.value;
      // } else {
      //   //seriesData
      //   if (!oldCase.seriesList[index]) {
      //     oldCase.seriesList[index] = {}
      //   }
      //   oldCase.seriesList[index][input.target.id] = input.target.value
      // }
      // this.setState({
      //   oldCase
      // })
    } else {
      const { Case } = this.state;
      if (['seriesNumber', 'seriesInstanceUID', 'files', 'seriesDescription', 'seriesDate', 'seriesTime', 'total'].indexOf(input.target.id) < 0) {
        Case[input.target.id] = input.target.value;
      } else {
        //seriesData
        let { currentSeries,Case } = this.state
        Case.seriesList.map((obj,index)=>{
          if(obj.seriesInstanceUID === currentSeries.seriesInstanceUID){
            Case.seriesList[index][input.target.id] = input.target.value
          }
        })
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
      && Case.studyDate && Case.studyID && Case.studyInstanceUID && Case.studyDescription && Case.seriesList && Case.bodyPart

    if (!flag) {
      toast.error("请检验并完善信息", { position: toast.POSITION.BOTTOM_RIGHT });
      return;
    } else {
      const standardCase = {
        accessionNumber: Case.accessionNumber,
        patientID: Case.patientID,
        patientName: Case.patientName,
        patientBirthDate: Case.patientBirthDate,
        patientAge: Case.patientAge,
        patientSex: Case.patientSex,
        studyID: Case.studyID,
        studyInstanceUID: Case.studyInstanceUID,
        studyDate: Case.studyDate,
        studyTime: Case.studyTime,
        modality: Case.modality,
        bodyPart: Case.bodyPart,
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
        currentSeries: this.state.Case.seriesList[index]
      })
    } else {
      this.setState({
        showSeriesList: !showSeriesState
      })

    }
  }

  removeSeriesHandle() {
    Meteor.call('removeSeries', this.state.currentSeries.seriesInstanceUID, function (err, res) {
      if (err) {
        return console.log(err);
      }
      console.log(res);
    })
    this.changeSeriesModalState()
  }

  deleteFile(file) {
    // let fileInfo = file.split('/');
    // HTTP.call("DELETE", `/delete/${fileInfo[2]}`, (err, result) => {
    //   if (err) {
    //     toast.error(`somethings wrong${error.reason}`, { position: toast.POSITION.BOTTOM_RIGHT });
    //   } else {
    //     let list = this.state.oldFileList;
    //     let position = list.indexOf(file);
    //     list.splice(position, 1);
    //     let newCase = this.state.oldCase;
    //     newCase.files = list
    //     Meteor.call('modifyCase', newCase, (error) => {
    //       if (error) {
    //         toast.error(`somethings wrong${error.reason}`, { position: toast.POSITION.BOTTOM_RIGHT });
    //       } else {
    //         this.setState({
    //           oldFileList: list
    //         });
    //       }
    //     });
    //     toast.success(result.content, { position: toast.POSITION.BOTTOM_RIGHT });
    //   }
    // })
  }

  selectFile() {
    let files = document.getElementById('customUploader').files;

    console.log(files);

    if(files && files.length > 0) {
      let selectedFiles = [];

      for(let i=0; i < files.length; i++) {
        let fileSize = 0;

        if(files[i].size > 1024 * 1024) {
          fileSize = (Math.round(files[i].size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
        } else {
          fileSize = (Math.round(files[i].size * 100 / 1024) / 100).toString() + 'KB';
        }

        let temp = files[i].name.split('.');

        selectedFiles.push({
          name: files[i].name,
          size: fileSize,
          ext: temp.length > 0 ? temp[temp.length - 1] : ''
        });
      }

      this.setState({
        selectedFiles: selectedFiles
      });
    }
  }

  uploadFile() {
    console.log('upload started at: ' + new Date());
    let xhr = new XMLHttpRequest();

    let files = document.getElementById('customUploader').files;

    let formData = new FormData();

    for(let i = 0; i < files.length; i++) {
      formData.append('uploads[]', files[i], files[i].name);
    }

    xhr.addEventListener("load", this.onUploadComplete, false);

    xhr.open("POST", "http://192.168.12.142:3000/uploads");
    xhr.send(formData);

  }

  onUploadComplete(res) {
    console.log('res', res.target.response);
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
                <FormControl value={Case.patientName} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="patientBirthDate">
              <Col componentClass={ControlLabel} sm={2}>
                出生日期
                      </Col>
              <Col sm={6}>
                <FormControl value={Case.patientBirthDate} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="patientAge">
              <Col componentClass={ControlLabel} sm={2}>
                患者年龄
                      </Col>
              <Col sm={6}>
                <FormControl value={parseInt(Case.patientAge)} type="number" />
              </Col>
            </FormGroup>

            <FormGroup controlId="patientSex">
              <Col componentClass={ControlLabel} sm={2}>
                患者性别
                    </Col>
              <Col sm={6}>
                <Radio checked={Case.patientSex === 'M'} onChange={this.onCaseChange} id="patientSex" name="patientSex" value="male" inline>男</Radio>{' '}
                <Radio checked={Case.patientSex === 'F'} onChange={this.onCaseChange} id="patientSex" name="patientSex" value="female" inline>女</Radio>{' '}
              </Col>
            </FormGroup>

            <FormGroup controlId="patientID">
              <Col componentClass={ControlLabel} sm={2}>
                患者编号
                      </Col>
              <Col sm={6}>
                <FormControl value={Case.patientID} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

          </div>

          <div className="well" style={wellStyles}>
            <FormGroup controlId="accessionNumber">
              <Col componentClass={ControlLabel} sm={2}>
                accessionNumber
                      </Col>
              <Col sm={6}>
                <FormControl value={Case.accessionNumber} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="studyID">
              <Col componentClass={ControlLabel} sm={2}>
                studyID
                      </Col>
              <Col sm={6}>
                <FormControl value={Case.studyID} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="studyInstanceUID">
              <Col componentClass={ControlLabel} sm={2}>
                studyInstanceUID
                      </Col>
              <Col sm={6}>
                <FormControl value={Case.studyInstanceUID} onChange={this.onCaseChange} type="text" readOnly />
              </Col>
            </FormGroup>

            <FormGroup controlId="studyDate">
              <Col componentClass={ControlLabel} sm={2}>
                studyDate
                      </Col>
              <Col sm={6}>
                <FormControl value={Case.studyDate} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="studyTime">
              <Col componentClass={ControlLabel} sm={2}>
                studyTime
                      </Col>
              <Col sm={6}>
                <FormControl value={Case.studyTime} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="modality">
              <Col componentClass={ControlLabel} sm={2}>
                modality
                      </Col>
              <Col sm={6}>
                <FormControl value={Case.modality} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="bodyPart">
              <Col componentClass={ControlLabel} sm={2}>
                身体部位
                      </Col>
              <Col sm={6}>
                <FormControl value={Case.bodyPart} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="studyDescription">
              <Col componentClass={ControlLabel} sm={2}>
                描述
                      </Col>
              <Col sm={6}>
                <FormControl value={Case.studyDescription} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>
          </div>

          {this.state.Case.seriesList &&
            <div className="well" style={wellStyles}>
              <Table striped bordered condensed hover>
                <thead>
                  <tr>
                    <th>seriesNumber</th>
                    <th>seriesInstanceUID</th>
                    <th>series description</th>
                    <th>series date</th>
                    <th>series time</th>
                    <th>total</th>
                    <th>option</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.Case.seriesList.map((obj, index) => {
                    return (
                      <tr key={index}>
                        <td>{obj.seriesNumber}</td>
                        <td>{obj.seriesInstanceUID}</td>
                        <td>{obj.seriesDescription}</td>
                        <td>{obj.seriesDate}</td>
                        <td>{obj.seriesTime}</td>
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

        <form id="form1" encType="multipart/form-data" method="post">
          <div>
            <label htmlFor="customUploader">Select a file to upload</label>
            <input type="file" id="customUploader" ref='customAttributes' multiple onChange={() => this.selectFile()}></input>
            <input type="button" onClick={() => this.uploadFile()} value="Upload" />
          </div>
        </form>
        <div>
          <div>
            <div className="col-sm-4">Name</div>
            <div className="col-sm-4">Size</div>
            <div className="col-sm-4">Ext</div>
          </div>
          <div>
            {
              this.state.selectedFiles.map((file, i) => {
                return (
                  <div key={'file' + i}>
                    <div className="col-sm-4">{file.name}</div>
                    <div className="col-sm-4">{file.size}</div>
                    <div className="col-sm-4">{file.ext}</div>
                  </div>
                );
              })
            }
          </div>
        </div>
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
                <FormControl value={this.state.currentSeries && this.state.currentSeries.seriesNumber} onChange={this.onCaseChange} type="text" />
              </FormGroup>
            </Form>
            <Form inline>
              <FormGroup controlId="seriesInstanceUID">
                <ControlLabel>seriesInstanceUID</ControlLabel>
                {' '}
                <FormControl value={this.state.currentSeries && this.state.currentSeries.seriesInstanceUID} onChange={this.onCaseChange} type="text" readOnly/>
              </FormGroup>
            </Form>
            <Form inline>
              <FormGroup controlId="seriesDescription">
                <ControlLabel>seriesDescription</ControlLabel>
                {' '}
                <FormControl value={this.state.currentSeries && this.state.currentSeries.seriesDescription} onChange={this.onCaseChange} type="text" />
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
            <Button onClick={this.removeSeriesHandle.bind(this, )} bsStyle="warning">删除</Button>
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
