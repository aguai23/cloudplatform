import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { browserHistory } from 'react-router';
import { ToastContainer, toast } from 'react-toastify';

import Header from './Header';
import Footer from './Footer';


const styles = {
  footer: {

  }
}

export default class App extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    if(!Meteor.userId()) {
      browserHistory.replace('/login');
      toast.warning("请先登录再进行操作");
    }
  }

  render() {
    const childrenWithProps = React.Children.map(this.props.children, (child) => {

      return React.cloneElement(child, {
        routes: this.props.routes,
        params: this.props.params
      });

    });

    return (
      <div>
        <Header routes={this.props.routes} params={this.props.params}/>
          {childrenWithProps}
        <Footer style={styles.footer}/>
      </div>
    )
  }
}
