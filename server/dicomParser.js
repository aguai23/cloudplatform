/**
 * Implement parser-related functions, that are responsible for
 * parsing data form DICOM files on the server side
 */

import { Meteor } from 'meteor/meteor';

import { Cases } from '../imports/api/cases';

var fs = require('fs');

var dicomObj = {};
var caseid = 0;
Meteor.methods({

  /**
   * Parse all DICOMs that belongs to the requested case
     @param caseId the id of requested caseId
     @returns {status}
   */
  prepareDicoms(caseId) {
    var result = {status: 'FAILURE'},
        userId = Meteor.userId();
    caseid = caseId;
    dicomObj[userId] = {};

    /**
     * get requested case
     */
    var foundCase = Cases.findOne({_id: caseId});

    /**
     * parse all DICOMs and save
     */
    if(userId && foundCase.files && foundCase.files.length > 0) {
      for(var i = 0; i < foundCase.files.length; i++) {
        var data = fs.readFileSync(foundCase.files[i]);
        var dataset = dicomParser.parseDicom(data);
        var index = parseInt(dataset.string('x00200013'));

        dicomObj[userId][index-1] = dataset;
      }

      result.status = "SUCCESS";
      result.imageNumber = foundCase.files.length;
    }

    return result;
  },

  /**
   * Get specific DICOM according to the request
   * @param index index of the DICOM file
   * @return {Object} contains the status and parsed information for the DICOM
   */
  getDicom(index) {
    var userId = Meteor.userId();

    if(!userId || !dicomObj[userId][index-1])  return {status: 'FAILURE'};

    var result = {};
    result.imageId = caseid + "#" + index;
    result.status = 'SUCCESS';

    result.imageBuf = dicomObj[userId][index-1].byteArray;
    result.pixelDataOffset = dicomObj[userId][index-1].elements.x7fe00010.dataOffset;
    result.pixelDataLength = dicomObj[userId][index-1].elements.x7fe00010.length;

    result.getPixelData = function() {};
    result.minPixelValue = 0;
    result.maxPixelValue = 4096;
    result.slope = dicomObj[userId][index-1].string('x00281053').length === 0 ? 0 : parseInt(dicomObj[userId][index-1].string('x00281053'));
    result.intercept = dicomObj[userId][index-1].string('x00281052').length === 0 ? -1024 : parseInt(dicomObj[userId][index-1].string('x00281052'));
    result.windowCenter = -600;
    result.windowWidth = 1500;
    result.columns = dicomObj[userId][index-1].string('x00280011').length === 0 ? 512 : parseInt(dicomObj[userId][index-1].string('x00280011'));
    result.rows = dicomObj[userId][index-1].string('x00280010').length === 0 ? 512 : parseInt(dicomObj[userId][index-1].string('x00280010'));
    result.width = result.columns;
    result.height = result.rows;
    result.sizeInBytes = result.rows * result.columns * 2;

    return result;
  }

});
