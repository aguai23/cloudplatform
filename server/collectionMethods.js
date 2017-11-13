import { Meteor } from 'meteor/meteor';
import { DataCollections } from '../imports/api/dataCollections';
import { Cases } from '../imports/api/cases';
import { Marks } from '../imports/api/marks';

const rimraf = require("rimraf");



//this to the way to use methods for security
Meteor.methods({
  /**
   * insert data collection
   * @param dataCollection
   */
  insertDataCollection(dataCollection) {
    DataCollections.insert(dataCollection);
  },

  /**
   * update data collection
   * @param dataCollection
   */
  updateDataCollection(dataCollection) {
    DataCollections.update(dataCollection._id,
    { $set: dataCollection});
  },

  /**
   * remove data collection
   * @param dataCollectionId
   */
  removeDataCollection(dataCollectionId) {
    let dataCollection = DataCollections.findOne({_id: dataCollectionId});
    let cases = Cases.find({collectionName: dataCollection.name});
    cases.map(function (singleCase) {
      Cases.remove(singleCase._id);
    });
    DataCollections.remove(dataCollectionId);
  },

  /**
   * insert case
   * @param Case
   */
  insertCase(Case) {
    Cases.insert(Case)
  },

  /**
   * modify case
   * @param Case
   */
  modifyCase(Case){
    Cases.update(Case._id,
      { $set: Case })
  },

  /**
   * delete case
   * @param CaseId
   */
  deleteCase(CaseId){
    Cases.remove(CaseId);
  },

  /**
   * insert mark
   * @param Mark
   */
  insertMark(Mark){
    Marks.insert(Mark)
  },

  /**
   * modify mark
   * @param Mark
   */
  modifyMark(Mark){
    Marks.update(Mark._id,
      { $set: Mark})
  },

  /**
   * remove mark
   * @param MarkId
   */
  removeMark(MarkId){
    Marks.remove(MarkId)
  },

  /**
   * remove one series
   * @param path
   */
  removeSeries(path) {
    const wrappedRimraf = Meteor.wrapAsync(rimraf);

    wrappedRimraf(path, function(error, result) {
      if(error) {
        console.error("Problem deleting file. " + error);
        return {
          statues: 'failure',
          error: error
        }
      }

      return {
        status: 'success'
      }
    });
  }

});
