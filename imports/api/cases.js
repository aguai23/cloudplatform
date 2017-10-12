import { Mongo } from 'meteor/mongo';

export const Cases = new Mongo.Collection('cases');

Cases.allow({
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

Cases.deny({
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



const CaseSchema = new SimpleSchema({
  name: {
    label: '名称',
    type: String
  },
  type: {
    label: '类型',
    type: String
  },
  class: {
    label: '分类',
      type: String
  },
  label: {
    label: '标签',
    type: String
  },
  files: {
    label: '文件地址',
    type: [String]
  },
  profile: {
    label: '信息',
    type: Object,
    blackbox: true,
    optional: true
  },
  createAt: {
    label: '时间',
    type: String,
    optional: true,
  },
  collectionId: {
    label: '所属数据集',
    type: String
  },
  ownerId: {
    label: '所属用户Id',
    type: String,
    optional: true
  },
});

Cases.attachSchema(CaseSchema);