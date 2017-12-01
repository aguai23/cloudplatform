import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Button, ControlLabel, DropdownButton, Form, FormControl, FormGroup, MenuItem, Modal } from 'react-bootstrap';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { browserHistory, Link } from 'react-router';
import { toast, ToastContainer } from 'react-toastify';

import { Cases } from '../api/cases';
import { DataCollections } from '../api/dataCollections';
import DatasetMenu from './DatasetMenu.jsx';
import CustomEventEmitter from '../library/CustomEventEmitter';

import "./css/caseList.css";
import './css/common/eightCols.css';

export class CaseList extends Component {
  constructor(props) {
    super(props);

    let cases = undefined;
    if(props.location.state === 'FAVORITE') {
      let collection = DataCollections.findOne({name : props.params.collectionName});
      let caseList = collection && collection.caseList ? collection.caseList : [];
      cases = Cases.find({ _id: {$in: caseList}}).fetch();
    } else {
      cases = Cases.find({ collectionName: props.params.collectionName }).fetch();
    }

    this.newFavCollection = {
      type: 'FAVORITE',
      ownerId: Meteor.userId(),
      caseList: []
    };

    this.state = {
      cases: cases,
      dataCollections: [],
      isSearchClicked: false,
      patientID: "",
      patientName: "",
      patientAge: 0,
      patientSex: "性别",
      modality: "设备",
      startTime: "",
      endTime: "",
      showModal: false
    };

    this.searchCase = this.searchCase.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleModalitySelect = this.handleModalitySelect.bind(this);
    this.handleSexSelect = this.handleSexSelect.bind(this);
    this.onTabSelectHandler = this.onTabSelectHandler.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.cases !== this.state.cases) {
      this.setState({ cases: nextProps.cases });
    }
  }

  componentDidMount() {
    this.setState({
      containerHeight: window.innerHeight - document.getElementById('header').clientHeight
    });

    let eventEmitter = new CustomEventEmitter();
    eventEmitter.subscribe('tabKeyChanged', (data) => {
      browserHistory.push({
        pathname: '/datasets',
        state: {
          tabActiveKey: data.tabActiveKey
        }
      });
    });
  }

  componentWillUnmount() {
    let eventEmitter = new CustomEventEmitter();
    eventEmitter.unsubscribe('tabKeyChanged');
  }

  /**
   * delete case
   * @param caseId
   */
  deleteCase(caseId) {
    let { cases } = this.state;
    let pathList = [];
    _.each(cases, (obj) => {
      if (obj._id === caseId) {
        _.each(obj.seriesList, (series) => {
          pathList.push(series.path)
        })
      }
    });
    Meteor.call('deleteCase', caseId, (error) => {
      if (error) {
        toast.error("somethings wrong at deleteCase" + error.reason, { position: toast.POSITION.BOTTOM_RIGHT });
        return false
      } else {
        _.each(pathList, (path) => {
          Meteor.call('removeSeries', path, function (err, res) {
            if (err) {
              toast.error("somethings wrong at delete files" + error.reason, { position: toast.POSITION.BOTTOM_RIGHT });
            } else {
              return false
            }
          })
        });
        toast.success("病例删除成功", { position: toast.POSITION.BOTTOM_RIGHT });
      }
    });
  }

  /**
   * search case
   */
  searchCase() {
    const patientID = this.state.patientID;
    const patientName = this.state.patientName;
    const patientAge = this.state.patientAge;
    const patientSex = this.state.patientSex;
    const modality = this.state.modality;
    const startTime = this.state.startTime;
    const endTime = this.state.endTime;
    let query = {};
    if (patientID.length > 0) {
      query.patientID = { $regex: ".*" + patientID + ".*" };
    }
    if (patientName.length > 0) {
      query.patientName = { $regex: ".*" + patientName + ".*" };
    }
    if (['不限', '性别'].indexOf(patientSex) < 0) {
      query.patientSex = patientSex
    }
    if (patientAge > 0) {
      query.patientAge = "0" + patientAge + "Y";
    }
    if (['不限', '设备'].indexOf(modality) < 0) {
      query.modality = modality;
    }
    if (startTime.length > 0 || endTime.length > 0) {
      let startDate = new Date(startTime ? startTime : Date.now());
      let endDate = new Date(endTime ? endTime : Date.now());
      query["$where"] = function () {
        let date = undefined;
        if (this.studyDate.length === 8) {
          date = new Date(this.studyDate.substr(0, 4) + "-" +
            this.studyDate.substr(4, 2) + "-" + this.studyDate.substr(6, 2));
        }
        return date <= endDate && date >= startDate;
      }
    }
    this.setState({
      isSearchClicked: true,
      cases: Cases.find(query).fetch()
    });
  }

  reset() {
    this.setState({
      isSearchClicked: false,
      cases: this.props.cases
    });
  }

  /**
   * link to new case page
   * @param caseId
   */
  jumpTo(caseId) {
    browserHistory.push(`/newCase?id=${caseId}&collection=${this.props.params.collectionName}`);
  }

  /**
   * store input into state
   * @param event
   */
  handleInputChange(event) {
    const value = event.target.value;
    const name = event.target.name;
    this.setState({
      [name]: value
    });
  }

  handleSexSelect(eventKey) {
    this.setState({
      patientSex: eventKey
    })
  }

  handleModalitySelect(eventKey) {
    this.setState({
      modality: eventKey
    })
  }

  onTabSelectHandler(eventKey) {
    event.preventDefault();
    browserHistory.replace(`/datasets?key=${eventKey}`)
  }

  openFavModal(caseId) {
    let dataCollections = DataCollections.find({type: 'FAVORITE'}).fetch();
    this.favCaseId = caseId;
    this.setState({
      showModal: true,
      dataCollections: dataCollections
    });
  }

  onFavoriteSelect(eventKey) {
    this.favCollectionIndex = eventKey;
    document.getElementById('dropdown-basic-fav').innerHTML = `${this.state.dataCollections[eventKey].name} <span class='caret'></span>`;
  }

  addToFavorite() {
    if(this.favCollectionIndex === undefined) {
      return toast.warning('请先选择一个收藏数据集');
    }

    let collection = this.state.dataCollections[this.favCollectionIndex];

    if(collection.caseList === undefined) {
      collection.caseList = [];
    }

    for(let i = 0; i < collection.caseList.length; i++) {
      if(collection.caseList[i] === this.favCaseId) {
        toast.warning("收藏失败：该收藏夹中已包含本病例");
        return;
      }
    }

    collection.caseList.push(this.favCaseId);

    Meteor.call('updateDataCollection', collection, (err) => {
      if (err) {
        return toast.error("收藏失败" + error.reason);
      }

      toast.success("成功病例收藏");
      this.favCollectionIndex = undefined;
      this.setState({ showModal: false });
    });
  }

  createAndFavorite() {
    if(this.newFavCollection.name === undefined) {
      return toast.warning('请输入新建收藏数据集名称');
    }

    if(this.newFavCollection.equip === undefined) {
      return toast.warning('请输入设备名称');
    }

    this.newFavCollection.caseList = [this.favCaseId];

    Meteor.call('insertDataCollection', this.newFavCollection, (err) => {
      if(err) {
        return toast.error("新建收藏数据集失败" + error.reason);
      }

      this.newFavCollection = {};
      toast.success("成功病例收藏");
      this.setState({ showModal: false });
    });
  }

  getAddToFavoriteModal() {
    let title = "选择收藏数据集";
    return (
      <Modal className="caselist-fav-modal" show={this.state.showModal} onHide={() => this.setState({ showModal: false })} >
        <Modal.Header className="caselist-favorite-modal-header">
          <div>
            <Modal.Title className="caselist-favorite-modal-title">收藏病例</Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body>
          <div className="col-sm-6 caselist-fav-modal-left">
            <DropdownButton bsStyle="default" title={title} id={`dropdown-basic-fav`} onSelect={(eventKey) => this.onFavoriteSelect(eventKey)}>
              {
                this.state.dataCollections.map((collection, i) => {
                  return <MenuItem key={i} eventKey={i}>{collection.name}</MenuItem>
                })
              }
            </DropdownButton>
            <div>
              <Button className="btn btn-default" onClick={() => this.addToFavorite()}>收藏</Button>
            </div>
          </div>
          <div className="col-sm-6">
            收藏到新建数据集
            <input type="text" placeholder="收藏数据集名称" onChange={(evt) => this.newFavCollection.name = evt.target.value}></input>
            <input type="text" placeholder="设备名称" onChange={(evt) => this.newFavCollection.equip = evt.target.value}></input>
            <Button className="btn btn-default" onClick={() => this.createAndFavorite()}>新建并收藏</Button>

          </div>
        </Modal.Body>
      </Modal>
    );
  }

  render() {
    const self = this;
    let tHead = this.state.cases.length > 0 ?
      <tr>
        <th>流水号</th>
        <th>检查号</th>
        <th>姓名</th>
        <th>年龄</th>
        <th>影像号</th>
        <th>设备</th>
        <th>影像时间</th>
        <th>生日</th>
        <th>影像描述</th>
        <th></th>
      </tr> :
      <tr><th>未找到符合搜索条件的病例</th></tr>;

    let searchResult = this.state.isSearchClicked ? ("共计" + this.state.cases.length + "条搜索结果") : undefined;

    return (
      <div>
        {this.getAddToFavoriteModal()}
        <div className="caseList_header">
          <span>
            {this.props.location.state === 'PUBLIC' ? '公共数据集' : '个人数据集'}
            &nbsp; > {this.props.params.collectionName}
          </span>
          <span>
            <Link onClick={browserHistory.goBack} style={{ marginRight: '20px' }}>
              <i className="fa fa-undo caseList_littleMargin" />返回
            </Link>
            <Link to={`/newCase?collection=${this.props.params.collectionName}`}>
              <i className="fa fa-plus caseList_littleMargin" />新建
            </Link>
          </span>
        </div>
        <div className="caseList_searchBar">
          <div className="caseList_searchBar_container caseList_searchBar_patientID">
            <div className="caseList_searchBar_headerText" style={{width:'36px'}}>
              <span>检查号</span>
            </div>
            <div className="caseList_middleLine" />
            <input name="patientID" onChange={this.handleInputChange} className="caseList_input caseList_input_patientID" type="text" />
            <span className="caseList_border"></span>
          </div>

          <div className="caseList_searchBar_container caseList_searchBar_patientName">
            <div className="caseList_searchBar_headerText">
              <span>姓名</span>
            </div>
            <div className="caseList_middleLine" />
            <input name="patientName" onChange={this.handleInputChange} className="caseList_input caseList_input_patientName" type="text" />
            <span className="caseList_border"></span>
          </div>

          <div className="caseList_searchBar_container caseList_searchBar_patientAge">
            <div className="caseList_searchBar_headerText">
              <span>年龄</span>
            </div>
            <div className="caseList_middleLine" />
            <input name="patientAge" onChange={this.handleInputChange} className="caseList_input caseList_input_patientAge" type="text " />
            <span className="caseList_border"></span>
          </div>

          <div className="caseList_searchBar_container caseList_searchBar_patientSex">
            <div className="caseList_searchBar_headerText">
              <span>性别</span>
            </div>
            <div className="caseList_middleLine" />
            <select style={{ paddingTop: '0px' }} onChange={this.handleInputChange} className="caseList_input caseList_input_patientSex" name="patientSex" id="patientSex">
              <option value="不限">不限</option>
              <option value="M">男</option>
              <option value="F">女</option>
            </select>
            <span className="caseList_border"></span>
          </div>

          <div className="caseList_searchBar_container caseList_searchBar_modality">
            <div className="caseList_searchBar_headerText">
              <span>设备</span>
            </div>
            <div className="caseList_middleLine" />
            <select onChange={this.handleInputChange} className="caseList_input caseList_input_modality" name="modality" id="modality">
              <option value="不限">不限</option>
              <option value="CT">CT</option>
              <option value="MRI">MRI</option>
              <option value="DSA">DSA</option>
              <option value="DR">DR</option>
              <option value="CR">CR</option>
              <option value="RF">RF</option>
              <option value="MG">MG</option>
              <option value="US">US</option>

            </select>
            <span className="caseList_border"></span>
          </div>

          <div className="caseList_searchBar_container caseList_searchBar_time">
            <div className="caseList_searchBar_headerText">
              <span>时间</span>
            </div>
            <div className="caseList_middleLine" />
            <input name="startTime" onChange={this.handleInputChange} className="caseList_input caseList_input_time" style={{ marginRight: '0px' }} type="date" />
            {/* <i style={{ marginTop: 'auto',marginBottom: 'auto' }}>-</i> */}
            <span style={{ marginTop: 'auto',marginBottom: 'auto' }}>-</span>
            <input name="endTime" onChange={this.handleInputChange} className="caseList_input caseList_input_time" style={{ marginLeft: '0px', marginRight: '1px' }} type="date" />
            <span className="caseList_border"></span>
          </div>

          <div className="caseList_buttonList" onClick={this.searchCase}>
            <div className="caseList_buttonContainer">
              <div className="caseList_buttonText">
                <span>查询</span>
              </div>
            </div>

            <div className="caseList_buttonContainer" onClick={() => this.reset()} style={{ marginRight: '0px' }}>
              <div className="caseList_buttonText">
                <span>重置</span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="searchResult">{searchResult}</div>
          <table className="caseList_table">
            <thead className="caseList_thead">
              {tHead}
            </thead>
            <tbody className="bottom-div">
              {this.state.cases.length > 0 && this.state.cases.map((specificCase) => {
                return (
                  <tr className="caseList_tr" key={specificCase._id} onDoubleClick={() => self.jumpTo(specificCase._id)}>
                    <td style={{maxWidth:'150px'}}><span>{specificCase.accessionNumber}</span></td>
                    <td style={{maxWidth:'110px'}}><span className="caseList_td_patientID">{specificCase.patientID}</span></td>
                    <td><span className="caseList_td_patientName">{specificCase.patientName}</span></td>
                    <td><span>{specificCase.patientAge}</span></td>
                    <td><span>{specificCase.studyID}</span></td>
                    <td><span>{specificCase.modality}</span></td>
                    <td><span>{specificCase.studyDate}</span></td>
                    <td><span>{specificCase.patientBirthDate}</span></td>
                    <td style={{maxWidth:'150px'}}><span className="caseList_td_studyDescription">{specificCase.studyDescription}</span></td>
                    <td>
                      <div className="caseList_optionList">
                        <Button onClick={() => {
                          browserHistory.push({
                            pathname: '/viewer',
                            state: {
                              studyUID: specificCase.studyInstanceUID,
                              seriesNumber: specificCase.seriesList[0].seriesNumber
                            }
                          });
                        }} className="btn-tool btn-delete" >影像</Button>
                        <Button onClick={() => {
                          browserHistory.push(`/newCase?id=${specificCase._id}&&collection=${this.props.params.collectionName}`)
                        }} className="btn-tool btn-delete">编辑</Button>
                        <Button onClick={() => this.openFavModal(specificCase._id)} className="btn-tool btn-delete"
                          style={{display: this.props.location.state === 'FAVORITE' ? 'none' : 'inline'}}>收藏</Button>
                        <Button onClick={self.deleteCase.bind(this, specificCase._id)} className="btn-tool btn-delete">删除</Button>
                      </div>
                    </td>
                  </tr>
                )
              })
              }
            </tbody>
          </table>
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
      </div >
    )
  }
}

CaseList.contextTypes = {
  router: React.PropTypes.object
};

export default withTracker(props => {
  Meteor.subscribe('cases');
  Meteor.subscribe('dataCollections');

  let cases = undefined;
  if(props.location.state === 'FAVORITE') {
    let collection = DataCollections.findOne({name : props.params.collectionName});
    let caseList = collection && collection.caseList ? collection.caseList : [];
    cases = Cases.find({ _id: {$in: caseList}}).fetch();
  } else {
    cases = Cases.find({ collectionName: props.params.collectionName }).fetch();
  }

  return {
    cases: cases
  }
})(CaseList);
