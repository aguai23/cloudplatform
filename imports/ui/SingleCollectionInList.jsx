import React, { Component } from 'react';
import { Card, CardHeader, CardActions, CardText } from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton';
import Avatar from 'material-ui/Avatar';
import Chip from 'material-ui/Chip';
import { blue200, lightBlue800, lightBlue50 } from 'material-ui/styles/colors';

import FontAwesome from 'react-fontawesome';


export default class SingleCollectionInList extends Component {
  constructor(props) {
    super(props);
  }

  onClickRemove() {
    // console.log(this.props);
    this.props.onClickRemove(this.props.dataCollection._id);
  }

  render() {
    // console.log("SingleCollectionInList");
    return (
      <div>
        {this.props.dataCollection.name}
        <FontAwesome name='trash-o' size='lg' className="pull-right" onClick={this.onClickRemove.bind(this)}/>
      </div>
    );
  }
}

/*
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
*/
