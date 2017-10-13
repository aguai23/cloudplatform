import { Meteor } from 'meteor/meteor';

import { Cases } from '../imports/api/cases'


Meteor.methods({
 getDicoms(caseId, index) {
    console.log("caseId", caseId);
    console.log("index", index);

    // console.log("dicomParser", dicomParser);
    var foundCase = Cases.findOne({_id: caseId});

    console.log("foundCase", foundCase);

    
  }

});
