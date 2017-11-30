import { Mongo } from 'meteor/mongo';

export const DataCollections = new Mongo.Collection('dataCollections');

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
  name: {
    label: '名称',
    type: String,
    unique: true
  },
  type: {
    label: 'values: PUBLIC/PRIVATE/FAVORITE',
    type: String,
    optional: false,
    defaultValue: 'PRIVATE'
  },
  equip: {
    label: 'scanning equipments: DBA/HOWTEK/LUMYSIS',
    type: String
  },
  class: {
    label: '分类(收藏夹/数据集)',
    type: String,
    optional: false,
    defaultValue: 'openCollection'
  },
  ownerId: {
    label: '所属用户Id',
    type: String,
    optional: true,
  },
});

DataCollections.attachSchema(DataCollectionSchema);
