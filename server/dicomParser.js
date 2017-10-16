import { Meteor } from 'meteor/meteor';

import { Cases } from '../imports/api/cases'

var fs = require('fs');

var dicomObj = {};

Meteor.methods({
 prepareDicoms(caseId) {
    console.log("caseId", caseId);

    // console.log("dicomParser", dicomParser);
    var foundCase = Cases.findOne({_id: caseId});

    // console.log("foundCase", foundCase);

    for(var i = 0; i < foundCase.files.length; i++) {
      var data = fs.readFileSync(foundCase.files[i]);


        //buffer = new ArrayBuffer(data);
        //byteArray = new Uint8Array(buffer);

        var dataset = dicomParser.parseDicom(data);
        var index = parseInt(dataset.string('x00200013'));

        // console.log("dataset", dataset);

        dicomObj[index-1] = dataset;
    }

    var result = {status: 'SUCCESS'};

    return result;

  },

  getDicom(index) {
    if(!dicomObj[index-1])  return {status: 'FAILED'};

    var result = {};

    result.status = 'SUCCESS';

    result.imageInfo = dicomObj[index-1].byteArray;
    result.pixelData = dicomObj[index-1].elements.x7fe00010;

    result.minPixelValue = 0;
    result.maxPixelValue = 4096;
    result.slope = dicomObj[index-1].string('x00281053').length === 0 ? 0 : parseInt(dicomObj[index-1].string('x00281053'));
    result.intercept = dicomObj[index-1].string('x00281052').length === 0 ? -1024 : parseInt(dicomObj[index-1].string('x00281052'));
    result.windowCenter = -600;
    result.windowWidth = 1500;
    result.columns = dicomObj[index-1].string('x00280011').length === 0 ? 512 : parseInt(dicomObj[index-1].string('x00280011'));
    result.rows = dicomObj[index-1].string('x00280010').length === 0 ? 512 : parseInt(dicomObj[index-1].string('x00280010'));
    result.width = result.columns;
    result.height = result.rows;
    result.sizeInBytes = result.rows * result.columns * 2;

    return result;
  }

});
