import React, { Component } from 'react';
import ReactDOM from 'react-dom';

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

  render() {
    console.log("this.props", this.props);
    const childrenWithProps = React.Children.map(this.props.children, (child) => {

      return React.cloneElement(child, {
        routes: this.props.routes,
        params: this.props.params
      });

    });

    console.log(childrenWithProps);

    return (
      <div>
        <Header routes={this.props.routes} params={this.props.params}/>
          {childrenWithProps}
        <Footer style={styles.footer}/>
      </div>
    )
  }
}
