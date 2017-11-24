import {Cases} from '../imports/api/cases';
const fs = require('fs');
const path = require('path');
const dicomParser = require('dicom-parser');
/**
 * DicomData is responsible for storing and handling data
 */
export default class DicomData {

  constructor() {
    this.dicomData = {};
    this.doneLoading ={};
    this.studyInfo = {};
    this.loadCount = {};
  }

  /**
   * prepare dicom data for one study, including all series
   * @param caseId
   * @returns {*}
   */
  prepareData(caseId) {
    if (this.studyInfo[caseId]) {
      this.loadCount[caseId]++;
      return this.studyInfo[caseId];
    }
    let caseInstance = Cases.findOne({_id : caseId});
    if (!caseInstance) {
      console.error("case not found");
      return {status: "FAILURE"};
    }
    let seriesCount = caseInstance.seriesList.length;
    this.dicomData[caseId] = {};
    for(let i = 0; i < seriesCount; i++) {
      let seriesInstance = caseInstance.seriesList[i];
      let fileNames = fs.readdirSync(seriesInstance.path);
      this.dicomData[caseId][seriesInstance.seriesNumber] = {};
      for (let j = 0; j < fileNames.length; j++) {
        let data = fs.readFileSync(path.join(seriesInstance.path, fileNames[j]));
        let dataset = dicomParser.parseDicom(data);
        let index = parseInt(dataset.string('x00200013'));
        this.dicomData[caseId][seriesInstance.seriesNumber][index] = dataset;
      }
    }
    this.doneLoading[caseId] = true;
    let result = this.constructStudyInfo(caseId);
    result.seriesCount = seriesCount;
    this.loadCount[caseId] = 1;
    this.studyInfo[caseId] = result;
    return result;
  }

  /**
   * construct study info
   * @param caseId
   * @returns {{}} result[seriesNumber][attributeName]
   */
  constructStudyInfo(caseId) {
    let result = {};
    for (let seriesNumber in this.dicomData[caseId]) {
      if (this.dicomData[caseId].hasOwnProperty(seriesNumber)) {
        result[seriesNumber] = {};
        let dataset = this.dicomData[caseId][seriesNumber][1];
        result[seriesNumber].patientName = dataset.string('x00100010');
        result[seriesNumber].patientId = dataset.string('x00100020');
        result[seriesNumber].rows = dataset.uint16('x00280010');
        result[seriesNumber].cols = dataset.uint16('x00280011');
        result[seriesNumber].pixelSpacing = dataset.string('x00280030');
        result[seriesNumber].thickness = dataset.string('x00180050');
        result[seriesNumber].seriesDate = dataset.string('x00080021');
        result[seriesNumber].seriesTime = dataset.string('x00080031');
        result[seriesNumber].imageNumber = Object.keys(this.dicomData[caseId][seriesNumber]).length;
      }
    }
    return result;
  }

  /**
   * get single dicom data
   * @param caseId the case id
   * @param seriesNumber the series number
   * @param index dicom index
   * @returns {*}
   */
  getData(caseId, seriesNumber, index) {
    if (! this.doneLoading) {
      return {
        status: 'FAILURE'
      }
    }
    return this.constructDicomInfo(caseId, this.dicomData[caseId][seriesNumber][index], index);
  }

  /**
   * construct the result from dicom data
   * @param dataset single dicom element
   * @param index dicom index
   * @returns {{}}
   */
  constructDicomInfo(caseId, dataset, index) {
    let result = {};
    let seriesNumber = dataset.string('x00200011') ? dataset.string('x00200011') : 0;
    result.seriesNumber = seriesNumber;
    result.status = 'SUCCESS';
    result.imageId = caseId + "#" + seriesNumber + '#' + index;
    result.imageBuf = dataset.byteArray;
    result.pixelDataOffset = dataset.elements.x7fe00010.dataOffset;
    result.pixelDataLength = dataset.elements.x7fe00010.length;

    result.getPixelData = function () {};
    result.slope = dataset.string('x00281053') ? parseInt(dataset.string('x00281053')) : 0;
    result.intercept = dataset.string('x00281052') ? parseInt(dataset.string('x00281052')) : -1024;
    result.modality = dataset.string('x00080060');
    result.windowCenter = dataset.string('x00281050') ? parseInt(dataset.string('x00281050')) : 0;
    result.windowWidth = dataset.string('x00281051') ? parseInt(dataset.string('x00281051')) : 0;
    result.columns = dataset.uint16('x00280011') ? parseInt(dataset.uint16('x00280011')) : 512;
    result.rows = dataset.uint16('x00280010') ? parseInt(dataset.uint16('x00280010')) : 512;
    result.bitsAllocated = dataset.uint16('x00280100') ? parseInt(dataset.uint16('x00280100')) : 16;
    result.photometricInterpretation = dataset.string('x00280004') ? dataset.string('x00280004') : 'MONOCHROME2';

    result.width = result.columns;
    result.height = result.rows;
    result.sizeInBytes = result.rows * result.columns * 2;

    let pixelspacing = dataset.string('x00280030');
    if (pixelspacing) {
      let spacings = pixelspacing.split("\\");
      if (spacings.length === 2) {
        result.rowPixelSpacing = parseFloat(spacings[0]);
        result.columnPixelSpacing = parseFloat(spacings[1]);
      }
    }

    if (dataset.int16('x00280107')) {
      result.minPixelValue = dataset.int16('x00280106');
      result.maxPixelValue = dataset.int16('x00280107');
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

  }

  /**
   * get thumbnail info
   * @param caseId the id to get the study
   * @returns {{}}
   */
  getThumbnail(caseId) {
    let result = {};
    result.array = [];

    for(let seriesNumber in this.dicomData[caseId]) {
      let thumbnail = this.constructDicomInfo(caseId, this.dicomData[caseId][seriesNumber][1], 1);
      result.array.push(thumbnail);
    }
    result.status = "SUCCESS";
    return result;


  }

  /**
   * free memory when no one use this case
   * @param caseId
   */
  freeMemory(caseId) {
    this.loadCount[caseId]--;
    if (this.loadCount[caseId]=== 0 && this.dicomData.hasOwnProperty(caseId)) {
      delete this.dicomData[caseId];
      delete this.studyInfo[caseId];
      console.log("delete" + caseId);
    }
  }

}
