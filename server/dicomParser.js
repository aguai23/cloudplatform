/**
 * Implement parser-related functions, that are responsible for
 * parsing data form DICOM files on the server side
 */

import { Meteor } from 'meteor/meteor';

import DicomData from './dicomData';

let dicomData = new DicomData();
Meteor.methods({

  /**
   * Parse all DICOMs that belongs to the requested case
   @param caseId the id of requested caseId
   @param seriesNumber which series to load
   @returns {{status: string}}
   */
  prepareDicoms(caseId, seriesNumber) {
    let result = dicomData.prepareData(caseId);
    return result[seriesNumber];
  },

  /**
   * Get specific DICOM according to the request
   * @param caseId the study id
   * @param seriesNumber which series
   * @param index index of the DICOM file
   * @return {Object} contains the status and parsed information for the DICOM
   */
<<<<<<< HEAD
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
    result.modality = dicomObj[userId][seriesIndex][index - 1].string('x00080060');
    result.windowCenter = dicomObj[userId][seriesIndex][index - 1].string('x00281050') ? parseInt(dicomObj[userId][seriesIndex][index - 1].string('x00281050')) : 0;
    result.windowWidth = dicomObj[userId][seriesIndex][index - 1].string('x00281051') ? parseInt(dicomObj[userId][seriesIndex][index - 1].string('x00281051')) : 0;
    result.columns = dicomObj[userId][seriesIndex][index - 1].uint16('x00280011') ? parseInt(dicomObj[userId][seriesIndex][index - 1].uint16('x00280011')) : 512;
    result.rows = dicomObj[userId][seriesIndex][index - 1].uint16('x00280010') ? parseInt(dicomObj[userId][seriesIndex][index - 1].uint16('x00280010')) : 512;
    result.width = result.columns;
    result.height = result.rows;
    result.sizeInBytes = result.rows * result.columns * 2;
    result.minPixelValue = 0;
    result.maxPixelValue = 4096;

    var pixelspacing = dicomObj[userId][seriesIndex][index - 1].string('x00280030');
    if (pixelspacing) {
      let spacings = pixelspacing.split("\\");
      if (spacings.length === 2) {
        result.rowPixelSpacing = parseFloat(spacings[0]);
        result.columnPixelSpacing = parseFloat(spacings[1]);
      }
    }

    if (dicomObj[userId][seriesIndex][index - 1].uint16('x00280107')) {
      result.minPixelValue = dicomObj[userId][seriesIndex][index - 1].uint16('x00280106')
      result.maxPixelValue = dicomObj[userId][seriesIndex][index - 1].uint16('x00280107')
    } else {
      switch (result.modality) {
        case 'CT':
          {
            result.minPixelValue = 0
            result.maxPixelValue = 4096
            break;
          }
        case 'DX':
          {
            result.minPixelValue = 0
            result.maxPixelValue = 65536
            break;
          }
      }
    }
    return result;
=======
  getDicom(caseId, seriesNumber, index) {
    return dicomData.getData(caseId, seriesNumber,index);
>>>>>>> 179e889afd8b06df9fee2a5510c9d6850dee91dc
  },

  /**
   * get parsed dicom information for thumbnails
   * @param caseId
   */
  getThumbnailDicoms(caseId) {
    return dicomData.getThumbnail(caseId);
  }

});
