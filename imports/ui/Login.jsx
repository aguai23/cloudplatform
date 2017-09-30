import { Meteor } from 'meteor/meteor';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { browserHistory } from 'react-router';

import { Accounts } from 'meteor/accounts-base';

import { Button, Checkbox, Col, Form, FormControl, FormGroup } from 'react-bootstrap';

import Header from './Header';
import Footer from './Footer';

export default class Login extends Component {
  constructor(props) {
    super(props);
  }

  login = function(){
    // console.log("login()");

    Meteor.loginWithPassword(this.emailInput.value, this.passwordInput.value, function(error) {
      if(error) {
        return console.log("Login Failed. " + error);
      }

      // console.log(Meteor.user());

      browserHistory.push('/datasets');
    });
  }

  register = function() {
    // console.log('register()');

    Accounts.createUser({
      email: this.emailInput.value,
      password: this.passwordInput.value
    }, function(error) {
      if(error) {
        return console.log("Registration Failed. " + error);
      }

      //console.log(Meteor.user());

      browserHistory.push('/datasets');
    });
  }

  render() {
    return (
      <div ref="container" className="container login-box">
        <Col sm={4} md={4} lg={4}>
          <Form horizontal>
            <FormGroup>
              <Col sm={2}>Email</Col>
              <Col sm={10}>
                <FormControl type="email" placeholder="Email" inputRef={function(ref) { this.emailInput = ref; }} />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col sm={2}>密码</Col>
              <Col sm={10}>
                <FormControl type="password" placeholder="Password" inputRef={function(ref) { this.passwordInput = ref; }}/>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col smOffset={2} sm={10}>
                <Checkbox>Remember me</Checkbox>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col smOffset={2} sm={10}>
                <Button className="btn btn-success" onClick={this.login}>登录</Button>
              <Button className="btn btn-warning" onClick={this.register}>注册</Button>
              </Col>
            </FormGroup>
          </Form>
        </Col>
      </div>
    );
  }
}
