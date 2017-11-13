import { Cases } from '../imports/api/cases';

let fs = require('fs'),
    path = require('path'),
    jpeg = require('jpeg-js'),
    mkdirp = require('mkdirp'),
    archiver = require('archiver');

Meteor.methods({
  /**
   * provides download API for client, which handles download request for both study and series
   *
   */
  downloadZip(caseId, seriesIndex) {
    let res = {
      status: 'FAILURE'
    }

    if(caseId === undefined) {
      res.error = 'Param caseId is required';
      return res;
    }

    let caseInstance = Cases.findOne({_id: caseId});

    if(caseInstance === undefined) {
      res.error = 'Case not found. Please provide correct caseId';
      return res;
    }

    let seriesList = caseInstance.seriesList;

    if(seriesIndex == undefined) {
      // download by study
      // need to do more work here... (set sub dirctory path in zip)
      let archive = initArchiver('/zip', caseInstance.studyInstanceUID + '.zip');
      for(let i = 0; i < seriesList.length; i++) {
        convertDicomFiles(seriesList[i].seriesInstanceUID, seriesList[i].path, archive);
      }
      archive.finalize();
    } else {
      // download by series
      let archive = initArchiver('/zip', seriesList[seriesIndex].seriesInstanceUID + '.zip');
      convertDicomFiles(seriesList[seriesIndex].seriesInstanceUID, seriesList[seriesIndex].path, archive);
      archive.finalize();
    }

    res.status = 'SUCCESS';

    return res;
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
