import { Mongo } from 'meteor/mongo';

export const DataCollections = new Mongo.Collection('dataCollections');

DataCollections.allow({
  insert() {
    return false;
  },
  update() {
    return false;
  },
  remove() {
    return false;
  }
});

DataCollections.deny({
  insert() {
    return true;
  },
  update() {
    return true;
  },
  remove() {
    return true;
  }
});



const DataCollectionSchema = new SimpleSchema({
  name: {type : String },
  type: {type : String },
  ownerId: { type: String, optional:true},
});

DataCollections.attachSchema(DataCollectionSchema);
