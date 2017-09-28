import React, { Component, PropTypes } from 'react';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import RaisedButton from 'material-ui/RaisedButton';
import AppBar from 'material-ui/AppBar';
import { List } from 'material-ui/List';
import Divider from 'material-ui/Divider';
import { createContainer } from 'meteor/react-meteor-data';
import { Link } from 'react-router';
import { DataCollections } from '../api/dataCollections';

import CollectionList from './Collection-list';
import DataCollection from './DataCollection';
import AccountsWrapper from './AccountsWrapper';
import Edit from './EditDataCollection';
import CaseList from './Case-list';
import { Cases } from '../api/cases';

const tempDataCollection = {
  name: "",
  type: "",
}


export class App extends Component {

  constructor(props) {
    super(props);

    //setting up State
    this.state = {
      currentDataCollection: tempDataCollection,
      showEditDataCollection: false,
    };
    this.updateCurrentDataCollection = this.updateCurrentDataCollection.bind(this);
    this.showEditForm = this.showEditForm.bind(this);
    this.onDataCollectionClick = this.onDataCollectionClick.bind(this);
  }

  renderDataCollection() {
    return this.props.dataCollections.map((dataCollection) => (
      <CollectionList onDataCollectionClick={this.onDataCollectionClick} key={dataCollection._id} dataCollection={dataCollection} updateCurrentDataCollection={this.updateCurrentDataCollection} />
    ));
  }

  onDataCollectionClick(dataCollectionId){
    //TODO: 跳转到新增cases的页面
    this.renderCases(dataCollectionId)
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
      <MuiThemeProvider>
        <div className="container">
          <AppBar title="Soccer Application"
            iconClassNameRight="muidocs-icon-navigation-expand-more"
            showMenuIconButton={false}
            style={{ backgroundColor: '#0277BD' }}>
            <AccountsWrapper />
          </AppBar>
          <div className="row">
            <div className="col s12 m7"><DataCollection dataCollection={this.state.currentDataCollection} showEditForm={this.showEditForm} /></div>
            <div className="col s12 m5">
              <h2>Collection List</h2>
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
};

export default createContainer(() => {
  Meteor.subscribe('dataCollections');
  const user = Meteor.userId();

  return {
    dataCollections: DataCollections.find({ ownerId: user }, { sort: { name: 1 } }).fetch(),
  };
}, App);
