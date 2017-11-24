import React from 'react';
import ReactDOM from 'react-dom';
import { Meteor } from 'meteor/meteor';
import injectTapEventPlugin from 'react-tap-event-plugin';
import { Redirect, Router, Route, browserHistory } from 'react-router';
import App from '../imports/ui/App';
import AddCase from '../imports/ui/AddCases';
import CaseList from '../imports/ui/CaseList';
import Login from '../imports/ui/Login';
import Main from '../imports/ui/Main';
import Registration from '../imports/ui/Registration';
import Viewer from '../imports/ui/viewer/Viewer';


injectTapEventPlugin();

Meteor.startup(() => {
  ReactDOM.render((
    <Router history={browserHistory}>
      <Redirect from="/" to="/datasets"/>
      <Route path="/" component={App} >
        <Route path="datasets" component={Main}>
        </Route>
        <Route path="newCase" component={AddCase}/>
        <Route path="datasets/:collectionName" component={CaseList}/>
      </Route>
        <Route path="login" component={Login}/>
        <Route path="registration" component={Registration}/>
        <Route path="viewer" component={Viewer}/>
        <Route path="*" component={Login}/>
    </Router>
), document.getElementById('render-target'));
});
