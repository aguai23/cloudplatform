/**
 * Implement parser-related functions, that are responsible for
 * parsing data form DICOM files on the server side
 */

import { Meteor } from 'meteor/meteor';

import { Cases } from '../imports/api/cases';

var fs = require('fs'),
    path = require('path');

var dicomObj = {};
var currentCaseId = undefined;
Meteor.methods({

  /**
   * Parse all DICOMs that belongs to the requested case
     @param caseId the id of requested caseId
     @returns {status}
   */
  prepareDicoms(caseId, seriesIndex) {
    let result = {status: 'FAILURE'},
        userId = Meteor.userId();

    currentCaseId = caseId;

    if(userId) {
      dicomObj[userId] = {};
    }

    /**
     * get requested case
     */
    let foundCase = Cases.findOne({_id: caseId});

    /**
     * parse all DICOMs and save
     */
    if(userId && seriesIndex != undefined && foundCase.seriesList && foundCase.seriesList.length > 0) {
      dicomObj[userId][seriesIndex] = {};

      let patientName = undefined,
          patientId = undefined,
          rows = undefined,
          cols = undefined,
          pixelSpacing = undefined,
          thickness = undefined;

      let dirPath = foundCase.seriesList[seriesIndex].path;

      let fileNames = fs.readdirSync(dirPath);

      for(let i = 0; i < fileNames.length; i++) {
        let data = fs.readFileSync(path.join(dirPath, fileNames[i]));
        let dataset = dicomParser.parseDicom(data);

        let index = parseInt(dataset.string('x00200013'));

        patientName = dataset.string('x00100010');
        patientId = dataset.string('x00100020');
        rows = dataset.string('x00280010');
        cols = dataset.string('x00280011');
        pixelSpacing = dataset.string('x00280030');
        thickness = dataset.string('x00180050');

        dicomObj[userId][seriesIndex][index-1] = dataset;
      }

      result.status = "SUCCESS";
      result.imageNumber = fileNames.length;
      result.patientName = patientName;
      result.patientId = patientId;
      result.rows = rows;
      result.cols = cols;
      result.pixelSpacing = pixelSpacing;
      result.thickness = thickness;
    }
    return result;
  },

  /**
   * Get specific DICOM according to the request
   * @param index index of the DICOM file
   * @return {Object} contains the status and parsed information for the DICOM
   */
  getDicom(seriesIndex, index) {
    var userId = Meteor.userId();

    if(!userId || !dicomObj[userId][seriesIndex][index-1])  return {status: 'FAILURE'};

    var result = {};

    result.imageId = currentCaseId + "#" + index;
    result.status = 'SUCCESS';

    result.imageBuf = dicomObj[userId][seriesIndex][index-1].byteArray;
    result.pixelDataOffset = dicomObj[userId][seriesIndex][index-1].elements.x7fe00010.dataOffset;
    result.pixelDataLength = dicomObj[userId][seriesIndex][index-1].elements.x7fe00010.length;

    result.getPixelData = function() {};
    result.minPixelValue = 0;
    result.maxPixelValue = 4096;
    result.slope = dicomObj[userId][seriesIndex][index-1].string('x00281053').length === 0 ? 0 : parseInt(dicomObj[userId][seriesIndex][index-1].string('x00281053'));
    result.intercept = dicomObj[userId][seriesIndex][index-1].string('x00281052').length === 0 ? -1024 : parseInt(dicomObj[userId][seriesIndex][index-1].string('x00281052'));
    result.windowCenter = -600;
    result.windowWidth = 1500;
    result.columns = dicomObj[userId][seriesIndex][index-1].string('x00280011').length === 0 ? 512 : parseInt(dicomObj[userId][seriesIndex][index-1].string('x00280011'));
    result.rows = dicomObj[userId][seriesIndex][index-1].string('x00280010').length === 0 ? 512 : parseInt(dicomObj[userId][seriesIndex][index-1].string('x00280010'));
    result.width = result.columns;
    result.height = result.rows;
    result.sizeInBytes = result.rows * result.columns * 2;

    var pixelspacing = dicomObj[userId][seriesIndex][index - 1].string('x00280030');
    var spacings = pixelspacing.split("\\");
    if (spacings.length === 2) {
      result.rowPixelSpacing = parseFloat(spacings[0]);
      result.columnPixelSpacing = parseFloat(spacings[1]);
    }


    return result;
  }

});
