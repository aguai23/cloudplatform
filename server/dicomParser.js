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
      var patientName = undefined;
      var patientId = undefined;
      var rows = undefined;
      var cols = undefined;
      var pixelSpacing = undefined;
      var thickness = undefined;
      for(var i = 0; i < foundCase.files.length; i++) {
        var data = fs.readFileSync(foundCase.files[i]);
        var dataset = dicomParser.parseDicom(data);
        var index = parseInt(dataset.string('x00200013'));
        patientName = dataset.string('x00100010');
        patientId = dataset.string('x00100020');
        rows = dataset.string('x00280010');
        cols = dataset.string('x00280011');
        pixelSpacing = dataset.string('x00280030');
        thickness = dataset.string('x00180050');
        dicomObj[userId][index-1] = dataset;
      }

      result.status = "SUCCESS";
      result.imageNumber = foundCase.files.length;
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

    var pixelspacing = dicomObj[userId][index - 1].string('x00280030');
    var spacings = pixelspacing.split("\\");
    if (spacings.length === 2) {
      result.rowPixelSpacing = parseFloat(spacings[0]);
      result.columnPixelSpacing = parseFloat(spacings[1]);
    }

    return result;
  }

});

/**
 * Parse one dicom file, which is used to get common information when uploading
 * @param filePath the absolute path where the dicom placed
 * @return {Object} the standard dicom information
 */
function parseSingleDicom(filePath, cb) {
  fs.readFile(filePath, (err, data) => {
    if(err) {
      return console.log(err);
    }

    let dataset = dicomParser.parseDicom(data);

    let result = {};

    result.seriesInstanceUID = dataset.string('x0020000e');
    result.accessionNumber = dataset.string('x00080050');
    result.patientID = dataset.string('x00100020');
    result.patientName = dataset.string('x00100010');
    result.patientBirthDate = dataset.string('x00100030');
    result.patientAge = dataset.string('x00101010');
    result.patientSex = dataset.string('x00100040');
    result.studyID = dataset.string('x00200010');
    result.studyDate = dataset.string('x00080020');
    result.studyTime = dataset.string('x00080030');
    result.studyDescription = dataset.string('x00081030'); 
    result.studyInstanceUID = dataset.string('x0020000d');   
    result.seriesDate = dataset.string('x00080021');
    result.seriesTime = dataset.string('x00080031');
    result.seriesDescription = dataset.string('x0008103e');
    result.seriesNumber = dataset.string('x00200011');
    result.modality = dataset.string('x00080060');
    result.bodyPart = dataset.string('x00180015');

    cb(result);
  });
}

export { parseSingleDicom };
