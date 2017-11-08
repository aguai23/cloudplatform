import React, { Component } from 'react';
import { Navbar, FormGroup, FormControl, Table, Button } from 'react-bootstrap';
import { Cases } from '../api/cases';
import { DataCollections } from '../api/dataCollections';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { browserHistory, Link } from 'react-router';
import { toast, ToastContainer } from 'react-toastify';

const style = {
  searchResult: {
    marginTop: '10px',
    marginBottom: '20px',
    paddingLeft: '20px',
    fontSize: '18px'
  }
}

export class CaseList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      cases: Cases.find({ collectionName: this.props.params.collectionName }).fetch(),
      isSearchClicked: false
    };

    this.searchCase = this.searchCase.bind(this);
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
    let patientName = this.input.value;

    if (this.state.isSearchClicked) return;

    if (patientName === undefined || patientName.length === 0) {
      toast.warning("查询条件不能为空", { position: toast.POSITION.BOTTOM_RIGHT });
      return
    }

    this.setState({
      isSearchClicked: true,
      cases: Cases.find({ patientName: { $regex: '.*' + patientName + '.*', $options: "i" } }).fetch()
    });
  }

  reset() {
    this.input.value = "";
    this.setState({
      isSearchClicked: false,
      cases: this.props.cases
    });
  }

  jumpTo(caseid) {
    window.location = "/newCase?id=" + caseid;
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
        <th>操作</th>
      </tr>  :
      <tr><th>未找到符合搜索条件的病例</th></tr>;

    let searchResult = this.state.isSearchClicked ? ("共计" + this.state.cases.length + "条搜索结果") : undefined;

    return (
      <div>
        <Navbar>
          <Navbar.Header>
            <Navbar.Brand>
              <Link to={`/newCase?collection=${this.props.params.collectionName}`}>新建</Link>
            </Navbar.Brand>
            <Navbar.Toggle />
          </Navbar.Header>
          <Navbar.Collapse>
            <Navbar.Form pullLeft>
              <FormGroup>
                <FormControl inputRef={ref => { this.input = ref }} type="text" placeholder="输入病例名称" />
              </FormGroup>
              {' '}
              <Button onClick={this.searchCase}>查询</Button>
              <Button onClick={() => this.reset()}>重置</Button>
            </Navbar.Form>
          </Navbar.Collapse>
        </Navbar>

        <div className="container">
          <div style={style.searchResult}>{searchResult}</div>
          <Table striped bordered condensed hover>
            <thead>
            {tHead}
            </thead>
            <tbody>
            {this.state.cases.length > 0 && this.state.cases.map((specificCase, index) => {
              let collectionCol = this.state.isSearchClicked ? <td>{specificCase.collectionName}</td> : undefined;
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
                  {collectionCol}
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
