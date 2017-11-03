import React, { Component } from 'react';
import { Meteor } from 'meteor/meteor';
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

import dicomParser from 'dicom-parser';

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
        accessionNumber: '',
        patientID: '',
        patientName: '',
        patientBirthDate: '',
        patientAge: '',
        patientSex: '',
        studyID: '',
        studyInstanceUID: '',
        studyDate: '',
        studyTime: '',
        modality: '',
        bodyPart: '',
        studyDescription: '',
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
    // this.onUploadComplete = this.onUploadComplete.bind(this)
  }
  componentDidMount() {
    let fileInput = ReactDOM.findDOMNode(this.refs.customAttributes);
    fileInput.setAttribute('webkitdirectory', '');
    fileInput.setAttribute('directory', '');
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.case !== this.state.oldCase) {
      let seriesInstanceUIDList = new Array();
      _.each(nextProps.case.seriesList, (obj) => {
        seriesInstanceUIDList.push(obj.seriesInstanceUID)
      })
      this.setState({
        oldCase: nextProps.case,
        oldFileList: nextProps.case.files,
        seriesInstanceUIDList
      });
    }
  }

  onCaseChange(input) {
    if (this.state.oldCase) {
      let { currentSeries, oldCase } = this.state
      if (['seriesNumber', 'seriesInstanceUID', 'files', 'seriesDescription', 'seriesDate', 'seriesTime', 'total'].indexOf(input.target.id) < 0) {
        oldCase[input.target.id] = input.target.value;
      } else {
        //seriesData
        oldCase.seriesList.map((obj, index) => {
          if (obj.seriesInstanceUID === currentSeries.seriesInstanceUID) {
            oldCase.seriesList[index][input.target.id] = input.target.value
          }
        })
      }
      this.setState({
        oldCase
      })
    } else {
      const { Case } = this.state;
      if (['seriesNumber', 'seriesInstanceUID', 'files', 'seriesDescription', 'seriesDate', 'seriesTime', 'total'].indexOf(input.target.id) < 0) {
        Case[input.target.id] = input.target.value;
      } else {
        //seriesData
        let { currentSeries } = this.state
        Case.seriesList.map((obj, index) => {
          if (obj.seriesInstanceUID === currentSeries.seriesInstanceUID) {
            Case.seriesList[index][input.target.id] = input.target.value
          }
        })
      }
      this.setState({
        Case
      })
    }
  }

  /**
   * sort seriesList according to series number
   * @returns the sorted seriesList
   */
  sortListByIndex(seriesList) {
    seriesList.sort(function (a, b) {
      return a.seriesNumber.localeCompare(b.seriesNumber);
    });
  }

  submitCases(event) {
    event.preventDefault();

    if (!isUploadFinished) return;

    const { Case } = this.state;
    const flag = Case.accessionNumber &&
      Case.patientID && Case.patientAge
      && Case.patientName && Case.patientBirthDate
      && Case.patientSex && Case.studyID
      && Case.studyInstanceUID && Case.studyDate
      && Case.studyTime && Case.modality && Case.bodyPart
      && Case.studyDescription && Case.seriesList

    if (!flag) {
      toast.error("请检验并完善信息", { position: toast.POSITION.BOTTOM_RIGHT });
      return;
    } else {
      const sortedSeriesList = this.state.Case.seriesList.slice();
      this.sortListByIndex(sortedSeriesList);

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
        seriesList: sortedSeriesList,
        collectionID: this.state.collectionId,
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
    delete oldCase.creator;
    delete oldCase.createAt;
    delete oldCase.collectionID;
    // return
    // oldCase.files = oldCase.files.concat(imageArray);
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
    const showSeriesState = this.state.showSeriesList;
    const { oldCase, Case } = this.state;
    if (!showSeriesState) {
      this.setState({
        showSeriesList: !showSeriesState,
        currentSeries: oldCase ? oldCase.seriesList[index] : Case.seriesList[index]
      })
    } else {
      this.setState({
        showSeriesList: !showSeriesState
      })

    }
  }

  removeSeries() {
    // console.log(this.state.currentSeries.path)
    // return;
    const that = this;
    const { Case, oldCase, currentSeries, seriesInstanceUIDList } = this.state;
    if ((oldCase && oldCase.seriesList.length < 2) || (Case.seriesList && Case.seriesList.length < 2)) {
      toast.warning('series不能少于一个！', { position: toast.POSITION.BOTTOM_RIGHT });
      return false;
    }
    console.log(123)
    // return
    Meteor.call('removeSeries', currentSeries.path, function (err, res) {
      if (err) {
        return console.log(err);
      }
      let seriesList = oldCase ? oldCase.seriesList : Case.seriesList
      _.each(seriesList, (obj, index) => {
        if (obj.seriesInstanceUID === currentSeries.seriesInstanceUID) {
          seriesList.splice(index, 1)
        }
      })
      _.each(seriesInstanceUIDList, (obj, index) => {
        if (obj === currentSeries.seriesInstanceUID) {
          seriesInstanceUIDList.splice(index, 1)
        }
      })
      if (oldCase) {
        oldCase.seriesList = seriesList;
        modifyCase = {
          _id: oldCase._id,
          seriesList: seriesList
        }
        Meteor.call('modifyCase', modifyCase, (error) => {
          if (error) {
            toast.error(`somethings wrong${error.reason}`, { position: toast.POSITION.BOTTOM_RIGHT });
          } else {
            that.setState({
              currentSeries: {},
              oldCase,
              seriesInstanceUIDList
            })
            toast.success("series删除成功", { position: toast.POSITION.BOTTOM_RIGHT });
          }
        })
      } else {
        Case.seriesList = seriesList
        that.setState({
          currentSeries: {},
          Case,
          seriesInstanceUIDList
        })
      }
      that.changeSeriesModalState()
    })
  }

  deleteFile(file) {
    /* let fileInfo = file.split('/');
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
      }) */
  }

  /**
   * Parse one dicom file, which is used to get common information when uploading
   * @param filePath the absolute path where the dicom placed
   * @return {Object} the standard dicom information
   */
  parseSingleDicom(file, cb) {
    let reader = new FileReader();

    reader.onloadend = function (event) {
      // let buffer = new Buffer(event.target.result);
      // console.log(buffer);
      let result = {};

      let dataset = dicomParser.parseDicom(new Uint8Array(event.target.result));

      result.seriesInstanceUID = dataset.string('x0020000e');
      result.accessionNumber = dataset.string('x00080050');
      result.patientID = dataset.string('x00100020');
      result.patientName = dataset.string('x00100010');
      result.patientBirthDate = dataset.string('x00100030');
      result.patientAge = dataset.string('x00101010');
      result.patientSex = dataset.string('x00100040');
      result.studyID = dataset.string('x00200010');
      result.studyDate = dataset.string('x00080020');
      result.studyTime = dataset.string('x00080030');
      result.studyDescription = dataset.string('x00081030');
      result.studyInstanceUID = dataset.string('x0020000d');
      result.seriesDate = dataset.string('x00080021');
      result.seriesTime = dataset.string('x00080031');
      result.seriesDescription = dataset.string('x0008103e');
      result.seriesNumber = dataset.string('x00200011');
      result.modality = dataset.string('x00080060');
      result.bodyPart = dataset.string('x00180015');

      cb(result);

    }
    reader.readAsArrayBuffer(file);
  }

  selectFile() {
    let files = document.getElementById('customUploader').files;
    if (files && files.length > 0) {
      let selectedFiles = [];
      this.parseSingleDicom(files[0], (res) => {
        let seriesInstanceUIDList = this.state.seriesInstanceUIDList && this.state.seriesInstanceUIDList.length > 0 ? this.state.seriesInstanceUIDList : [];
        if (seriesInstanceUIDList.indexOf(res.seriesInstanceUID) < 0) {
          let caseInstance = res;
          toast.info("开始上传，请稍后", { position: toast.POSITION.BOTTOM_RIGHT });

          //upload Series files
          let date = caseInstance.studyDate ? caseInstance.studyDate : new Date().toISOString().substring(0, 10).replace(/\-/g, '');
          let path = date + '/' + caseInstance.studyInstanceUID + '/' + caseInstance.seriesInstanceUID;
          let xhr = new XMLHttpRequest();
          let formData = new FormData();
          formData.append('path', path);
          for (let i = 0; i < files.length; i++) {
            formData.append(path, files[i], files[i].name);
          }
          xhr.addEventListener("load", this.onUploadComplete.bind(this), false);
          xhr.open("POST", "http://localhost:3000/uploads");
          xhr.send(formData);
          let { Case, oldCase } = this.state;
          let seriesInfo = {
            seriesNumber: caseInstance.seriesNumber,
            seriesInstanceUID: caseInstance.seriesInstanceUID,
            seriesDescription: caseInstance.seriesDescription,
            seriesTime: caseInstance.seriesTime,
            seriesDate: caseInstance.seriesDate,
            total: files.length,
          }
          if (oldCase) {
            let oldList = this.state.oldCase.seriesList
            oldList.push(seriesInfo)
            oldCase.seriesList = oldList
            seriesInstanceUIDList.push(seriesInfo.seriesInstanceUID)
            this.setState({
              oldCase,
              currentSeries: seriesInfo
            })
          } else {
            let oldList = this.state.Case.seriesList
            if (oldList && oldList.length) {
              oldList.push(seriesInfo)
            } else {
              oldList = [seriesInfo]
            }
            caseInstance.seriesList = oldList;
            seriesInstanceUIDList.push(seriesInfo.seriesInstanceUID);
            for (key in Case) {
              if (caseInstance[key] === undefined) {
                caseInstance[key] = Case[key]
              }
            }
            this.setState({
              Case: caseInstance,
              seriesInstanceUIDList: seriesInstanceUIDList,
              currentSeries: seriesInfo
            });
          }
        }
      });

      for (let i = 0; i < files.length; i++) {
        let fileSize = 0;
        if (files[i].size > 1024 * 1024) {
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

  onUploadComplete(res) {
    const { Case, oldCase, currentSeries } = this.state;
    let seriesList = oldCase ? oldCase.seriesList : Case.seriesList;
    _.each(seriesList, (obj, index) => {
      if (obj.seriesInstanceUID === currentSeries.seriesInstanceUID) {
        obj.path = res.target.response
      }
    })
    this.setState(oldCase ? oldCase : Case)
    toast.success("上传成功", { position: toast.POSITION.BOTTOM_RIGHT });
    // let inputDOM = ReactDOM.findDOMNode(this.refs.customAttributes)
    // inputDOM.innerHTML=`<input type="file" id="customUploader" ref='customAttributes' multiple onChange={() => this.selectFile()}></input>`;
    // console.log(ReactDOM.findDOMNode(this.refs.customAttributes).value)
    // console.log(ReactDOM.findDOMNode(this.refs.customAttributes).files)
    //TODO: clear fileList after upload
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
                <FormControl value={oldCase ? oldCase.patientName : Case.patientName} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="patientBirthDate">
              <Col componentClass={ControlLabel} sm={2}>
                出生日期
                      </Col>
              <Col sm={6}>
                <FormControl value={oldCase ? oldCase.patientBirthDate : Case.patientBirthDate} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="patientAge">
              <Col componentClass={ControlLabel} sm={2}>
                患者年龄
                      </Col>
              <Col sm={6}>
                <FormControl value={oldCase ? oldCase.patientAge : Case.patientAge} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="patientSex">
              <Col componentClass={ControlLabel} sm={2}>
                患者性别
                    </Col>
              <Col sm={6}>
                <Radio checked={oldCase ? oldCase.patientSex === 'M' : Case.patientSex === 'M'} onChange={this.onCaseChange} id="patientSex" name="patientSex" value="M" inline>男</Radio>{' '}
                <Radio checked={oldCase ? oldCase.patientSex === 'F' : Case.patientSex === 'F'} onChange={this.onCaseChange} id="patientSex" name="patientSex" value="F" inline>女</Radio>{' '}
              </Col>
            </FormGroup>

            <FormGroup controlId="patientID">
              <Col componentClass={ControlLabel} sm={2}>
                患者编号
                      </Col>
              <Col sm={6}>
                <FormControl value={oldCase ? oldCase.patientID : Case.patientID} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

          </div>

          <div className="well" style={wellStyles}>
            <FormGroup controlId="accessionNumber">
              <Col componentClass={ControlLabel} sm={2}>
                accessionNumber
                      </Col>
              <Col sm={6}>
                <FormControl value={oldCase ? oldCase.accessionNumber : Case.accessionNumber} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="studyID">
              <Col componentClass={ControlLabel} sm={2}>
                studyID
                      </Col>
              <Col sm={6}>
                <FormControl value={oldCase ? oldCase.studyID : Case.studyID} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="studyInstanceUID">
              <Col componentClass={ControlLabel} sm={2}>
                studyInstanceUID
                      </Col>
              <Col sm={6}>
                <FormControl value={oldCase ? oldCase.studyInstanceUID : Case.studyInstanceUID} onChange={this.onCaseChange} type="text" readOnly />
              </Col>
            </FormGroup>

            <FormGroup controlId="studyDate">
              <Col componentClass={ControlLabel} sm={2}>
                studyDate
                      </Col>
              <Col sm={6}>
                <FormControl value={oldCase ? oldCase.studyDate : Case.studyDate} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="studyTime">
              <Col componentClass={ControlLabel} sm={2}>
                studyTime
                      </Col>
              <Col sm={6}>
                <FormControl value={oldCase ? oldCase.studyTime : Case.studyTime} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="modality">
              <Col componentClass={ControlLabel} sm={2}>
                modality
                      </Col>
              <Col sm={6}>
                <FormControl value={oldCase ? oldCase.modality : Case.modality} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="bodyPart">
              <Col componentClass={ControlLabel} sm={2}>
                身体部位
                      </Col>
              <Col sm={6}>
                <FormControl value={oldCase ? oldCase.bodyPart : Case.bodyPart} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>

            <FormGroup controlId="studyDescription">
              <Col componentClass={ControlLabel} sm={2}>
                描述
                      </Col>
              <Col sm={6}>
                <FormControl value={oldCase ? oldCase.studyDescription : Case.studyDescription} onChange={this.onCaseChange} type="text" />
              </Col>
            </FormGroup>
          </div>

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
                {(oldCase ? oldCase.seriesList : Case.seriesList) && (oldCase ? oldCase.seriesList : Case.seriesList).map((obj, index) => {
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

          </div>

          {/* <div className="well" style={wellStyles}>
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
          </div> */}

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

        {/* <Modal show={this.state.showFilesList} onHide={this.changeFilesModalState}>
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
        </Modal> */}

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
                <FormControl value={this.state.currentSeries && this.state.currentSeries.seriesInstanceUID} onChange={this.onCaseChange} type="text" readOnly />
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
              <FormGroup controlId="seriesDate">
                <ControlLabel>seriesDate&nbsp;&nbsp;&nbsp;&nbsp;</ControlLabel>
                {' '}
                <FormControl value={this.state.currentSeries && this.state.currentSeries.seriesDate} onChange={this.onCaseChange} type="text" />
              </FormGroup>
            </Form>
            <Form inline>
              <FormGroup controlId="seriesTime">
                <ControlLabel>seriesTime&nbsp;&nbsp;&nbsp;&nbsp;</ControlLabel>
                {' '}
                <FormControl value={this.state.currentSeries && this.state.currentSeries.seriesTime} onChange={this.onCaseChange} type="text" />
              </FormGroup>
            </Form>
            <Form inline>
              <FormGroup controlId="total">
                <ControlLabel>total slice number</ControlLabel>
                {' '}
                <FormControl value={this.state.currentSeries && this.state.currentSeries.total} onChange={this.onCaseChange} type="text" readOnly />
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.removeSeries.bind(this)} bsStyle="warning">删除</Button>
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
