import React, { Component } from 'react';
import { Card, CardHeader, CardActions, CardText } from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton';
import Avatar from 'material-ui/Avatar';
import Chip from 'material-ui/Chip';
import { blue200, lightBlue800, lightBlue50 } from 'material-ui/styles/colors';

const styles = {
  chip: {
    margin: 4,
  },
  wrapper: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  button: {
    margin: 12

  }
}


export default class Player extends Component {
  showEditForm() {
    this.props.showEditForm();
  }

  render() {
    const dataCollection = this.props.dataCollection;

    return (
      <Card>
        <CardHeader
          title={dataCollection.name}
          actAsExpander={true}
          showExpandableButton={true}
        />
        <CardActions>
          <FlatButton label="Edit dataCollection"
          onClick={this.showEditForm.bind(this)} />
        </CardActions>
      </Card>
    )
  }
}
