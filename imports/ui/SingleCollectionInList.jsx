import React, { Component } from 'react';

import { Button, Col } from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import { Link } from 'react-router';

import './css/singleCollectionInList.css';


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
      <div className="data-item">
        <Link to={{
            pathname: '/datasets/' + this.props.dataCollection.name,
            state: this.props.dataCollection.type
          }}>
          <div className="col-sm-2" style={{paddingLeft: '10px'}}>
            {this.props.dataCollection.name}
          </div>
          <div className="col-sm-1">
            {this.props.dataCollection.equip}
          </div>
          <div className="col-sm-7" style={{height: '100%'}}></div>
        </Link>
          <div className="col-sm-2" style={{padding: 0}}>
            <Button className="btn-tool btn-delete pull-right" onClick={() => this.onClickRemove()}>删除</Button>
            <Button className="btn-tool pull-right" style={{marginRight: '20px'}} onClick={() => this.onClickModify()}>编辑</Button>
          </div>
      </div>
    );
  }
}
