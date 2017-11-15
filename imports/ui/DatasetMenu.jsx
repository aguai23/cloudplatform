import { Meteor } from 'meteor/meteor';
import React, { Component } from 'react';
import { Nav, NavItem } from 'react-bootstrap';

import './css/datasetMenu.css';

export default class DatasetMenu extends Component {
  constructor(props) {
    super(props);
    
  }

  render() {
    return (
        <Nav className="nav-custom" bsStyle="pills" stacked activeKey={this.props.activeKey} onSelect={this.props.selectHandler}>
          <NavItem eventKey="PUB" href="#">公共数据集</NavItem>
          <NavItem eventKey="PVT" href="#">个人数据集</NavItem>
          <NavItem eventKey="FAV" href="#">收藏数据集</NavItem>
        </Nav>
    );
  }
}
