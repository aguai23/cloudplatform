import { Meteor } from 'meteor/meteor';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { browserHistory } from 'react-router';

import { Accounts } from 'meteor/accounts-base';

import { Button, Checkbox, Col, Form, FormControl, FormGroup } from 'react-bootstrap';

import Header from './Header';
import Footer from './Footer';


const styles = {
  loginBox: {
    border: '1px solid black',
    borderRadius: '20px',
    margin: '0 auto',
    padding: '10px 30px 10px 30px',
    position: 'relative',
    top: '200px',
    width: '400px'
  },

  linkNoAccountYet: {
    fontSize: '12px'
  }
}

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
      localStorage.setItem('userInfo', JSON.stringify(Meteor.user()));

      browserHistory.push('/datasets');
    });
  }

  render() {
    return (
      <div ref="container" className="container" style={styles.loginBox}>
        <h3 style={{textAlign: 'center'}}>用户登录</h3>
        <hr/>
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
              </Col>
            </FormGroup>

            <a href="registration" className="pull-right" style={styles.linkNoAccountYet}>去注册?</a>

          </Form>
      </div>
    );
  }
}
