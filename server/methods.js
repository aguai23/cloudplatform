import { Meteor } from 'meteor/meteor';
import { DataCollections } from '../imports/api/dataCollections';


//this to the way to use methods for security
Meteor.methods({
  insertDataCollection(dataCollection) {
    DataCollections.insert(dataCollection);
  },

  updateDataCollection(dataCollection) {
    DataCollections.update(dataCollection._id,
    { $set: dataCollection});
  },

  deleteDataCollection(dataCollectionId) {
    DataCollections.remove(dataCollectionId);

  }
});
