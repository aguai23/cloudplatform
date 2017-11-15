import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Button, FormControl, FormGroup, Nav, NavItem } from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import { ToastContainer, toast } from 'react-toastify';
import { DataCollections } from '../api/dataCollections';
import ModalAddCollection from './ModalAddCollection';
import SingleCollectionInList from './SingleCollectionInList';
import DatasetMenu from './DatasetMenu.jsx';

import './css/common/eightCols.css';
import './css/main.css';

const tempDataCollection = {
  name: "",
  type: "",
};

export class Main extends Component {

  constructor(props) {
    super(props);

    //setting up State
    this.state = {
      currentDataCollection: tempDataCollection,
      searchButtonIsHovered: false,
      showEditDataCollection: false,
      tabActiveKey: "PUB",
      showCases: false,
      showAddCollectionModal: false,
      dataCollections: this.props.publicDataCollections
    };
    this.updateCurrentDataCollection = this.updateCurrentDataCollection.bind(this);
    this.onClickRemoveCollection = this.onClickRemoveCollection.bind(this);
    this.onTabSelectHandler = this.onTabSelectHandler.bind(this);
  }

  /**
   * update state once props changed
   * @param nextProps the new props
   */
  componentWillReceiveProps(nextProps) {
    if (this.state.tabActiveKey === 'PUB') {
      if (nextProps.publicDataCollections !== this.state.dataCollections) {
        this.setState({ dataCollections: nextProps.publicDataCollections });
      }
    } else if (this.state.tabActiveKey === 'PVT') {
      if (nextProps.privateDataCollections !== this.state.dataCollections) {
        this.setState({ dataCollections: nextProps.privateDataCollections });
      }
    } else if (this.state.tabActiveKey === 'FAV') {
      if (nextProps.favoriteDataCollections !== this.state.dataCollections) {
        this.setState({ dataCollections: nextProps.favoriteDataCollections });
      }
    }
  }

  componentDidMount() {
    this.setState({
      containerHeight: window.innerHeight - document.getElementById('header').clientHeight,
      bottomDivHeight: window.innerHeight - document.getElementById('header').clientHeight - document.getElementById('upper-div').clientHeight - 120
    });
  }

  setSearchButtonHovered(val) {
    this.setState({ searchButtonIsHovered: val });
  }

  /**
   * check whether user is admin
   * @returns {boolean}
   */
  static isAdmin() {
    if (Meteor.user().profile && Main.isAdmin) {
      return true
    }
    toast.error("暂无操作权限！", { position: toast.POSITION.BOTTOM_RIGHT });
    return false
  }

  /**
   * remove collection
   * @param id
   */
  onClickRemoveCollection(id) {
    if (Main.isAdmin()) {
      Meteor.call('removeDataCollection', id, (error) => {
        if (error) {
          console.log("Failed to remove DataCollection. " + error.reason);
          toast.error("数据集删除失败！", { position: toast.POSITION.BOTTOM_RIGHT });
        } else {
          toast.success("数据集已成功删除！", { position: toast.POSITION.BOTTOM_RIGHT });
        }
      });
    }
  }

  /**
   * add collection
   */
  onClickAddCollection() {
    if (Main.isAdmin()) {
      this.setState({ showAddCollectionModal: true });
      ReactDOM.render((<ModalAddCollection showModal={true} userInfo={this.props.userData} />), document.getElementById('modal-base'));
    }
  }

  /**
   * update collection
   * @param dataCollection
   */
  updateCurrentDataCollection(dataCollection) {
    if (Main.isAdmin()) {
      this.setState({ showAddCollectionModal: true });
      ReactDOM.render((<ModalAddCollection showModal={true} dataCollection={dataCollection} userInfo={this.props.userData} />), document.getElementById('modal-base'));
    }
  }

  onTabSelectHandler(eventKey) {
    event.preventDefault();

    if (this.state.tabActiveKey === eventKey) return;

    this.setState({ tabActiveKey: eventKey });

    if (eventKey === 'PUB') {
      this.setState({ dataCollections: this.props.publicDataCollections });
    } else if (eventKey === 'PVT') {
      this.setState({ dataCollections: this.props.privateDataCollections });
    } else if (eventKey === 'FAV') {
      this.setState({ dataCollections: this.props.favoriteDataCollections });
    }
  }

  /**
   * search data collection
   */
  searchDatabase() {
    const newValue = DataCollections.find({ name: { $regex: this.textInput.value, $options: "i" } }).fetch();
    if (newValue.length > 0) {
      this.setState({
        dataCollections: newValue
      })
    } else {
      toast.warning("找不到该数据集", { position: toast.POSITION.BOTTOM_RIGHT });
    }
  }

  render() {
    return (
      <div>
        <div id="modal-base"/>
        <div className="eight-cols" style={{height: this.state.containerHeight}}>
          <div className="col-sm-1 nav-container">
            <DatasetMenu activeKey={this.state.tabActiveKey} selectHandler={this.onTabSelectHandler}/>
          </div>
          <div className="col-sm-7 content-container">
            <div id="upper-div" className="upper-div">
              <div className="col-sm-6" style={{padding: 0}}>
                <FormGroup bsSize="small" className="searchBar">
                  <FormControl type="text" placeholder="输入名称搜索" inputRef={input => { this.textInput = input }} />
                  <a onClick={this.searchDatabase.bind(this)} className='btn-search'>
                    <FontAwesome name='search' size='lg' />
                  </a>
                </FormGroup>
              </div>
              <div className="col-sm-6" style={{padding: 0}}>
                <div className="pull-right btn-create-dataset" onClick={() => this.onClickAddCollection()}>
                </div>
              </div>
            </div>
            <div className="bottom-div" style={{height: this.state.bottomDivHeight}}>
              <div>
                <ul style={{padding: '0 15px 0 15px'}}>
                  {this.state.dataCollections.map((dataCollection) => {
                    return (
                      <li key={dataCollection._id}>
                        <SingleCollectionInList dataCollection={dataCollection} onClickModify={this.updateCurrentDataCollection} onClickRemove={this.onClickRemoveCollection} />
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <ToastContainer
          position="bottom-right"
          type="info"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          style={{ zIndex: 1999 }}
          closeOnClick
          pauseOnHover
        />
      </div>
    );
  }
}

Main.PropTypes = {
  dataCollections: PropTypes.array.isRequired,
  userData: PropTypes.object
};

Main.contextTypes = {
  router: React.PropTypes.object
};

export default withTracker(props => {
  Meteor.subscribe('dataCollections');
  Meteor.subscribe('cases');
  Meteor.subscribe('userData');
  return {
    dataCollections: DataCollections.find({ $or: [{ type: 'PUBLIC' }, { ownerId: { $in: [Meteor.userId(), null] } }] }, { sort: { name: 1 } }).fetch(),
    publicDataCollections: DataCollections.find({ type: 'PUBLIC' }).fetch(),
    privateDataCollections: DataCollections.find({ $and: [{ type: 'PRIVATE' }, { ownerId: Meteor.userId() }] }).fetch(),
    favoriteDataCollections: DataCollections.find({ $and: [{ type: 'FAVORITES' }, { ownerId: Meteor.userId() }] }).fetch(),
    userData: Meteor.user()
  }
})(Main);
