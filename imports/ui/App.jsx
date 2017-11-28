import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { browserHistory } from 'react-router';
import { ToastContainer, toast } from 'react-toastify';

import Header from './Header';
import Footer from './Footer';
import DatasetMenu from './DatasetMenu';

import './css/common/eightCols.css';

const styles = {
  footer: {

  }
};

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
    let containerHeight = window.innerHeight - 61;

    const childrenWithProps = React.Children.map(this.props.children, (child) => {

      return React.cloneElement(child, {
        routes: this.props.routes,
        params: this.props.params
      });

    });

    return (
      <div>
        <Header routes={this.props.routes} params={this.props.params} location={this.props.location}/>
          <div className="eight-cols" style={{height: containerHeight}}>
            <div className="col-sm-1 nav-container">
              <DatasetMenu location={this.props.location}/>
            </div>
            <div className="col-sm-7 content-container">
              {childrenWithProps}
            </div>
          </div>
        <Footer style={styles.footer}/>
      </div>
    )
  }
}
