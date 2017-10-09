import { Meteor } from 'meteor/meteor';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { Breadcrumb, Button, ButtonToolbar, DropdownButton, MenuItem } from 'react-bootstrap';

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
  'newCase': '新建病例集'
}

export default class Header extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userInfo: Meteor.user()
    }
  }

  addBtnAccount() {
    console.log(this.state.userInfo);
    if(this.state.userInfo !== undefined) {
      return (
        <ButtonToolbar className="pull-right" style={styles.btnAccount}>
          <DropdownButton bsStyle="default" title={this.state.userInfo.emails[0].address} noCaret id="dropdown-no-caret">
            <MenuItem eventKey="1">修改密码</MenuItem>
            <MenuItem eventKey="2">编辑资料</MenuItem>
            <MenuItem eventKey="3">管理数据集</MenuItem>
            <MenuItem divider />
            <MenuItem eventKey="4">登出</MenuItem>
          </DropdownButton>
        </ButtonToolbar>
      );
    } else {
      return (
        <ButtonToolbar className="pull-right" style={styles.btnAccount}>
          <Button className="btn btn-success" onClick={Login.login}>登录</Button>
          <Button className="btn btn-warning" onClick={Login.register}>注册</Button>
        </ButtonToolbar>
      )
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
