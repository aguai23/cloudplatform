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
  imageIdToolState: {
    label: '图像标注信息',
    type: Object,
    blackbox: true,
    optional: false
  },
  elementToolState: {
    label: '工具状态',
    type: Object,
    blackbox: true,
    optional: false
  },
  elementViewport: {
    label: '视角信息',
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
    type: Date
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