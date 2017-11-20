import { Meteor } from 'meteor/meteor';
import React, { Component } from 'react';
import { Nav, NavItem } from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';

import CustomEventEmitter from '../library/CustomEventEmitter';

import './css/datasetMenu.css';

export default class DatasetMenu extends Component {
  constructor(props) {
    super(props);

    this.state = {
      activeKey: this.props.location.state ? this.props.location.state : 'PUBLIC'
    };
  }

  componentDidMount() {

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
        <Nav className="nav-custom" bsStyle="pills" stacked activeKey={this.state.activeKey} onSelect={this.onSelectHandeler.bind(this)}>
          <NavItem eventKey="PUBLIC" href="#">
            <FontAwesome name={"cloud"} style={{marginRight: "10px"}}/>
            公共数据集
          </NavItem>
          <NavItem eventKey="PRIVATE" href="#">
            <FontAwesome name={"database"} style={{marginRight: "10px"}}/>
            个人数据集
          </NavItem>
          <NavItem eventKey="FAVORITE" href="#">
            <FontAwesome name={"folder"} style={{marginRight: "10px"}}/>
            收藏数据集
          </NavItem>
        </Nav>
    );
  }
}
