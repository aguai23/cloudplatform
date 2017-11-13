import { Cases } from '../imports/api/cases';

let fs = require('fs'),
    path = require('path'),
    jpeg = require('jpeg-js'),
    mkdirp = require('mkdirp'),
    archiver = require('archiver');

  /**
   * provides download API for client, which handles download request for both study and series
   *
   */
  Picker.route('/download', (params, req, res, next) => {
    let caseId = params.query.caseId,
        seriesIndex = params.query.seriesIndex,
        dirPath = '/zip';

    if(caseId === undefined) {
      res.writeHead(500, {
        error: 'Param caseId is required'
      });
      res.end();
      return;
    }

    let caseInstance = Cases.findOne({_id: caseId});

    if(caseInstance === undefined) {
      res.writeHead(500, {
        error: 'Case not found. Please provide correct caseId'
      });
      res.end();
      return;
    }

    let seriesList = caseInstance.seriesList;

    if(seriesIndex === undefined) {
      // download by study
      // need to do more work here... (set sub dirctory path in zip)
      let archive = initArchiver(dirPath, caseInstance.studyInstanceUID + '.zip');
      for(let i = 0; i < seriesList.length; i++) {
        convertDicomFiles(seriesList[i].seriesInstanceUID, seriesList[i].path, archive);
      }
      archive.finalize();
    } else {
      // download by series
      let fileName = seriesList[seriesIndex].seriesInstanceUID + '.zip';

      let header = {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename=\"' + fileName + '\"'
      }

      res.writeHead(200, header);

      let archive = initArchiver(dirPath, fileName, res);
      convertDicomFiles(seriesList[seriesIndex].seriesInstanceUID, seriesList[seriesIndex].path, archive);
      archive.finalize();
    }

  });

/**
 * parses dicom file the extract useful information
 * @param seriesInstanceUID the seriesInstanceUID of requested series
 * @param dirPath directory path of dicom files
 * @param archive the archive stream
 */
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

/**
 * convert dicom image data to jpeg data
 * @param rawImageData object that contains dicom pixelData
 * @returns jpeg image data
 */
function dicom2jpeg(rawImageData) {
  return jpeg.encode(rawImageData, 100);
}


function compressJpeg(archive, imageData, options) {
  options.name = options.name.split('.dcm')[0] + '.jpeg';
  archive.append(imageData, options);
}

/**
 * init archive, setting configuration and event listener
 * @param targetDirPath the directory path holding the zip file
 * @param fileName the zip file name
 * @param output output stream, should be ServerResponse here
 * @returns the archive object, which is an readableStream
 */
function initArchiver(targetDirPath, fileName, output) {
  if(!fs.existsSync(targetDirPath)) {
    mkdirp.sync(targetDirPath);
  }

  // let output = fs.createWriteStream(path.join(targetDirPath, fileName));

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
