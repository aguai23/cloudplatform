/**
 * Implement parser-related functions, that are responsible for
 * parsing data form DICOM files on the server side
 */

import {
  Meteor
} from 'meteor/meteor';


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
  getDicom(caseId, seriesNumber, index) {
    return dicomData.getData(caseId, seriesNumber,index);
  },

  /**
   * get parsed dicom information for thumbnails
   * @param caseId
   */
  getThumbnailDicoms(caseId) {

    return dicomData.getThumbnail(caseId);
  }

});
