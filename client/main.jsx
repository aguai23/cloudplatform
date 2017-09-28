import React from 'react';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';
import { Router, Route, browserHistory } from 'react-router';

import App from '../imports/ui/App.jsx';
import AddCollection from '../imports/ui/AddCollection.jsx';
import Lost from '../imports/ui/Lost.jsx';
import Home from '../imports/ui/Home.jsx';


injectTapEventPlugin();

Meteor.startup(() => {
  render((
    <Router history={browserHistory}>
    <Route path="/" component={Home} />
    <Route path="/datasets" component={App} />
    <Route path="/new" component={AddCollection} />
    <Route path="*" component={AddCollection} />
  </Router>
), document.getElementById('render-target'));
});
