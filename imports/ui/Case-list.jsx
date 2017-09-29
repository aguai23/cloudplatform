import React, { Component } from 'react';
import { ListItem } from 'material-ui/List';
import ActionDeleteForever from 'material-ui/svg-icons/action/delete-forever';
import { red500 } from 'material-ui/styles/colors';


export default class CaseList extends Component {

  deleteCase(Case) {
    Meteor.call('deleteCase', Case, (error) => {
      if(error) {
        alert("somethings wrong" + error.reason);
      } else {
        alert("Case deleted");
      }
    });
  }

  render() {
    return (
    <ListItem
    primaryText = {this.props.Case.name}
    rightIcon={<ActionDeleteForever hoverColor={red500} onClick={this.deleteCase.bind(this, this.props.Case._id)}/>}
     />
    )
  }
}
