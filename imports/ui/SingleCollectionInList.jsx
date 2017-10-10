import React, { Component } from 'react';
import { Card, CardHeader, CardActions, CardText } from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton';
import Avatar from 'material-ui/Avatar';
import Chip from 'material-ui/Chip';
import { blue200, lightBlue800, lightBlue50 } from 'material-ui/styles/colors';

import { Col } from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import { Link } from 'react-router';


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
        <Link to="/caseList">
          {this.props.dataCollection.name + (this.props.dataCollection.equip ? " / " + this.props.dataCollection.equip : "")}
        </Link>
        <FontAwesome name='trash-o' size='lg' className="pull-right" onClick={this.onClickRemove.bind(this)}/>
      </div>
    );
  }
}
