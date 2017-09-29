import { Meteor } from 'meteor/meteor';
import React, { Component, PropTypes } from 'react';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import RaisedButton from 'material-ui/RaisedButton';
import AppBar from 'material-ui/AppBar';
import { List } from 'material-ui/List';
import Divider from 'material-ui/Divider';
import { createContainer } from 'meteor/react-meteor-data';
import { Link } from 'react-router';
import { Accounts } from 'meteor/accounts-base';

import { DataCollections } from '../api/dataCollections';

import CollectionList from './Collection-list';
import DataCollection from './DataCollection';
import AccountsWrapper from './AccountsWrapper';
import AccountState from './AccountState'
import Edit from './EditDataCollection';
import CaseList from './Case-list';
import { Cases } from '../api/cases';
import {Session} from "meteor/session";

const tempDataCollection = {
  name: "",
  type: "",
}


export class App extends Component {

  constructor(props) {
    super(props);
    const a = Meteor.user();

    //setting up State
    this.state = {
      a: a.emails[0].address,
      currentDataCollection: tempDataCollection,
      showEditDataCollection: false
    };
    this.updateCurrentDataCollection = this.updateCurrentDataCollection.bind(this);
    this.showEditForm = this.showEditForm.bind(this);
    this.onDataCollectionClick = this.onDataCollectionClick.bind(this);
  }

  renderDataCollection() {
    // console.log("userData", this.props.userData);
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
    email = this.props.userData ? this.props.userData.emails[0] : "请登录";
    return (
      <MuiThemeProvider>
        <div className="container">
          <AppBar title="医学影像数据分析开放云平台"
            iconClassNameRight="muidocs-icon-navigation-expand-more"
            showMenuIconButton={false}
            style={{ backgroundColor: '#0277BD' }}>
            <AccountState title="User"/>
            <AccountsWrapper />
          </AppBar>
          <div className="row">
            <div className="col s12 m7"><DataCollection dataCollection={this.state.currentDataCollection} showEditForm={this.showEditForm} /></div>
            <div className="col s12 m5">
              <h2>Collection List{this.state.a}</h2>
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
          {/* <div className="row">
              <br />
              <Divider />
              {this.renderCases()}
              <Divider />
            </div> */}
        </div>
      </MuiThemeProvider>

    )
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
    dataCollections: DataCollections.find({ ownerId: userId }, { sort: { name: 1 } }).fetch(),
    userData: Meteor.user()
  };
}, App);

// Tracker.autorun(function() {
//   let currentUser;
//
//   const
//     subscription = Meteor.subscribe("userData")
//     subReady = subscription.ready()
//   ;
//
//   if(subReady) {
//     console.log(Meteor.user());
//     currentUser = Meteor.user();
//     App.props.currentUser = currentUser;
//   }
//   console.log("subscription", subscription.ready());
//
// });
