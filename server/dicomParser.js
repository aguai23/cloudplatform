import { Meteor } from 'meteor/meteor';

import { Cases } from '../imports/api/cases'


Meteor.methods({
 getDicoms(caseId, index) {
    console.log("caseId", caseId);
    console.log("index", index);

    // console.log("dicomParser", dicomParser);
    var foundCase = Cases.findOne({});

    console.log("foundCase", foundCase);
  }

});
