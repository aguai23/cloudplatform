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
        <div className="col-sm-2">
          <Link to={{
              pathname: '/datasets/' + this.props.dataCollection.name,
              state: this.props.dataCollection.name
            }}>
            {this.props.dataCollection.name}
          </Link>
        </div>
        <div className="col-sm-1">
          {this.props.dataCollection.equip}
        </div>
        <div className="col-sm-7">
        </div>
        <div className="col-sm-1">
          <FontAwesome name='trash-o' size='lg' className="pull-right" onClick={this.onClickRemove.bind(this)}/>
        </div>
        <div className="col-sm-1">
          <FontAwesome name='pencil-square-o' size='lg' className="pull-right" onClick={this.onClickModify.bind(this)} />
        </div>
      </div>
    );
  }
}
