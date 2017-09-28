import { Meteor } from 'meteor/meteor';

import React, { Component} from 'react';
import ReactDOM from 'react-dom';

import { Accounts } from 'meteor/accounts-base';

import { DropdownButton, MenuItem } from 'react-bootstrap';

export default class Home extends Component {
  constructor(props) {
    super(props);

  }


  render() {
    return (
      <DropdownButton title={this.props.title} id="dropdown-account">
        <MenuItem eventKey="1">我的数据集</MenuItem>
        <MenuItem eventKey="2">我的收藏</MenuItem>
        <MenuItem divider />
        <MenuItem eventKey="3">编辑资料</MenuItem>
        <MenuItem eventKey="4">修改密码</MenuItem>
          <MenuItem divider />
        <MenuItem eventKey="5">退出</MenuItem>
      </DropdownButton>
    );
  }
}
