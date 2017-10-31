import { Meteor } from 'meteor/meteor';
import { DataCollections } from '../imports/api/dataCollections';
import { Cases, Series } from '../imports/api/cases';
import { Marks } from '../imports/api/marks';

const rimraf = require("rimraf");

const Fiber = Npm.require('fibers');


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
  },

  modifyCase(Case){
    Cases.update(Case._id,
      { $set: Case })
  },

  deleteCase(CaseId){
    Cases.remove(CaseId);
  },

  insertMark(Mark){
    Marks.insert(Mark)
  },

  modifyMark(Mark){
    Marks.update(Mark._id,
      { $set: Mark})
  },

  removeMark(MarkId){
    Marks.remove(MarkId)
  },

  removeSeries(seriesInstanceUID) {
    let foundSeries = Series.findOne({seriesInstanceUID: seriesInstanceUID});

    const wrappedRimraf = Meteor.wrapAsync(rimraf);

    wrappedRimraf(foundSeries.path, function(error, result) {
      if(error) {
        console.error("Problem deleting file. " + error);
        return {
          statues: 'failure',
          error: error
        }
      }

      Series.remove({_id: foundSeries._id});

      return {
        status: 'success'
      }
    });
  }

});
