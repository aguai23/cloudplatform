import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import Header from './Header';
import Footer from './Footer';

export default class App extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <Header />
          {this.props.children}
        <Footer />
      </div>
    )
  }
}
