import { Meteor } from 'meteor/meteor';
import React, { Component, PropTypes } from 'react';
import { createContainer } from 'meteor/react-meteor-data';
import { Link } from 'react-router';
import { Accounts } from 'meteor/accounts-base';
import { Tracker } from 'meteor/tracker';

import { DataCollections } from '../api/dataCollections';

import CollectionList from './Collection-list';
import SingleCollectionInList from './SingleCollectionInList';
import AccountsWrapper from './AccountsWrapper';
import AccountState from './AccountState'
import Edit from './EditDataCollection';
import CaseList from './Case-list';
import { Cases } from '../api/cases';
import {Session} from "meteor/session";

import { Button, Nav, NavItem } from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import { ToastContainer, toast } from 'react-toastify';

const tempDataCollection = {
  name: "",
  type: "",
};

const styles = {
  mainDiv: {
    position: 'relative',
    marginTop: '200px'
  },

  tabHeaders: {
    display: 'inline-block',
    fontSize: '18px'
  },

  btnCreate: {
  }
};


export class App extends Component {

  constructor(props) {
    super(props);

    //setting up State
    this.state = {
      currentDataCollection: tempDataCollection,
      showEditDataCollection: false,
      tabActiveKey: "1"
    };
    this.updateCurrentDataCollection = this.updateCurrentDataCollection.bind(this);
    this.showEditForm = this.showEditForm.bind(this);
    this.onDataCollectionClick = this.onDataCollectionClick.bind(this);
    this.onClickRemoveCollection = this.onClickRemoveCollection.bind(this);
    this.onTabSelectHandler = this.onTabSelectHandler.bind(this);
  }

  renderDataCollection() {
    console.log("this.props.dataCollections", this.props.dataCollections);
    return this.props.dataCollections.map((dataCollection) => (
      <CollectionList onDataCollectionClick={this.onDataCollectionClick} key={dataCollection._id} dataCollection={dataCollection} updateCurrentDataCollection={this.updateCurrentDataCollection} />
    ));
  }

  onDataCollectionClick(dataCollectionId){
    Session.set({
      collectionId: dataCollectionId
    })
    this.context.router.push('/newCase');
    // this.renderCases(dataCollectionId)
  }

  onClickRemoveCollection(id) {
    console.log("id", id);
    return toast.success("数据集已成功删除！", {position: toast.POSITION.BOTTOM_RIGHT});
    Meteor.call('removetDataCollection', id, (error) => {
      if (error) {
        console.log("Failed to remove DataCollection. " + error.reason);
        toast.error("数据集删除失败！", {position: toast.POSITION.BOTTOM_RIGHT});
      } else {
        toast.success("数据集已成功删除！", {position: toast.POSITION.BOTTOM_RIGHT});
      }
    });
  }

  onTabSelectHandler(eventKey) {
    // console.log("Tab " + eventKey + " selected" );

    event.preventDefault();

    this.setState({tabActiveKey: eventKey});
  }

  renderCases(collectionId) {
    //TODO: 渲染列表
    // const cases = Cases.find({}).fetch();
    //   console.log(cases)
    // return cases.map((Case) => {
    //     <CaseList key={Case._id} Case={Case} />
    //   }
    // )
  }

  updateCurrentDataCollection(dataCollection) {
    this.setState({
      currentDataCollection: dataCollection,
    });
  }


  showEditForm() {
    this.setState({
      showEditDataCollection: true,
    });
  }

  showForm() {
    if (this.state.showEditDataCollection === true) {
      return (<Edit currentDataCollection={this.state.currentDataCollection} />);
    }
  }

  render() {
    return (
      <div className="container" style={styles.mainDiv}>
        <div className="header">
          <div>
            <Nav bsStyle="tabs" activeKey={this.state.tabActiveKey} onSelect={this.onTabSelectHandler} style={styles.tabHeaders}>
              <NavItem eventKey="1" href="#">公共数据集</NavItem>
              <NavItem eventKey="2" href="#">个人数据集</NavItem>
              <NavItem eventKey="3" href="#">收藏数据集</NavItem>
            </Nav>
            <Button className="pull-right" bsStyle="success" bsSize="xsmall" style={styles.btnCreate}>新建数据集</Button>

          </div>

          <div>
            <div className="row">
              <ul>
                {this.props.dataCollections.map((dataCollection) => {
                  return (
                    <li key={dataCollection._id}>
                      <SingleCollectionInList dataCollection={dataCollection} onClickRemove={this.onClickRemoveCollection} />
                      <hr/>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );

    /*
    return (
      <MuiThemeProvider>
        <div className="container">
          <AppBar title="医学影像数据分析开放云平台"
            iconClassNameRight="muidocs-icon-navigation-expand-more"
            showMenuIconButton={false}
            style={{ backgroundColor: '#0277BD' }}>
            <AccountState />
            <AccountsWrapper />
          </AppBar>
          <div className="row">
            <div className="col s12 m7"><DataCollection dataCollection={this.state.currentDataCollection} showEditForm={this.showEditForm} /></div>
            <div className="col s12 m5">
              <h2>Collection List{this.state.email}</h2>
              <Link to="/newCollection" className="waves-effect waves-light btn light-blue darken-3">Add dataCollection</Link>
              <Divider />
              <List>
                {this.renderDataCollection()}
              </List>
              <Divider />
            </div>
          </div>
          <div className="row">
            <div className="col s12">
              <br />
              <Divider />
              {this.showForm()}
              <Divider />
            </div>
          </div>
        </div>
      </MuiThemeProvider>

    )
    */
  }
}

App.PropTypes = {
  dataCollections: PropTypes.array.isRequired,
  userData: PropTypes.object
};

App.contextTypes = {
  router: React.PropTypes.object
}

export default createContainer(() => {
  Meteor.subscribe('dataCollections');
  Meteor.subscribe('userData');
  const userId = Meteor.userId();

  return {
    dataCollections: DataCollections.find({}, { sort: { name: 1 } }).fetch(),
    userData: Meteor.user()
  };
}, App);
