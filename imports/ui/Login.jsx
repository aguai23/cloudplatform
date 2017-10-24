import { Meteor } from 'meteor/meteor';
import React, { Component } from 'react';
import { browserHistory } from 'react-router';
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

  linkNoAccountYet: {
    fontSize: '12px'
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
      <div ref="container" className="container" style={styles.loginBox}>
        <h3 style={{textAlign: 'center'}}>用户登录</h3>
        <hr/>
          <Form horizontal>
            <FormGroup>
              <Col sm={2}>邮箱</Col>
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

            {/* <FormGroup>
              <Col smOffset={2} sm={10}>
                <Checkbox>Remember me</Checkbox>
              </Col>
            </FormGroup> */}

            <FormGroup>
              <Col smOffset={2} sm={10}>
                <Button className="btn btn-success" onClick={this.login}>登录</Button>
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
    );
  }
}
