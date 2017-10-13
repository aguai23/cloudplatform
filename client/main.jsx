import React from 'react';
import ReactDOM from 'react-dom';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';
import { Redirect, Router, Route, browserHistory } from 'react-router';

import App from '../imports/ui/App';
import AddCase from '../imports/ui/AddCases';
import CaseList from '../imports/ui/CaseList';
import Login from '../imports/ui/Login';
import Lost from '../imports/ui/Lost';
import Main from '../imports/ui/Main';
import Registration from '../imports/ui/Registration';


injectTapEventPlugin();

Meteor.startup(() => {
  ReactDOM.render((
    <Router history={browserHistory}>
      <Redirect from="/" to="/login"></Redirect>
      <Route path="/" component={App} >
        <Route path="datasets" component={Main}></Route>
        <Route path="newCase" component={AddCase}></Route>
        <Route path="caseList" component={CaseList}></Route>
      </Route>
      <Route path="login" component={Login}></Route>
      <Route path="registration" component={Registration}></Route>
      <Route path="*" component={Login}></Route>
    </Router>
), document.getElementById('render-target'));
});
