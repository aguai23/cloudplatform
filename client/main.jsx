import React from 'react';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';
import { Router, Route, browserHistory } from 'react-router';

import App from '../imports/ui/App.jsx';
import New from '../imports/ui/New.jsx';
import Lost from '../imports/ui/Lost.jsx';
import Home from '../imports/ui/Home.jsx';


injectTapEventPlugin();

Meteor.startup(() => {
  render((
    <Router history={browserHistory}>
    <Route path="/" component={Home} />
    <Route path="/datasets" component={App} />
    <Route path="/new" component={New} />
    <Route path="*" component={New} />
  </Router>
), document.getElementById('render-target'));
});
