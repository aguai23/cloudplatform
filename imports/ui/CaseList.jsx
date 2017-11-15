import React, { Component } from 'react';
import { Navbar, Table, Button, Form, FormControl, FormGroup, ControlLabel, Nav, NavItem, Col, InputGroup, DropdownButton, MenuItem } from 'react-bootstrap';
import { Cases } from '../api/cases';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { browserHistory, Link } from 'react-router';
import { toast, ToastContainer } from 'react-toastify';
import DatasetMenu from './DatasetMenu.jsx';
import "./css/caseList.css";
import './css/common/eightCols.css';

export class CaseList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      cases: Cases.find({ collectionName: this.props.params.collectionName }).fetch(),
      isSearchClicked: false,
      patientID: "",
      patientName: "",
      patientAge: 0,
      patientSex: 'M',
      modality: "CT",
      startTime: "",
      endTime: ""
    };

    this.searchCase = this.searchCase.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleModalitySelect = this.handleModalitySelect.bind(this);
    this.handleSexSelect = this.handleSexSelect.bind(this);
    this.onTabSelectHandler = this.onTabSelectHandler.bind(this)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.cases !== this.state.cases) {
      this.setState({ cases: nextProps.cases });
    }
  }

  componentDidMount() {
    this.setState({
      containerHeight: window.innerHeight - document.getElementById('header').clientHeight,
      // bottomDivHeight: window.innerHeight - document.getElementById('header').clientHeight - document.getElementById('searchBar').clientHeight - 120
    });
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
    if (patientSex.length > 0) {
      query.patientSex = patientSex;
    }
    if (patientAge > 0) {
      query.patientAge = "0" + patientAge + "Y";
    }
    if (modality.length > 0) {
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
  static jumpTo(caseId) {
    window.location = "/newCase?id=" + caseId;
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

  render() {
    const that = this;
    let tHead = this.state.cases.length > 0 ?
      <tr>
        <th>流水号</th>
        <th>检查号</th>
        <th>姓名</th>
        <th>年龄</th>
        <th>性别</th>
        <th>影像号</th>
        <th>设备</th>
        <th>影像时间</th>
        <th>生日</th>
        <th>影像描述</th>
        <th>操作</th>
      </tr> :
      <tr><th>未找到符合搜索条件的病例</th></tr>;

    let searchResult = this.state.isSearchClicked ? ("共计" + this.state.cases.length + "条搜索结果") : undefined;

    return (
      <div>
        <div id="modal-base" />
        <div className="eight-cols" style={{ height: this.state.containerHeight }}>
          <div className="col-sm-1 nav-container">
            <DatasetMenu activeKey={this.state.tabActiveKey} selectHandler={this.onTabSelectHandler} />
          </div>
          <div className="col-sm-7 content-container">
            <div className="row" style={{ marginTop: '30px' }}>
              <div className="col-md-2 col-md-offset-10">
                <button onClick={browserHistory.goBack} style={{ border: "none", background: "transparent" }}>
                  <i className={"fa fa-angle-left"} style={{ color: '#255BA8', fontSize: "15px" }}>返回</i>
                </button>
                <Link to={`/newCase?collection=${this.props.params.collectionName}`}>
                  <i className="fa fa-plus" style={{ color: '#255BA8', fontSize: "15px", marginLeft: "20px" }}>新建</i>
                </Link>
              </div>
            </div>
            <div id="searchBar" style={{ height: '80px', marginTop: '5px' }}>
              <div className="row">
                <div className="col-md-5">
                  <div className="col-md-4" style={{ paddingLeft: 0 }}>
                    <FormGroup>
                      <InputGroup>
                        <InputGroup.Addon>检查号</InputGroup.Addon>
                        <FormControl name="patientID" type="text" onChange={this.handleInputChange} />
                      </InputGroup>
                    </FormGroup>
                  </div>
                  <div className="col-md-4" style={{ paddingLeft: 0 }}>
                    <FormGroup>
                      <InputGroup>
                        <InputGroup.Addon>姓名</InputGroup.Addon>
                        <FormControl name="patientName" type="text" onChange={this.handleInputChange} />
                      </InputGroup>
                    </FormGroup>
                  </div>
                  <div className="col-md-4" style={{ paddingLeft: 0, paddingRight: 0 }}>
                    <FormGroup>
                      <InputGroup>
                        <InputGroup.Addon>年龄</InputGroup.Addon>
                        <FormControl name="patientAge" type="text" onChange={this.handleInputChange} />
                      </InputGroup>
                    </FormGroup>
                  </div>
                </div>
                <div className="col-md-4" style={{ paddingLeft: 0 }}>
                  <div className="col-md-7" style={{ paddingLeft: 0 }}>
                    <FormGroup>
                      <InputGroup>
                        <InputGroup.Addon>时间</InputGroup.Addon>
                        <FormControl type='date' name="startTime" value={this.state.startTime} onChange={this.handleInputChange} />
                      </InputGroup>
                    </FormGroup>
                  </div>
                  <div className="col-md-5" style={{ paddingLeft: 0, paddingRight: 0 }}>
                    <FormGroup>
                      <FormControl type='date' name="endTime" value={this.state.endTime} onChange={this.handleInputChange} />

                    </FormGroup>
                  </div>
                </div>
                <div className="col-md-3" style={{ paddingLeft: 0 }}>
                  <DropdownButton id="patientSex" onSelect={this.handleSexSelect} title={this.state.patientSex ? this.state.patientSex === 'M' ? '男' : '女' : "性别"}>
                    <MenuItem eventKey="M">男</MenuItem>
                    <MenuItem eventKey="F">女</MenuItem>
                  </DropdownButton>
                  <DropdownButton id="modality" onSelect={this.handleModalitySelect} title={this.state.modality} style={{ marginLeft: '3px' }}>
                    <MenuItem eventKey="CT">CT</MenuItem>
                    <MenuItem eventKey="MRI">MRI</MenuItem>
                    <MenuItem eventKey="DSA">DSA</MenuItem>
                    <MenuItem eventKey="DR">DR</MenuItem>
                    <MenuItem eventKey="CR">CR</MenuItem>
                    <MenuItem eventKey="RF">RF</MenuItem>
                    <MenuItem eventKey="MG">MG</MenuItem>
                    <MenuItem eventKey="US">US</MenuItem>
                  </DropdownButton>
                  <Button bsStyle="info" style={{ marginLeft: '6px' }} onClick={this.searchCase}>查询</Button>
                  <Button bsStyle="default" style={{ marginLeft: '3px' }} onClick={() => this.reset()}>重置</Button>
                </div>
              </div>
              <div className="container caseList">
                <div className="searchResult">{searchResult}</div>
                <Table striped bordered condensed hover>
                  <thead>
                    {tHead}
                  </thead>
                  <tbody>
                    {this.state.cases.length > 0 && this.state.cases.map((specificCase) => {
                      return (
                        <tr style={{ backgroundColor: "#F5F5F5" }} key={specificCase._id} onDoubleClick={() => CaseList.jumpTo(specificCase._id)}>
                          <td>{specificCase.accessionNumber}</td>
                          <td>{specificCase.patientID}</td>
                          <td>{specificCase.patientName}</td>
                          <td>{specificCase.patientAge}</td>
                          <td>{specificCase.patientSex === 'M' ? '男' : '女'}</td>
                          <td>{specificCase.studyID}</td>
                          <td>{specificCase.modality}</td>
                          <td>{specificCase.studyDate}</td>
                          <td>{specificCase.patientBirthDate}</td>
                          <td>{specificCase.studyDescription}</td>
                          <td>
                            <Link to={{
                              pathname: '/viewer',
                              state: { caseId: specificCase._id }
                            }} className="glyphicon glyphicon-picture" />
                            &nbsp;&nbsp;&nbsp;
                        <Link to={`/newCase?id=${specificCase._id}&&collection=${this.props.params.collectionName}`} className="glyphicon glyphicon-pencil" />
                            &nbsp;&nbsp;&nbsp;
                        <span className="glyphicon glyphicon-trash" onClick={that.deleteCase.bind(this, specificCase._id)} />
                          </td>
                        </tr>
                      )
                    })
                    }
                  </tbody>
                </Table>
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
            </div>

          </div>
        </div>
      </div>
    )
  }
}

CaseList.contextTypes = {
  router: React.PropTypes.object
};

export default withTracker(props => {
  const handle = Meteor.subscribe('cases');
  return {
    cases: Cases.find({ collectionName: props.params.collectionName }).fetch(),
    listLoading: !handle.ready()
  }
})(CaseList);
