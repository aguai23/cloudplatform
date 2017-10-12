import { Meteor } from 'meteor/meteor';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { Breadcrumb, Button, ButtonToolbar, DropdownButton, MenuItem } from 'react-bootstrap';
import { browserHistory } from 'react-router';

import Login from './Login';

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
  },

  btnAccount: {
    position: 'relative',
    marginTop: '20px',
    marginRight: '100px'
  }
}

const nameMap = {
  '/': '首页',
  'datasets': '数据集',
  'newCase': '病例集管理'
}

export default class Header extends Component {
  constructor(props) {
    super(props);

    var userInfo = localStorage.getItem('userInfo');

    this.state = {
      userInfo: (userInfo ? JSON.parse(userInfo) : null)
    }
  }

  addBtnAccount() {
    if(this.state.userInfo !== null) {
      return (
        <ButtonToolbar className="pull-right" style={styles.btnAccount}>
          <DropdownButton bsStyle="default" title={this.state.userInfo.emails[0].address} noCaret id="dropdown-no-caret" onSelect={(eventKey) => {this.onDropdownSelectHandler(eventKey)}}>
            <MenuItem eventKey="CHANGE_PWD">修改密码</MenuItem>
            <MenuItem eventKey="EDIT_PROFILE">编辑资料</MenuItem>
            <MenuItem eventKey="MANAGE_DATASETS">管理数据集</MenuItem>
            <MenuItem divider />
            <MenuItem eventKey="LOGOUT">退出</MenuItem>
          </DropdownButton>
        </ButtonToolbar>
      );
    } else {
      return (
        <ButtonToolbar className="pull-right" style={styles.btnAccount}>
          <a className="btn btn-success" href="/login">登录</a>
          <a className="btn btn-warning" href="registration">注册</a>
        </ButtonToolbar>
      )
    }
  }

  onDropdownSelectHandler(eventKey) {
    console.log(eventKey);

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
            return console.log("Logout failed. " + error);
          }

          localStorage.removeItem('userInfo');
          this.setState({'userInfo':  null});

          browserHistory.push('/login');

        }.bind(this));
      break;

      default:
      console.log('No matched event found');
    }
  }

  render() {
    return (
      <div style={styles.divBreadcrumb}>
        <Breadcrumb style={styles.breadcrumb}>
          <img src={('public/img/PVmed.jpg')}/>
        {
          this.props.routes.map((route, i) => {
            if(i === this.props.routes.length - 1) {
              return (
                <Breadcrumb.Item href={route.path} key={route.path} active>
                  {nameMap[route.path]}
                </Breadcrumb.Item>
              )
            } else {
              return (
                <Breadcrumb.Item href={route.path} key={route.path}>
                  {nameMap[route.path]}
                </Breadcrumb.Item>
              )
            }
          })
        }
        </Breadcrumb>

        {
          this.addBtnAccount()
        }

      </div>

    );
  }
}

// const NavBar = React.createClass({
//   render: function() {
//     return (
//       xxx
//       <nav>
//         yyy
//       </nav>
//     );
//   }
// });
