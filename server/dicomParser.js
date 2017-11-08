/**
 * Implement parser-related functions, that are responsible for
 * parsing data form DICOM files on the server side
 */

import { Meteor } from 'meteor/meteor';

import { Cases } from '../imports/api/cases';

var fs = require('fs'),
    path = require('path');

var dicomObj = {};
var thumbnailArray = [];
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

    if(!userId) {
      return result;
    }

    if(dicomObj[userId] === undefined) {
      dicomObj[userId] = {};
    }

    if(seriesIndex !== undefined && dicomObj[userId][seriesIndex] === undefined) {
      dicomObj[userId][seriesIndex] = {};
    }

    /**
     * get requested case
     */
    let foundCase = Cases.findOne({_id: caseId});

    if(thumbnailArray.length === 0) {
      for(let i = 0; i < foundCase.seriesList.length; i++) {
        initThumbnail(i, foundCase.seriesList[i].path);
      }
    }

    /**
     * parse all DICOMs and save
     */
    if(userId && seriesIndex !== undefined && foundCase.seriesList && foundCase.seriesList.length > 0) {
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
        rows = dataset.uint16('x00280010');
        cols = dataset.uint16('x00280011');
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
    let seriesNumber = dicomObj[userId][seriesIndex][index-1].string('x00200011')?dicomObj[userId][seriesIndex][index-1].string('x00200011'):0
    result.imageId = currentCaseId + "#" + seriesNumber + '#' + index;
    result.status = 'SUCCESS';

    result.imageBuf = dicomObj[userId][seriesIndex][index-1].byteArray;
    result.pixelDataOffset = dicomObj[userId][seriesIndex][index-1].elements.x7fe00010.dataOffset;
    result.pixelDataLength = dicomObj[userId][seriesIndex][index-1].elements.x7fe00010.length;

    result.getPixelData = function() {};
    result.minPixelValue = 0;
    result.maxPixelValue = 4096;
    result.slope = dicomObj[userId][seriesIndex][index-1].string('x00281053') ? parseInt(dicomObj[userId][seriesIndex][index-1].string('x00281053')) : 0;
    result.intercept = dicomObj[userId][seriesIndex][index-1].string('x00281052') ? parseInt(dicomObj[userId][seriesIndex][index-1].string('x00281052')) : -1024;
    result.windowCenter = -600;
    result.windowWidth = 1500;
    result.columns = dicomObj[userId][seriesIndex][index-1].string('x00280011') ? parseInt(dicomObj[userId][seriesIndex][index-1].string('x00280011')) : 512;
    result.rows = dicomObj[userId][seriesIndex][index-1].string('x00280010') ? parseInt(dicomObj[userId][seriesIndex][index-1].string('x00280010')) : 512;
    result.width = result.columns;
    result.height = result.rows;
    result.sizeInBytes = result.rows * result.columns * 2;

    var pixelspacing = dicomObj[userId][seriesIndex][index - 1].string('x00280030');

    if(pixelspacing) {
      let spacings = pixelspacing.split("\\");
      if (spacings.length === 2) {
        result.rowPixelSpacing = parseFloat(spacings[0]);
        result.columnPixelSpacing = parseFloat(spacings[1]);
      }
    }

    return result;
  },

  /**
   * get parsed dicom information for thumbnails
   */
  getThumbnailDicoms() {
    if(!thumbnailArray)  return {status: 'FAILURE'};

    let result = {};
    result.array = [];

    result.status = 'SUCCESS';

    for(let i = 0; i < thumbnailArray.length; i++) {
      let colVal = thumbnailArray[i].string('x00280011') ? parseInt(thumbnailArray[i].string('x00280011')) : 512,
          rowVal = thumbnailArray[i].string('x00280010') ? parseInt(thumbnailArray[i].string('x00280010')) : 512;
      result.array.push({
        imageBuf: thumbnailArray[i].byteArray,
        pixelDataOffset: thumbnailArray[i].elements.x7fe00010.dataOffset,
        pixelDataLength: thumbnailArray[i].elements.x7fe00010.length,
        getPixelData: function() {},
        minPixelValue: 0,
        maxPixelValue: 4096,
        slope: thumbnailArray[i].string('x00281053') ? parseInt(thumbnailArray[i].string('x00281053')) : 0,
        intercept: thumbnailArray[i].string('x00281052') ? parseInt(thumbnailArray[i].string('x00281052')) : -1024,
        windowCenter: -600,
        windowWidth: 1500,
        columns: colVal,
        rows: rowVal,
        width: colVal,
        height: rowVal,
        sizeInBytes: rowVal * colVal * 2
      });
    }

    return result;
  }

});

/**
 * initialize thumbnails for series panel
 * @param seriesIndex the corresponding series index for the thumbnail
 * @param dirPath the directory path where the dicom stores for this series
 */
function initThumbnail(seriesIndex, dirPath) {
  let fileNames = fs.readdirSync(dirPath);

  for(let i = 0; i < fileNames.length; i++) {
    let tokens = fileNames[i].split('_');

    if(tokens[tokens.length - 1] === '1.dcm') {
      let data = fs.readFileSync(path.join(dirPath, fileNames[i]));
      thumbnailArray[seriesIndex] = dicomParser.parseDicom(data);
      return;
    }
  }


}
