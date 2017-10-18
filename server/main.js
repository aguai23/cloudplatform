import { Meteor } from 'meteor/meteor';
import { DataCollections } from '../imports/api/dataCollections';
import { Cases } from '../imports/api/cases';
import { Marks } from '../imports/api/marks';

Meteor.startup(() => {
  // code to run on server at startup
  Meteor.publish('dataCollections', function() {
    return DataCollections.find({});
  });

  Meteor.publish('cases',function(){
    return Cases.find({});
  });

  Meteor.publish('marks', function(){
    return Marks.find({});
  });
  
});
