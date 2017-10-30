import { Mongo } from 'meteor/mongo';

export const Cases = new Mongo.Collection('cases');
export const Series = new Mongo.Collection('series');

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

const diagnose = new SimpleSchema({
  seriesNumber: {
    label: 'seriesNumber',
    type: String
  },
  circle: {
    label: 'circleResult',
    type: Object,
    blackbox: true,
    optional: true
  },
  border: {
    label: 'borderResult',
    type: Object,
    blackbox: true,
    optional: true
  }
});

const seriesSchema = new SimpleSchema({
  seriesNumber: {
    label: 'seriesId',
    type: Number,
    optional: true
  },
  seriesInstanceUID: {
    label: 'uid',
    type: String
  },
  path: {
    label: 'directory for the series',
    type: String
  },
  files: {
    label: 'fileList',
    type: [String]
  },
  seriesDescription: {
    label: 'seriesDescription',
    type: String,
    optional: true
  },
  total: {
    label: 'totalSliceNumber',
    type: Number
  },

  diagnoseResult: {
    label: 'result',
    type: diagnose,
    blackbox: true,
    optional: true
  },
});

const CaseSchema = new SimpleSchema({
  accessionNumber: {
    label: 'unique id',
    type: String
  },

  patientID: {
    label: 'unique id of patient',
    type: String
  },

  otherPatientIDs: {
    label: 'other Id',
    type: [String],
    optional: true
  },

  patientName: {
    label: 'patientName',
    type: String
  },

  patientBirthDate: {
    label: 'patientAge',
    type: Number
  },

  patientSex: {
    label: 'patientSex',
    type: String
  },

  institutionName: {
    label: '',
    type: String
  },

  referringPhysicianName: {
    label: 'referringPhysicianName',
    type: String,
    optional: true
  },

  requestedProcedureDescription: {
    label: 'requestedProcedureDescription',
    type: String,
    optional: true
  },

  studyDate: {
    label: 'studyTime',
    type: Date,
  },

  studyID: {
    label: 'studyID',
    type: String
  },

  studyInstanceUID: {
    label: 'studyInstanceUID',
    type: String
  },

  studyDescription: {
    label: 'studyDescription',
    type: String,
    optional: true
  },

  diagnoseResult:{
    label: 'descriptionResult',
    type: String,
    optional: true
  },

  seriesList: {
    label: 'seriesList',
    type: [seriesSchema],
    blackbox: true,
    optional: true
  },

  collectionID: {
    label: 'collectionId',
    type: String
  },

  creator: {
    label: 'creatorId',
    type: String
  },

  createAt: {
    label: 'createTime',
    type: Date,
    denyUpdate: true,
    autoValue: function () {
      if (this.isInsert) {
        return new Date();
      }
    }
  }

});

Cases.attachSchema(CaseSchema);
Series.attachSchema(seriesSchema);
