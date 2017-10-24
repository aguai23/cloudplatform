import React, { Component } from 'react';

import { Col } from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import { Link } from 'react-router';


export default class SingleCollectionInList extends Component {
  constructor(props) {
    super(props);
  }

  onClickRemove() {
    this.props.onClickRemove(this.props.dataCollection._id);
  }

  onClickModify() {
    this.props.onClickModify(this.props.dataCollection);
  }

  render() {
    return (
      <div>
        <Link to={'/datasets/' + this.props.dataCollection._id}>
          {this.props.dataCollection.name + (this.props.dataCollection.equip ? " / " + this.props.dataCollection.equip : "")}
        </Link>
        <FontAwesome name='trash-o' size='lg' className="pull-right" onClick={this.onClickRemove.bind(this)}/>
        <FontAwesome name='pencil-square-o' size='lg' className="pull-right" onClick={this.onClickModify.bind(this)} /> 
      </div>
    );
  }
}
