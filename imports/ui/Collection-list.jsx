import React, { Component } from 'react';
import { ListItem } from 'material-ui/List';
import ActionDeleteForever from 'material-ui/svg-icons/action/delete-forever';
import { red500 } from 'material-ui/styles/colors';


export default class CollectionList extends Component {

  updateCurrentDataCollection(dataCollection){
    // this.props.onDataCollectionClick(dataCollection);
    this.props.updateCurrentDataCollection(dataCollection);
  }

  onDataCollectionClick(dataCollection){
    this.props.onDataCollectionClick(dataCollection);
  }

  

  deleteDataCollection(dataCollectionId) {
    Meteor.call('deleteDataCollection', dataCollectionId, (error) => {
      if(error) {
        alert("somethings wrong" + error.reason);
      } else {
        alert("DataCollection deleted");
      }
    });
  }

  render() {
    return (
    <ListItem
    primaryText = {this.props.dataCollection.name}
    leftIcon={<ActionDeleteForever hoverColor={red500} onClick={this.onDataCollectionClick.bind(this, this.props.dataCollection._id)}/>}
    rightIcon={<ActionDeleteForever hoverColor={red500} onClick={this.deleteDataCollection.bind(this, this.props.dataCollection._id)}/>}
       onClick={this.updateCurrentDataCollection.bind(this, this.props.dataCollection)}
     />
    )
  }
}
