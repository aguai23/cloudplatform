import React, { Component } from 'react';
import { Navbar, FormGroup, FormControl, Table, Button } from 'react-bootstrap';
import { Cases } from '../api/cases';
import { DataCollections } from '../api/dataCollections';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { browserHistory, Link } from 'react-router';
import { toast, ToastContainer } from 'react-toastify';
import "./css/caseList.css";
const style = {
  searchResult: {
    marginTop: '10px',
    marginBottom: '20px',
    paddingLeft: '20px',
    fontSize: '18px'
  },
  searchBar:{
    width: "17%",
    height: "50%",
    marginLeft:"10px",
    float: "left",
    borderStyle: "solid",
    borderColor: "darkcyan",
    backgroundColor: "aliceblue"
  },
  caseList:{
    marginRight: "10px",
    width:"80%",
    marginTop: "10px",
    float: "right"
  },
  formElement:{
    marginTop: "20px",
    marginBottom: "30px",
    marginLeft:"20px"
  }
};

export class CaseList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      cases: Cases.find({ collectionName: this.props.params.collectionName }).fetch(),
      isSearchClicked: false,
      studyID:"",
      patientName:"",
      patientAge:0,
      patientSex:"M",
      modality:"CT",
      startTime:"",
      endTime:""
    };

    this.searchCase = this.searchCase.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.cases !== this.state.cases) {
      this.setState({ cases: nextProps.cases });
    }
  }

  deleteCase(caseId) {
    let { cases } = this.state;
    let pathList = new Array()
    _.each(cases, (obj) => {
      if (obj._id === caseId) {
        _.each(obj.seriesList, (series) => {
          pathList.push(series.path)
        })
      }
    })
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
        })
        toast.success("病例删除成功", { position: toast.POSITION.BOTTOM_RIGHT });
      }
    });
  }

  searchCase() {
    const studyID = this.state.studyID;
    const patientName = this.state.patientName;
    const patientAge = this.state.patientAge;
    const patientSex = this.state.patientSex;
    const modality = this.state.modality;
    const startTime = this.state.startTime;
    const endTime = this.state.endTime;
    query = {};
    if (studyID.length > 0) {
      query.studyID = {$regex : ".*" + studyID + ".*"};
    }
    if (patientName.length > 0) {
      query.patientName = {$regex : ".*" + patientName+ ".*"};
    }
    if (patientSex.length > 0){
      query.patientSex = patientSex;
    }
    if (patientAge > 0) {
      query.patientAge = "0" + patientAge + "Y";
    }
    if (modality.length > 0) {
      query.modality = modality;
    }
    if (startTime.length > 0 && endTime.length > 0) {
      let startDate = new Date(startTime);
      let endDate = new Date(endTime);
      query["$where"] = function () {
        let date = undefined;
        if (this.studyDate.length === 8) {
          date = new Date(this.studyDate.substr(0,4) + "-" +
            this.studyDate.substr(4,2) + "-" + this.studyDate.substr(6,2));
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

  jumpTo(caseid) {
    window.location = "/newCase?id=" + caseid;
  }

  handleInputChange(event) {
    const value = event.target.value;
    const name = event.target.name;
    this.setState({
      [name]: value
    });
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
      </tr>  :
      <tr><th>未找到符合搜索条件的病例</th></tr>;

    let searchResult = this.state.isSearchClicked ? ("共计" + this.state.cases.length + "条搜索结果") : undefined;

    return (
      <div>
        <Navbar>
          <Navbar.Header>
            <Navbar.Brand>
              <Link to={`/newCase?collection=${this.props.params.collectionName}`}>
                <i className="fa fa-plus" style={{color: "green", fontSize: "20px"}}>新建</i>
              </Link>
            </Navbar.Brand>
            <Navbar.Toggle />
          </Navbar.Header>
        </Navbar>
        <div className={"searchBar"} style={style.searchBar}>
          <div style={style.formElement}>
            检查号：
            <input type={"text"} name={"studyID"} value={this.state.studyID} onChange={this.handleInputChange}/>
          </div>
          <div style={style.formElement}>
            姓名：
            <input type={"text"} name={"patientName"} value={this.state.patientName} onChange={this.handleInputChange}/>
          </div>
          <div style={style.formElement}>
            年龄：
            <input type={"number"} name={"patientAge"} value={this.state.patientAge} onChange={this.handleInputChange}/>
          </div>
          <div style={style.formElement}>
            性别：
            <select name={"patientSex"} value={this.state.patientSex} onChange={this.handleInputChange}>
              <option value={"M"}>男</option>
              <option value={"F"}>女</option>
            </select>
          </div>
          <div style={style.formElement} >
            设备：
            <select name={"modality"} value={this.state.modality} onChange={this.handleInputChange}>
              <option value={"CT"}>CT</option>
              <option value={"MR"}>MR</option>
            </select>
          </div>
          <div style={style.formElement}>
            起始时间：
            <input type={"date"} name={"startTime"} value={this.state.startTime} onChange={this.handleInputChange}/>
          </div>
          <div style={style.formElement}>
            终止时间：
            <input type={"date"} name={"endTime"} value={this.state.endTime} onChange={this.handleInputChange}/>
          </div>
          <div style={style.formElement}>
            <Button bsStyle={"primary"} onClick={this.searchCase}>查询</Button>
            <Button bsStyle={"danger"} onClick={() => this.reset()} style={{marginLeft:"20px"}}>重置</Button>
          </div>
        </div>

        <div className="container" style={style.caseList}>
          <div style={style.searchResult}>{searchResult}</div>
          <Table striped bordered condensed hover>
            <thead>
            {tHead}
            </thead>
            <tbody>
            {this.state.cases.length > 0 && this.state.cases.map((specificCase, index) => {
              return (
                <tr key={specificCase._id} onDoubleClick = {() => this.jumpTo(specificCase._id)}>
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
                      state: {caseId: specificCase._id}
                    }} className="glyphicon glyphicon-picture"/>
                    &nbsp;&nbsp;&nbsp;
                    <Link to={`/newCase?id=${specificCase._id}`} className="glyphicon glyphicon-pencil"/>
                    &nbsp;&nbsp;&nbsp;
                    <span className="glyphicon glyphicon-trash" onClick={that.deleteCase.bind(this, specificCase._id)}/>
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
    )
  }
}

CaseList.contextTypes = {
  router: React.PropTypes.object
}

export default withTracker(props => {
  const handle = Meteor.subscribe('cases');
  return {
    cases: Cases.find({ collectionName: props.params.collectionName }).fetch(),
    listLoading: !handle.ready()
  }
})(CaseList);
