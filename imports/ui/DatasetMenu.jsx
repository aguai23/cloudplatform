import { Meteor } from 'meteor/meteor';
import React, { Component } from 'react';
import { Nav, NavItem } from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';

import CustomEventEmitter from '../library/CustomEventEmitter';

import './css/datasetMenu.css';

export default class DatasetMenu extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.setState({
      activeKey: this.props.activeKey ? this.props.activesKey : 'PUB'
    });
  }

  onSelectHandeler(key) {
    this.setState({
      activeKey: key
    });

    let eventEmitter = new CustomEventEmitter();
    eventEmitter.dispatch('tabKeyChanged', {tabActiveKey: key});
  }

  render() {
    return (
        <Nav className="nav-custom" bsStyle="pills" stacked activeKey={(this.state && this.state.activeKey) ? this.state.activeKey : this.props.activeKey} onSelect={this.onSelectHandeler.bind(this)}>
          <NavItem eventKey="PUB" href="#">
            <FontAwesome name={"cloud"} style={{marginRight: "10px"}}/>
            公共数据集
          </NavItem>
          <NavItem eventKey="PVT" href="#">
            <FontAwesome name={"database"} style={{marginRight: "10px"}}/>
            个人数据集
          </NavItem>
          <NavItem eventKey="FAV" href="#">
            <FontAwesome name={"folder"} style={{marginRight: "10px"}}/>
            收藏数据集
          </NavItem>
        </Nav>
    );
  }
}
