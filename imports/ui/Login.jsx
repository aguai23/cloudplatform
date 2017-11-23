import { Meteor } from 'meteor/meteor';
import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import { Button, Checkbox, Col, Form, FormControl, FormGroup } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import "./css/login.css"

const styles = {

  loginBox: {
    margin: '0 auto',
    padding: '10px 30px 10px 30px',
    position: 'relative',
    marginTop: '10%',
    width: '400px',
    marginLeft: '60%',
    background: 'white'
  },

  linkNoAccountYet: {
    fontSize: '12px',
    color: '#2659ad'
  }
};

export default class Login extends Component {
  constructor(props) {
    super(props);
  }

  login(){

    if(this.emailInput.value === undefined || this.emailInput.value === "") {
      return toast.warning("邮箱不能为空");
    }

    if(this.passwordInput.value === undefined || this.emailInput.value === "") {
      return toast.warning("密码不能为空");
    }

    Meteor.loginWithPassword(this.emailInput.value, this.passwordInput.value, function(error) {
      if(error) {
        console.log(error);
        if(error.reason === 'User not found') {
          toast.warning("用户不存在");
        } else if(error.reason === 'Incorrect password'){
          toast.warning("密码错误");
        }
        return console.log("Login Failed. " + error);
      }

      localStorage.setItem('userInfo', JSON.stringify(Meteor.user()));
      browserHistory.push('/datasets');
    });
  };

  render() {
    return (
      <div id = "login-background">
        <div id = "login-logo"/>
        <div ref="container" className="container" style={styles.loginBox}>
          <h3 style={{textAlign: 'center', color: '#2659ad', marginBottom: '20px'}}>用户登录</h3>
          <Form horizontal>
            <FormGroup >
              <Col smOffset={1} sm={2} className = "login-text">邮箱</Col>
              <br/>
              <Col smOffset={1} sm={10}>
                <FormControl id= "login-input" type="email" placeholder="Email" inputRef={function(ref) { this.emailInput = ref; }} />
              </Col>
            </FormGroup>

            <FormGroup className = "login-box">
              <Col smOffset={1} sm={2} className = "login-text">密码</Col>
              <br/>
              <Col smOffset={1} sm={10}>
                <FormControl id= "login-input" type="password" placeholder="Password" inputRef={function(ref) { this.passwordInput = ref; }}/>
              </Col>
            </FormGroup>

            {/* <FormGroup>
              <Col smOffset={2} sm={10}>
                <Checkbox>Remember me</Checkbox>
              </Col>
            </FormGroup> */}

            <FormGroup>
              <Col smOffset={8} sm={3} style={{textAlign: 'center'}}>
                <Button className = "login-button" onClick={this.login}>登录</Button>
              </Col>
            </FormGroup>

            <a href="registration" className="pull-right" style={styles.linkNoAccountYet}>去注册?</a>

          </Form>
          <ToastContainer
            position="top-center"
            type="info"
            autoClose={2000}
            hideProgressBar={true}
            newestOnTop={false}
            closeOnClick
            pauseOnHover
          />
        </div>
      </div>
    );
  }
}
