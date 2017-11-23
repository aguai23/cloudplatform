import React, { Component } from 'react';
import { Meteor } from 'meteor/meteor';

import './css/loadingScene.css';
import '../css/common/spinner.css';

export default class MainCanvas extends Component {
  constructor(props) {
    super(props);

    this.state =  {
      show: this.props.show
    }
  }

  componentWillReceiveProps(nextProps) {
    if(this.state.show !== nextProps.show) {
      this.setState({
        show: nextProps.show
      });
    }
  }

  render() {
    return (
      <div className="overlay-base" style={{display: this.state.show ? 'block' : 'none'}}>
        <div className="overlay-loading">
          <div className="lds-microsoft" style={{height: '100%'}}>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <div className="loading-text">
            Loading...
          </div>
        </div>
      </div>
    )
  }
}
