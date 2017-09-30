import { Accounts } from 'meteor/accounts-base';
import { createContainer } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from "meteor/session";

import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Button, MenuItem, Nav, NavItem, SplitButton } from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

import AccountsWrapper from './AccountsWrapper';
import AccountState from './AccountState'
import CaseList from './Case-list';
import { Cases }  from '../api/cases' ;
import CollectionList from './Collection-list';
import { DataCollections } from '../api/dataCollections';
import Edit from './EditDataCollection';
import ModalAddCollection from './ModalAddCollection';
import SingleCollectionInList from './SingleCollectionInList';


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

  btnCreateLink: {
    textDecoration: 'none',
    color: 'white'
  }
};


export class Main extends Component {

  constructor(props) {
    super(props);

    //setting up State
    this.state = {
      currentDataCollection: tempDataCollection,
      showEditDataCollection: false,
      tabActiveKey: "PUB",
      showCases: false,
      showAddCollectionModal: false,
      dataCollections: this.props.publicDataCollections
    };
    this.updateCurrentDataCollection = this.updateCurrentDataCollection.bind(this);
    this.showEditForm = this.showEditForm.bind(this);
    this.onAddCasesClick = this.onAddCasesClick.bind(this);
    this.onClickRemoveCollection = this.onClickRemoveCollection.bind(this);
    this.onTabSelectHandler = this.onTabSelectHandler.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if(this.state.tabActiveKey === 'PUB') {
      if(nextProps.publicDataCollections !== this.state.dataCollections) {
        this.state.dataCollections = nextProps.publicDataCollections;
      }
    } else if(this.state.tabActiveKey === 'PVT') {
      if(nextProps.privateDataCollections !== this.state.dataCollections) {
        this.state.dataCollections = nextProps.privateDataCollections;
      }
    } else if(this.state.tabActiveKey === 'FAV') {
      if(nextProps.favoriteDataCollections !== this.state.dataCollections) {
        this.state.dataCollections = nextProps.favoriteDataCollections;
      }
    }
  }

  renderDataCollection() {
    console.log("this.props.dataCollections", this.props.dataCollections);
    return this.props.dataCollections.map((dataCollection) => (
      <CollectionList onAddCasesClick={this.onAddCasesClick} key={dataCollection._id} dataCollection={dataCollection} updateCurrentDataCollection={this.updateCurrentDataCollection} />
    ));
  }

  onAddCasesClick(dataCollectionId) {
    Session.set({
      collectionId: dataCollectionId,
    })
    this.context.router.push('/newCase');
  }

  onClickRemoveCollection(id) {
    // console.log("id", id);

    toast.success("数据集已成功删除！", {position: toast.POSITION.BOTTOM_RIGHT});

    Meteor.call('removeDataCollection', id, (error) => {
      if (error) {
        console.log("Failed to remove DataCollection. " + error.reason);
        toast.error("数据集删除失败！", {position: toast.POSITION.BOTTOM_RIGHT});
      } else {
        toast.success("数据集已成功删除！", {position: toast.POSITION.BOTTOM_RIGHT});
      }
    });
  }

  onClickAddCollection() {
    // console.log("onClickAddCollection()");

    this.setState({showAddCollectionModal: true});

    ReactDOM.render((<ModalAddCollection showModal={true} userInfo={this.props.userData}/>), document.getElementById('modal-base'));
  }

  onTabSelectHandler(eventKey) {
    // console.log("Tab " + eventKey + " selected" );

    event.preventDefault();

    if(this.state.tabActiveKey === eventKey)  return;

    this.setState({tabActiveKey: eventKey});

    // console.log(DataCollections.find().fetch());

    if(eventKey === 'PUB') {
      this.setState({dataCollections: this.props.publicDataCollections});
    } else if(eventKey === 'PVT') {
      this.setState({dataCollections: this.props.privateDataCollections});
    } else if(eventKey === 'FAV') {
      this.setState({dataCollections: this.props.favoriteDataCollections});
    }
  }

  renderCases(collectionId) {
    if (this.state.showCases === true) {
      const collectionId =  this.state.currentDataCollection._id
      const cases = Cases.find({collectionId,ownerId:Meteor.userId()}).fetch();
      return cases.map((Case) => (
        <CaseList onAddCasesClick={this.onAddCasesClick} key={Case._id} Case={Case} />
      ));
    }
  }

  updateCurrentDataCollection(dataCollection) {
    this.setState({
      currentDataCollection: dataCollection,
      showCases: true
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
    // <SplitButton title={"特征"} id="dropdown-features">
    //   <MenuItem eventKey="1">Density: 1</MenuItem>
    //   <MenuItem eventKey="2">Another action</MenuItem>
    //   <MenuItem eventKey="3">Something else here</MenuItem>
    //   <MenuItem divider />
    //   <MenuItem eventKey="4">Separated link</MenuItem>
    // </SplitButton>
    return (
      <div className="container" style={styles.mainDiv}>
        <div id="modal-base"></div>
        <div>
          <div>
            <Nav bsStyle="tabs" activeKey={this.state.tabActiveKey} onSelect={this.onTabSelectHandler} style={styles.tabHeaders}>
              <NavItem eventKey="PUB" href="#">公共数据集</NavItem>
              <NavItem eventKey="PVT" href="#">个人数据集</NavItem>
              <NavItem eventKey="FAV" href="#">收藏数据集</NavItem>
            </Nav>

            <Button className="pull-right" bsStyle="success" bsSize="xsmall" onClick={() => this.onClickAddCollection()}>
              新建数据集
            </Button>

          </div>

          <div>
            <div className="row">
              <ul>
                {this.state.dataCollections.map((dataCollection) => {
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
        </div>
      </MuiThemeProvider>

    )
    */
  }
}

Main.PropTypes = {
  dataCollections: PropTypes.array.isRequired,
  userData: PropTypes.object
};

Main.contextTypes = {
  router: React.PropTypes.object
}

export default createContainer(() => {
  Meteor.subscribe('dataCollections');
  Meteor.subscribe('cases');
  Meteor.subscribe('userData');
  const userId = Meteor.userId();

  return {
    dataCollections: DataCollections.find({$or: [{type:'PUBLIC'}, {ownerId: {$in:[Meteor.userId(), null]}}]}, { sort: { name: 1 } }).fetch(),
    publicDataCollections: DataCollections.find({type: 'PUBLIC'}).fetch(),
    privateDataCollections: DataCollections.find({$and: [{type: 'PRIVATE'}, {ownerId: Meteor.userId()}]}).fetch(),
    favoriteDataCollections: DataCollections.find({$and: [{type: 'FAVORITES'}, {ownerId: Meteor.userId()}]}).fetch(),
    userData: Meteor.user()
  };
}, Main);