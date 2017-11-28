import { Meteor } from 'meteor/meteor';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { Breadcrumb, Button, ButtonToolbar, DropdownButton, MenuItem } from 'react-bootstrap';
import { browserHistory } from 'react-router';

import Login from './Login';
import { DataCollections } from '../api/dataCollections';

import FontAwesome from 'react-fontawesome';

import './css/header.css';

const styles = {
  divBreadcrumb: {
    position: 'relative',
    backgroundColor: '#efefef'
  },

  breadcrumb: {
    position: 'relative',
    marginTop: '15px',
    marginLeft: '100px',
    backgroundColor: '#efefef',
    display: 'inline-block'
  }
}

const nameMap = {
  '/': '首页',
  'datasets': '数据集',
  'newCase': '新建病例'
}

export default class Header extends Component {
  constructor(props) {
    super(props);

    var userInfo = localStorage.getItem('userInfo');

    this.state = {
      userInfo: (userInfo ? JSON.parse(userInfo) : null),
      isDropdownOpen: false
    }
  }

  toggleDropdown(evt) {
    this.setState({
      isDropdownOpen: !this.state.isDropdownOpen
    });
  }

  addBtnAccount() {
    if(this.state.userInfo !== null) {
      return (
        <ButtonToolbar className="pull-right btn-account">
          <div className="dropdown-toggle dropdown-label" data-toggle="dropdown" onSelect={(key) => this.onDropdownSelectHandler(key)}>
            <FontAwesome name="user" className="icon-user"/>{this.state.userInfo.emails[0].address}
          </div>
          <ul className="dropdown-menu">
            <MenuItem onClick={() => this.onDropdownSelectHandler("CHANGE_PWD")}>修改密码</MenuItem>
            <MenuItem onClick={() => this.onDropdownSelectHandler("EDIT_PROFILE")}>编辑资料</MenuItem>
            <MenuItem onClick={() => this.onDropdownSelectHandler("MANAGE_DATASETS")}>管理数据集</MenuItem>
            <MenuItem onClick={() => this.onDropdownSelectHandler("LOGOUT")}>退出</MenuItem>
          </ul>
        </ButtonToolbar>
      );
    } else {
      return (
        <ButtonToolbar className="pull-right btn-account">
          <a className="btn btn-success" href="/login">登录</a>
          <a className="btn btn-warning" href="registration">注册</a>
        </ButtonToolbar>
      )
    }
  }

  onDropdownSelectHandler(eventKey) {
    switch(eventKey) {
      case 'CHANGE_PWD':
      break;

      case 'EDIT_PROFILE':
      break;

      case 'MANAGE_DATASETS':
      break;

      case 'LOGOUT':
        Meteor.logout(function(error) {
          if(error) {
            return console.error("Logout failed. " + error);
          }

          localStorage.removeItem('userInfo');
          this.setState({'userInfo':  null});

          browserHistory.push('/login');

        }.bind(this));
      break;

      default:
      console.error('No matched event found');
    }
  }

  render() {
    let breadcrumbs = [];

    this.props.routes.map((route, i) => {
      if(i === this.props.routes.length - 1) {
        let subroutes = route.path.split('/');

        if(subroutes.length === 1) {
          breadcrumbs.push (
            <Breadcrumb.Item href={'/' + subroutes[0]} key={subroutes[0]} active>
              {nameMap[subroutes[0]]}
            </Breadcrumb.Item>
          );
        } else {
          breadcrumbs.push (
            <Breadcrumb.Item href={'/' + subroutes[0]} key={subroutes[0]}>
              {nameMap[subroutes[0]]}
            </Breadcrumb.Item>
          );

          breadcrumbs.push (
            <Breadcrumb.Item href={route.path} key={subroutes[1]} active>
              {this.props.location.state}
            </Breadcrumb.Item>
          );
        }
      } else {
        breadcrumbs.push (
          <Breadcrumb.Item href={route.path === '/' ? '/datasets' : route.path} key={route.path}>
            {nameMap[route.path]}
          </Breadcrumb.Item>
        );
      }
    });
    /*
    <div id="header" style={styles.divBreadcrumb}>
      <Breadcrumb style={styles.breadcrumb}>
      {breadcrumbs}
      </Breadcrumb>
    </div>
    */
    return (
      <div id="header" className="eight-cols" >
        <div className="col-sm-1 logo-div">
          <img src="/img/logo.png" />
        </div>
        <div className="col-sm-7 main-div">
          <div className="col-sm-10">
            <img src="/img/header_title.png" />
          </div>
          <div className="col-sm-2">
            {
              this.addBtnAccount()
            }
          </div>
        </div>

      </div>

    );
  }
}
