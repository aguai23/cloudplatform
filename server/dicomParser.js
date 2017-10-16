import { Meteor } from 'meteor/meteor';

import { Cases } from '../imports/api/cases';

var fs = require('fs');

var dicomObj = {};
var caseid = 0;
Meteor.methods({
 prepareDicoms(caseId) {
    var foundCase = Cases.findOne({_id: caseId});
    caseid = caseId;

    for(var i = 0; i < foundCase.files.length; i++) {

        var data = fs.readFileSync(foundCase.files[i]);
        var dataset = dicomParser.parseDicom(data);
        var index = parseInt(dataset.string('x00200013'));
        dicomObj[index-1] = dataset;
    }

    var result = {status : 'SUCCESS', imageNumber : foundCase.files.length};
    return result;

  },

  getDicom(index) {
    if(!dicomObj[index-1])  return {status: 'FAILED'};

    var result = {};
    result.imageId = caseid + "#" + index;
    result.status = 'SUCCESS';
    result.imageBuf = dicomObj[index-1].byteArray;
    result.pixelDataOffset = dicomObj[index-1].elements.x7fe00010.dataOffset;
    result.pixelDataLength = dicomObj[index-1].elements.x7fe00010.length;
    result.getPixelData = function() {};
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
