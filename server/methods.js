import { Meteor } from 'meteor/meteor';
import { DataCollections } from '../imports/api/dataCollections';
import { Cases } from '../imports/api/cases'


//this to the way to use methods for security
Meteor.methods({
  insertDataCollection(dataCollection) {
    DataCollections.insert(dataCollection);
  },

  updateDataCollection(dataCollection) {
    DataCollections.update(dataCollection._id,
    { $set: dataCollection});
  },

  removeDataCollection(dataCollectionId) {
    DataCollections.remove(dataCollectionId);
  },

  insertCase(Case) {
    Cases.insert(Case)
  }
});
