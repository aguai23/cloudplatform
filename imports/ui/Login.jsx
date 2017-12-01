import { Meteor } from 'meteor/meteor';
import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import { Button, Checkbox, Col, Form, FormControl, FormGroup } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import "./css/login.css"

const styles = {

  loginBox: {
    margin: '0 auto',
    position: 'relative',
    width: '380px',
    height: "380px",
    marginRight: '180px',
    background: 'white',
    marginTop: "114px"
  },

  linkNoAccountYet: {
    fontSize: '12px',
    color: '#2659ad'
  }
};

export default class Login extends Component {
  constructor(props) {

    super(props);
    this.logoMarginTop = (window.innerHeight - 494)/2;
    this.loginMarginTop = this.logoMarginTop + 24;
  }

  login(){

    if(this.emailInput === undefined || this.emailInput === "") {
      return toast.warning("邮箱不能为空");
    }

    if(this.passwordInput === undefined || this.emailInput === "") {
      return toast.warning("密码不能为空");
    }
    console.log(this.emailInput);
    console.log(this.passwordInput);
    Meteor.loginWithPassword(this.emailInput, this.passwordInput, function(error) {
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
        <div id = "login-logo" style={{top: this.logoMarginTop + "px"}}/>
        <div ref="container"  style={{
          margin: '0 auto',
          position: 'relative',
          width: '380px',
          height: "380px",
          marginRight: '180px',
          background: 'white',
          marginTop: this.loginMarginTop + "px"
        }}>
          <h3 style={{textAlign: 'center',
            color: '#245aa8',
            marginBottom: '50px',
            fontFamily: "Microsoft Yahei",
            fontSize: "16px",
            paddingTop: "30px",
            fontWeight: "bold",
            letterSpacing: "2px"}}>用户登录</h3>

          <div className = "login-text">邮箱</div>
          <div>
            <input id= "login-input" type="text" placeholder="Email" onInput={function (event) {
              this.emailInput = event.target.value;
            }} />
          </div>


          <div className = "login-text">密码</div>
          <div>
            <input id= "login-input" type="password" placeholder="Password" onInput={function (event) {
              this.passwordInput = event.target.value;
            }}/>
          </div>

          {/* <FormGroup>
              <Col smOffset={2} sm={10}>
                <Checkbox>Remember me</Checkbox>
              </Col>
            </FormGroup> */}

          <div>
            <Button className = "login-button" onClick={this.login}>登 录</Button>
          </div>

          <div className={"login-link"}>
            <a href="registration"  style={styles.linkNoAccountYet}>去注册?</a>
          </div>


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
