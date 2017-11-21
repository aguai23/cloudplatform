/**
 * Implement parser-related functions, that are responsible for
 * parsing data form DICOM files on the server side
 */

import {
  Meteor
} from 'meteor/meteor';

import {
  Cases
} from '../imports/api/cases';

var fs = require('fs'),
  path = require('path');

//TODO: put this three object into closures or database
var dicomObj = {};
var thumbnailArray = {};
var currentCaseId = undefined;

Meteor.methods({

  /**
   * Parse all DICOMs that belongs to the requested case
   @param caseId the id of requested caseId
   @param seriesIndex which series to load
   @returns {{status: string}}
   */
  prepareDicoms(caseId, seriesIndex) {
    console.log('caseId', caseId);
    console.log('seriesIndex', seriesIndex);
    let result = {
        status: 'FAILURE'
      },
      userId = Meteor.userId();

    currentCaseId = caseId;

    if (!userId) {
      return result;
    }

    if (dicomObj[userId] === undefined) {
      dicomObj[userId] = {};
    }

    if (seriesIndex !== undefined && dicomObj[userId][seriesIndex] === undefined) {
      dicomObj[userId][seriesIndex] = {};
    }

    /**
     * get requested case
     */
    let foundCase = Cases.findOne({
      _id: caseId
    });

    /**
     * parse all DICOMs and save
     */
    let dirPath = foundCase.seriesList[seriesIndex].path;

    let fileNames = fs.readdirSync(dirPath);

    for (let i = 0; i < fileNames.length; i++) {
      let data = fs.readFileSync(path.join(dirPath, fileNames[i]));
      let dataset = dicomParser.parseDicom(data);
      let index = parseInt(dataset.string('x00200013'));
      if (i === 0) {
        result.patientName = dataset.string('x00100010');
        result.patientId = dataset.string('x00100020');
        result.rows = dataset.uint16('x00280010');
        result.cols = dataset.uint16('x00280011');
        result.pixelSpacing = dataset.string('x00280030');
        result.thickness = dataset.string('x00180050');
        result.seriesDate = dataset.string('x00080021');
        result.seriesTime = dataset.string('x00080031');
      }

      dicomObj[userId][seriesIndex][index - 1] = dataset;
    }
    result.status = "SUCCESS";
    result.imageNumber = fileNames.length;
    return result;
  },

  /**
   * Get specific DICOM according to the request
   * @param index index of the DICOM file
   * @return {Object} contains the status and parsed information for the DICOM
   */
  getDicom(seriesIndex, index) {
    var userId = Meteor.userId();

    if (!userId || !dicomObj[userId][seriesIndex][index - 1]) return {
      status: 'FAILURE'
    };

    var result = {};
    let seriesNumber = dicomObj[userId][seriesIndex][index - 1].string('x00200011') ? dicomObj[userId][seriesIndex][index - 1].string('x00200011') : 0
    result.imageId = currentCaseId + "#" + seriesNumber + '#' + index;
    result.status = 'SUCCESS';

    result.imageBuf = dicomObj[userId][seriesIndex][index - 1].byteArray;
    result.pixelDataOffset = dicomObj[userId][seriesIndex][index - 1].elements.x7fe00010.dataOffset;
    result.pixelDataLength = dicomObj[userId][seriesIndex][index - 1].elements.x7fe00010.length;

    result.getPixelData = function () {};
    result.slope = dicomObj[userId][seriesIndex][index - 1].string('x00281053') ? parseInt(dicomObj[userId][seriesIndex][index - 1].string('x00281053')) : 0;
    result.intercept = dicomObj[userId][seriesIndex][index - 1].string('x00281052') ? parseInt(dicomObj[userId][seriesIndex][index - 1].string('x00281052')) : -1024;
    result.modality = dicomObj[userId][seriesIndex][index - 1].string('x00080060')
    result.windowCenter = dicomObj[userId][seriesIndex][index - 1].string('x00281050') ? parseInt(dicomObj[userId][seriesIndex][index - 1].string('x00281050')) : 0;
    result.windowWidth = dicomObj[userId][seriesIndex][index - 1].string('x00281051') ? parseInt(dicomObj[userId][seriesIndex][index - 1].string('x00281051')) : 0;
    result.columns = dicomObj[userId][seriesIndex][index - 1].uint16('x00280011') ? parseInt(dicomObj[userId][seriesIndex][index - 1].uint16('x00280011')) : 512;
    result.rows = dicomObj[userId][seriesIndex][index - 1].uint16('x00280010') ? parseInt(dicomObj[userId][seriesIndex][index - 1].uint16('x00280010')) : 512;
    result.bitsAllocated = dicomObj[userId][seriesIndex][index - 1].uint16('x00280100') ? parseInt(dicomObj[userId][seriesIndex][index - 1].uint16('x00280100')) : 16;
    result.width = result.columns;
    result.height = result.rows;
    result.sizeInBytes = result.rows * result.columns * 2;

    var pixelspacing = dicomObj[userId][seriesIndex][index - 1].string('x00280030');
    if (pixelspacing) {
      let spacings = pixelspacing.split("\\");
      if (spacings.length === 2) {
        result.rowPixelSpacing = parseFloat(spacings[0]);
        result.columnPixelSpacing = parseFloat(spacings[1]);
      }
    }

    if (dicomObj[userId][seriesIndex][index - 1].uint16('x00280107')) {
      result.minPixelValue = dicomObj[userId][seriesIndex][index - 1].uint16('x00280106');
      result.maxPixelValue = dicomObj[userId][seriesIndex][index - 1].uint16('x00280107');
    } else {
      if(result.bitsAllocated === 8) {
        result.windowWidth = Math.round(result.windowWidth / 16);
        result.windowCenter = Math.round(result.windowCenter / 16);
        result.minPixelValue = 0;
        result.maxPixelValue = 255;
      } else if(result.bitsAllocated === 16) {
        result.minPixelValue = 0;
        result.maxPixelValue = 65535;
      }
    }
    return result;
  },

  /**
   * get parsed dicom information for thumbnails
   * @param caseId
   */
  getThumbnailDicoms(caseId) {
    let result = {};
    result.array = [];
    result.status = 'SUCCESS';
    if (!thumbnailArray && !thumbnailArray[caseId]) return {
      status: 'FAILURE'
    };

    if (thumbnailArray[caseId] === undefined || thumbnailArray[caseId].length === 0) {
      let foundCase = Cases.findOne({
        _id: caseId
      });
      for (let i = 0; i < foundCase.seriesList.length; i++) {
        initThumbnail(i, foundCase.seriesList[i].path, caseId);
      }
    }

    for (let i = 0; i < thumbnailArray[caseId].length; i++) {
      let colVal = thumbnailArray[caseId][i].uint16('x00280011') ? thumbnailArray[caseId][i].uint16('x00280011') : 512,
          rowVal = thumbnailArray[caseId][i].uint16('x00280010') ? thumbnailArray[caseId][i].uint16('x00280010') : 512;
      result.array.push({
        imageBuf: thumbnailArray[caseId][i].byteArray,
        pixelDataOffset: thumbnailArray[caseId][i].elements.x7fe00010.dataOffset,
        pixelDataLength: thumbnailArray[caseId][i].elements.x7fe00010.length,
        getPixelData: function () {},
        minPixelValue: 0,
        maxPixelValue: 4096,
        slope: thumbnailArray[caseId][i].string('x00281053') ? parseInt(thumbnailArray[caseId][i].string('x00281053')) : 0,
        intercept: thumbnailArray[caseId][i].string('x00281052') ? parseInt(thumbnailArray[caseId][i].string('x00281052')) : -1024,
        windowCenter: thumbnailArray[caseId][i].string('x00281050') ? parseInt(thumbnailArray[caseId][i].string('x00281050')) : 0,
        windowWidth: thumbnailArray[caseId][i].string('x00281051') ? parseInt(thumbnailArray[caseId][i].string('x00281051')) : 0,
        columns: colVal,
        rows: rowVal,
        width: colVal,
        height: rowVal,
        sizeInBytes: rowVal * colVal * 2
      });

      if (thumbnailArray[caseId][i].uint16('x00280107')) {
        result.array[i].minPixelValue = thumbnailArray[caseId][i].uint16('x00280106');
        result.arry[i].maxPixelValue = thumbnailArray[caseId][i].uint16('x00280107');
      } else {
        if(result.bitsAllocated === 8) {
          result.array[i].windowWidth = Math.round(result.array[i].windowWidth / 16);
          result.array[i].windowCenter = Math.round(result.array[i].windowCenter / 16);
          result.array[i].minPixelValue = 0;
          result.array[i].maxPixelValue = 255;
        } else if(result.bitsAllocated === 16) {
          result.array[i].minPixelValue = 0;
          result.array[i].maxPixelValue = 65535;
        }
      }
    }

    return result;
  }

});

/**
 * initialize thumbnails for series panel
 * @param seriesIndex the corresponding series index for the thumbnail
 * @param dirPath the directory path where the dicom stores for this series
 */
function initThumbnail(seriesIndex, dirPath, caseId) {
  let fileNames = fs.readdirSync(dirPath);
  for (let i = 0; i < fileNames.length; i++) {
    if (!thumbnailArray[caseId]) {
      thumbnailArray[caseId] = []
    }
    let tokens = fileNames[i].split('_');

    if (tokens[tokens.length - 1] === '1.dcm') {
      let data = fs.readFileSync(path.join(dirPath, fileNames[i]));
      thumbnailArray[caseId][seriesIndex] = dicomParser.parseDicom(data);
      return;
    }
  }


}
