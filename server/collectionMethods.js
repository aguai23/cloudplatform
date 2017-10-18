import { Meteor } from 'meteor/meteor';
import { DataCollections } from '../imports/api/dataCollections';
import { Cases } from '../imports/api/cases';
import { Marks } from '../imports/api/marks';


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

});
