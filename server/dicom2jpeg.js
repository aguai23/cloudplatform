import { Cases } from '../imports/api/cases';

let fs = require('fs'),
    path = require('path'),
    jpeg = require('jpeg-js'),
    mkdirp = require('mkdirp'),
    archiver = require('archiver');

Meteor.methods({
  downloadSeries(caseId, seriesIndex) {
    let caseInstance = Cases.findOne({_id: caseId});
    let seriesList = caseInstance.seriesList;

    if(seriesIndex == undefined) {
      let archive = initArchiver('/zip', caseInstance.studyInstanceUID + '.zip');
      for(let i = 0; i < seriesList.length; i++) {
        archive.directory('subdir/', caseInstance.studyInstanceUID);
        convertDicomFiles(seriesList[i].seriesInstanceUID, seriesList[i].path, archive);
      }
      archive.finalize();
    } else {
      let series = seriesList[seriesIndex];
      let archive = initArchiver('/zip', series.seriesInstanceUID + '.zip');
      archive.directory('subdir/', series.seriesInstanceUID);
      convertDicomFiles(series.seriesInstanceUID, series.path, archive);
      archive.finalize();
    }

    return 'downloadSeries called successfully';
  }
});

function convertDicomFiles(seriesInstanceUID, dirPath, archive) {
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

    let rawImageData = {
      width: imageWidth,
      height: imageHeight,
      data: frameData
    }

    let jpegImageData = dicom2jpeg(rawImageData);
    let options = {
      name: fileNames[i],
      directory: seriesInstanceUID
    };

    compressJpeg(archive, jpegImageData.data, options);
  }
}

function dicom2jpeg(rawImageData, fileName) {
  return jpeg.encode(rawImageData, 100);
}

function compressJpeg(archive, imageData, options) {
  options.name = options.name.split('.dcm')[0] + '.jpeg';
  archive.append(imageData, options);
}

function initArchiver(targetDirPath, fileName) {
  if(!fs.existsSync(targetDirPath)) {
    mkdirp.sync(targetDirPath);
  }

  let output = fs.createWriteStream(path.join(targetDirPath, fileName));

  let archive = archiver('zip', {
    zlib: {level: 9}
  });

  output.on('close', () => {
    // console.log(archive.pointer() + ' total bytes');
  });

  output.on('end', () => {
    // console.log('Data has been drained');
  });

  archive.on('warning', (err) => {
    if(err.code === 'ENOENT') {
      console.error(err);
    } else {
      throw err;
    }
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);

  return archive;
}
