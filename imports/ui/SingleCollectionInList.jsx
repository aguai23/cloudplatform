import React, { Component } from 'react';

import { Button, Col } from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import { Link } from 'react-router';

import './css/main.css';


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
    console.log(this.props)
    return (
      <div className="data-item">
        <div className="col-sm-2">
          <Link to={{
              pathname: '/datasets/' + this.props.dataCollection.name,
              state: this.props.dataCollection.type
            }}>
            {this.props.dataCollection.name}
          </Link>
        </div>
        <div className="col-sm-1">
          {this.props.dataCollection.equip}
        </div>
        <div className="col-sm-7">
        </div>
        <div className="col-sm-1" style={{padding: 0}}>
          <Button className="btn-tool pull-right" bsSize='small' onClick={() => this.onClickModify()} style={{marginRight: '-30px'}}>编辑</Button>
        </div>
        <div className="col-sm-1"  style={{padding: 0}}>
          <Button className="btn-tool pull-right" bsSize='small' onClick={() => this.onClickRemove()}>删除</Button>
        </div>
      </div>
    );
  }
}
