import React, { Component } from 'react';
import Avatar from 'material-ui/Avatar';
import { ListItem } from 'material-ui/List';
import ActionDeleteForever from 'material-ui/svg-icons/action/delete-forever';
import { red500 } from 'material-ui/styles/colors';


export default class TeamList extends Component {

  updateCurrentDataCollection(dataCollection){
    this.props.updateCurrentDataCollection(dataCollection);
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
      leftAvatar={<Avatar src="messi.jpg" />}
      rightIcon={<ActionDeleteForever hoverColor={red500} onClick={this.deleteDataCollection.bind(this, this.props.dataCollection._id)}/>}
      onClick={this.updateCurrentDataCollection.bind(this, this.props.dataCollection)}
    />
    )
  }
}
