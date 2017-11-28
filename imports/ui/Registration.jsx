import { Meteor } from 'meteor/meteor';
import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import { Accounts } from 'meteor/accounts-base';
import { Button, Checkbox, Col, Form, FormControl, FormGroup } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import './css/registration.css';
const styles = {
  loginBox: {
    margin: '0 auto',
    position: 'relative',
    width: '380px',
    height: "470px",
    marginRight: '180px',
    background: 'white',
    marginTop: "114px",
  },

  btnRegister: {
    width: '50px',
    margin: '0 auto'
  },

  linkAlreadyHaveAccount: {
    fontSize: '14px',
    color: '#245aa8',
    fontFamily: "Microsoft Yahei"
  }
};

validateEmail = function() {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  console.log(re.test(this.emailInput));
  return re.test(this.emailInput);
};

export default class Registration extends Component {
  constructor(props) {
    super(props);
  }

  register = function() {

    if(this.emailInput === undefined || this.emailInput === "") {
      toast.warning("注册失败：Email不能为空");
      return console.log("Registration Failed. Error: Empty email address.");
    }

    if(!validateEmail()) {
      toast.warning("注册失败：请输入有效的Email地址");
      return console.log("Registration Failed. Error: Invalid email address.");
    }


    if(this.passwordInput === undefined || this.passwordInput === "") {
      toast.warning("注册失败：密码不能为空");
      return console.log("Registration Failed. Error: Empty password.");
    }

    if(this.passwordInput !== this.confirmPasswordInput) {
      toast.warning("注册失败：两次输入密码不一致");
      return console.log("Registration Failed. Error: Different passwords.");
    }
    Accounts.createUser({
      email: this.emailInput,
      password: this.passwordInput,
      isAdmin: this.adminInput === true ,
    }, function(error) {
      if(error) {
        toast.warning(error.message);
        return console.log("Registration Failed. " + error);
      }

      localStorage.setItem('userInfo', JSON.stringify(Meteor.user()));
      browserHistory.push('/datasets');
    });
  };

  render() {
    return (
      <div id = "registration-background">
        <div id = "registration-logo"/>
        <div ref="container"  style={styles.loginBox}>
          <h3 style={{textAlign: 'center', color: '#245aa8', marginBottom: '50px',
            fontFamily: "Microsoft Yahei", fontSize: "16px", paddingTop: "30px"}}>新用户注册</h3>


          <div className={'registration-text'}>邮箱</div>
          <div>
            <input className = "registration-input" type="email" placeholder="Email" onInput={function(event) { this.emailInput = event.target.value; }} />
          </div>



          <div className={'registration-text'}>密码</div>
          <div >
            <input className = "registration-input" type="password" placeholder="Password" onInput={function(event) { this.passwordInput = event.target.value; }}/>
          </div>



          <div  className={'registration-text'}>确认密码</div>
          <div >
            <input className = "registration-input" type="password" placeholder="Confirm password" onInput={function(event) { this.confirmPasswordInput = event.target.value; }}/>
          </div>



          <div className = "registration-checkbox">
            <input  type={"checkbox"} className={"registration-check-input"} id={"registration-admin"}
                    onChange={function(event) { this.adminInput = event.target.checked; }}/>
            <label className={"registration-check-label"}  htmlFor="registration-admin">管理员</label>
            <br/>
            <input  type={"checkbox"} className={"registration-check-input"} id={"registration-contract"}/>
            <label className={"registration-check-label"} htmlFor={"registration-contract"}>同意使用协议</label>
          </div>


          <div style={{float : "right", width : "100px", marginRight: "40px", marginTop: "-10px"}}>
            <a href="login" className="pull-right" style={styles.linkAlreadyHaveAccount}>已有账号?</a>
            <Button className="registration-button" onClick={this.register}>注册</Button>
          </div>







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
      </div>
    );
  }
}
