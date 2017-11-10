import { Cases } from '../imports/api/cases';

let fs = require('fs'),
    path = require('path'),
    jpeg = require('jpeg-js'),
    mkdirp = require('mkdirp');

Meteor.methods({
  downloadSeries(caseId, seriesIndex) {
    let caseInstance = Cases.findOne({_id: caseId});

    // console.log('caseInstance', caseInstance);

    let series = caseInstance.seriesList[seriesIndex];

    let jpegPath = path.join('/jpeg', caseInstance.studyInstanceUID, series.seriesInstanceUID);

    if(!fs.existsSync(jpegPath)) {
      mkdirp.sync(jpegPath);
    }

    convertDicomFiles(series.path, jpegPath);

    return 'downloadSeries called successfully';
  }
});

function convertDicomFiles(dirPath, jpegPath) {
  let fileNames = fs.readdirSync(dirPath);

  for(let i = 0; i < fileNames.length; i++) {
    let data = fs.readFileSync(path.join(dirPath, fileNames[i])),
        dataset = dicomParser.parseDicom(data);

    let offset = dataset.elements.x7fe00010.dataOffset,
        imageWidth = dataset.uint16('x00280011'),
        imageHeight = dataset.uint16('x00280010'),
        transferSyntaxUID = dataset.string('x00020010'),
        slope = parseInt(dataset.string('x00281053')),
        intercept = parseInt(dataset.string('x00281052'));

    // now treat all dicom as Little Endian encoded as default
    // if(transferSyntaxUID === '1.2.840.10008.1.2.1​')



    // let windowWidth = dataset.string('x00281051');
    // let windowCenter = dataset.string('00281050');
    let windowWidth = 1500, windowCenter = -600;

    let minValue = windowCenter - windowWidth,
        maxValue = windowCenter + windowWidth;


    let frameData = new Buffer(imageWidth * imageHeight * 4);


    let j = 0;
    while(j < frameData.length) {
      let value = dataset.byteArray.readInt16LE(offset + j / 2);

      value = value * slope + intercept;
      value = Math.min(Math.max(minValue, value), maxValue);
      value = Math.round((value - minValue) / (maxValue - minValue) * 255);

      frameData[j++] = value;
      frameData[j++] = value;
      frameData[j++] = value;
      frameData[j++] = 0xFF;
    }

    // let encodedPixelData = dicomParser.readEncapsulatedPixelData(dataset, dataset.elements.x7fe00010, 0);

    dicom2jpeg({
      width: imageWidth,
      height: imageHeight,
      data: frameData
    }, jpegPath, fileNames[i]);
  }
}

function dicom2jpeg(rawImageData, jpegPath, fileName) {
  var jpegImageData = jpeg.encode(rawImageData, 100);

  fs.writeFile(path.join(jpegPath, fileName.split('.dcm')[0] + '.jpeg'), jpegImageData.data, function(err) {
    if(err) {
      return console.error(err);
    }
  });
}
