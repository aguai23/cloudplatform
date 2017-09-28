import { Meteor } from 'meteor/meteor';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { browserHistory } from 'react-router';

import { Accounts } from 'meteor/accounts-base'

import AccountsWrapper from './AccountsWrapper';

export default class Home extends Component {
  constructor(props) {
    super(props);
  }

  login = function(){
    console.log("login()");

    Meteor.loginWithPassword("admin@admin", "123123", function(error) {
      if(error) {
        return console.log("Login Failed. " + error);
      }

      //console.log(Meteor.user());

      browserHistory.push('/datasets');
    });

  }

  register = function() {
    console.log('register()');

    Accounts.createUser({
      username: "test@test",
      password: "123123"
    }, function(error) {
      if(error) {
        return console.log("Registration Failed. " + error);
      }

      //console.log(Meteor.user());

      browserHistory.push('/datasets');
    })
  }

  render() {
    return (
      <div ref="container">;
        <button onClick={this.login}>登录</button>
        <button onClick={this.register}>注册</button>

        <AccountsWrapper />
      </div>
    );
  }
}
