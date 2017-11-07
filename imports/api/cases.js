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
    seriesInstanceUID: {
    label: 'seriesInstanceUID',
    type: String
  },
  circle: {
    label: 'circleResult',
    type: String,
    optional: true
  },
  border: {
    label: 'borderResult',
    type: String,
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
    label: 'file dir path',
    type: String
  },

  seriesDescription: {
    label: 'seriesDescription',
    type: String,
    optional: true
  },

  seriesDate: {
    label: "series date",
    type: String,
    optional: true
  },

  seriesTime: {
    label: "series time",
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
    patientName: {
        label: 'patientName',
        type: String
    },
    patientBirthDate: {
        label: 'patient birth time',
        type: String
    },
    patientAge: {
        label: 'patient age',
        type: String
    },
    patientSex: {
        label: 'patientSex',
        type: String
    },
    studyID: {
        label: 'studyID',
        type: String
    },
    studyInstanceUID: {
        label: 'studyInstanceUID',
        type: String
    },
    studyDate: {
        label: 'study Date',
        type: String,
    },
    studyTime: {
        label: "study time",
        type: String
    },
    modality: {
        label: "modality type",
        type: String
    },
    bodyPart: {
        label: "body part examined",
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
    collectionName: {
        label: 'collectionName',
        type: String
    },
    creator: {
        label: 'creatorId',
        type: String
    },
    createAt: {
        label: 'createTime',
        type: String,
        denyUpdate: true,
        autoValue: function () {
            if (this.isInsert) {
                return String(new Date());
            }
        }
    }
});

Cases.attachSchema(CaseSchema);
Series.attachSchema(seriesSchema);
