import { Meteor } from 'meteor/meteor';
import { DataCollections } from '../imports/api/dataCollections';

Meteor.startup(() => {
  // code to run on server at startup
  Meteor.publish('dataCollections', function() {
    return DataCollections.find({});
  });
});
