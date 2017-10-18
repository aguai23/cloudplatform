import { Mongo } from 'meteor/mongo';

export const Marks = new Mongo.Collection('Marks');

Marks.deny({
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

const MarkSchema = new SimpleSchema({
  markDetail: {
    label: '图像信息',
    type: Object,
    blackbox: true,
    optional: false
  },
  source: {
    label: '来源(用户/系统)',
    type: String,
  },
  createAt: {
    label: '时间',
    type: String
  },
  caseId: {
    label: '所属病例',
    type: String
  },
  ownerId: {
    label: '所属用户Id',
    type: String,
    optional: true
  },
});

Marks.attachSchema(MarkSchema);