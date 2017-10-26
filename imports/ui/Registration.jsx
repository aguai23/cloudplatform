import { Meteor } from 'meteor/meteor';
import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import { Accounts } from 'meteor/accounts-base';
import { Button, Checkbox, Col, Form, FormControl, FormGroup } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';

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

  btnRegister: {
    width: '50px',
    margin: '0 auto'
  },

  linkAlreadyHaveAccount: {
    fontSize: '12px'
  }
};

validateEmail = function() {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  console.log(re.test(this.emailInput.value));
  return re.test(this.emailInput.value);
};

export default class Registration extends Component {
  constructor(props) {
    super(props);
  }

  register = function() {

    if(this.emailInput.value === undefined || this.emailInput.value === "") {
      toast.warning("注册失败：Email不能为空");
      return console.log("Registration Failed. Error: Empty email address.");
    }

    if(!validateEmail()) {
      toast.warning("注册失败：请输入有效的Email地址");
      return console.log("Registration Failed. Error: Invalid email address.");
    }


    if(this.passwordInput.value === undefined || this.passwordInput.value === "") {
      toast.warning("注册失败：密码不能为空");
      return console.log("Registration Failed. Error: Empty password.");
    }

    if(this.passwordInput.value !== this.confirmPasswordInput.value) {
      toast.warning("注册失败：两次输入密码不一致");
      return console.log("Registration Failed. Error: Different passwords.");
    }

    Accounts.createUser({
      email: this.emailInput.value,
      password: this.passwordInput.value,
      isAdmin: this.adminInput.value === 'on' ? true : false ,
    }, function(error) {
      if(error) {
        return console.log("Registration Failed. " + error);
      }

      localStorage.setItem('userInfo', JSON.stringify(Meteor.user()));
      browserHistory.push('/datasets');
    });
  };

  render() {
    return (
      <div ref="container" className="container" style={styles.loginBox}>
        <h3 style={{textAlign: 'center'}}>新用户注册</h3>
        <hr/>
          <Form horizontal>
            <FormGroup>
              <Col sm={3}>Email</Col>
              <Col sm={9}>
                <FormControl type="email" placeholder="Email" inputRef={function(ref) { this.emailInput = ref; }} />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col sm={3}>密码</Col>
              <Col sm={9}>
                <FormControl type="password" placeholder="Password" inputRef={function(ref) { this.passwordInput = ref; }}/>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col sm={3}>确认密码</Col>
              <Col sm={9}>
                <FormControl type="password" placeholder="Confirm password" inputRef={function(ref) { this.confirmPasswordInput = ref; }}/>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col smOffset={3} sm={9}>
                <Checkbox inputRef={function(ref) { this.adminInput = ref; }}  >管理员</Checkbox>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col smOffset={3} sm={9}>
                <Checkbox>同意使用协议</Checkbox>
              </Col>
            </FormGroup>

            <hr/>

            <div style={styles.btnRegister}>
              <Button className="btn btn-warning" onClick={this.register}>注册</Button>
            </div>
            <a href="login" className="pull-right" style={styles.linkAlreadyHaveAccount}>已经有账号?</a>
          </Form>

          <ToastContainer
              position="top-center"
              type="info"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              pauseOnHover
            />
      </div>
    );
  }
}
