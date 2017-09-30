import React from 'react';
import ReactDOM from 'react-dom';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';
import { Redirect, Router, Route, browserHistory } from 'react-router';

import App from '../imports/ui/App';
import AddCase from '../imports/ui/AddCases'
import Login from '../imports/ui/Login';
import Lost from '../imports/ui/Lost';
import Main from '../imports/ui/Main';


injectTapEventPlugin();

Meteor.startup(() => {
  ReactDOM.render((
    <Router history={browserHistory}>
      <Route path="/" component={App} >
        <Route path="/datasets" component={Main}/>
        <Route path="/newCase" component={AddCase}/>
      </Route>
      <Route path="/login" component={Login}></Route>
      <Route exact path="/" render={() => <Redirect to="/login" />} />
      <Route path="*" component={Login}></Route>
  </Router>
), document.getElementById('render-target'));
});
