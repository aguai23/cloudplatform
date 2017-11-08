import { Meteor } from 'meteor/meteor';

import { Series } from '../imports/api/cases';

const Fiber = Npm.require('fibers');

var fs = require('fs'),
    path = require('path'),
    formidable = require('formidable'),
    mkdirp = require('mkdirp'),
    multiparty = require('multiparty'),
    localPath = '',
    fileInputName = Meteor.settings.FILE_INPUT_NAME || "qqfile",
    // publicDir = process.env.PUBLIC_DIR,
    // nodeModulesDir = process.env.NODE_MODULES_DIR,
    uploadedFilesPath = Meteor.settings.UPLOADED_FILES_PATH,
    chunkDirName = "chunks",
    // port = process.env.SERVER_PORT || 8000,
    maxFileSize = Meteor.settings.MAX_FILE_SIZE || 0;

Picker.route('/test', function(params, req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  Meteor.setTimeout(function() {
    res.end('success');
  }, 3000);
});

Picker.route('/uploads', function(params, req, res, next) {
  if(req.method === 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');

    let form = new formidable.IncomingForm();

    form.multiples = true;
    form.uploadDir = uploadedFilesPath;

    form.on('field', (name, value) => {
      localPath = path.join(form.uploadDir, value);
      mkdirp(localPath, function(error) {
        if(error) {
          console.error('Failed to create directory. Error: ' + error);
        }
      });
    });

    form.on('fileBegin', (field, file) => {
      let dirPath = path.join(form.uploadDir, field);
      if(fs.existsSync(dirPath)) {
        file.path = path.join(dirPath, file.name);
      }
    });

    form.on('end', () => {
      res.end(localPath);
    });

    form.on('error', (err) => {
      console.log('An error has occurred: \n' + err);
    });

    form.parse(req);

    /*
    form.parse(req, function(err, fields, files) {
      var partIndex = fields.qqpartindex;

      if(partIndex == null) {
        let responseData = {
          success: false
        };

        let file = files[fileInputName][0];

        parseSingleDicom(file.path, function(result) {
          // console.log(result);
          let date = result.studyDate ? result.studyDate : new Date().toISOString().substring(0, 10).replace(/\-/g, '');

          let path = date + '/' + result.studyInstanceUID + '/' + result.seriesInstanceUID;

          onSimpleUpload(fields, file, path, function(fileName) {
            responseData.success = true;
            responseData.fileName = fileName;
            responseData.dicomInfo = result;
            res.end(JSON.stringify(responseData));

            Fiber(function() {
              var foundSeries = Series.findOne({seriesInstanceUID: result.seriesInstanceUID});

              if(foundSeries) {
                Series.update(foundSeries._id, {$set: {
                  files: files,
                  total: foundSeries.total + 1
                }});
              } else {
                let newSeries = {
                  path: uploadedFilesPath + path,
                  seriesInstanceUID: result.seriesInstanceUID,
                  total: 1
                }
                Series.insert(newSeries);
              }
            }).run();

          }, function() {
            responseData.error = "Problem saving the file";
            res.end(JSON.stringify(responseData));
          });
        });
      } else {
        // for chunking upload mode, which is disabled for now

      }
    });
    */
  }
});



/**
 * handles simple upload mode for fine-uploader
 * @param fields the fields from parsing multiparty form
 * @param file the file need to be uploaded
 * @param path the directory tha holds the dicom files for that series
 * @param successCb callback when function works successfully
 * @param failureCb callback when failed to upload dicom file
 */
function onSimpleUpload(fields, file, path, successCb, failureCb) {
  var uuid = fields.qquuid;

  file.name = fields.qqfilename;

  if(isValid(file.size)) {
    moveUploadedFile(file, uuid, path, successCb, failureCb);
  } else {
    failWithTooBigFile(responseData, res);
  }
}

/**
 * emmits an error when the given file is too big
 * @param responseData an object which holds the error information
 * @param res an http response object
 */
function failWithTooBigFile(responseData, res) {
  responseData.error = "File too big";
  responseData.preventRetry = true;
  res.end(JSON.stringify(responseData));

}

/**
 * checks whether the given dicom file has a legal size
 * @param size the size of the dicom file
 * @returns true if size is legal, false if not
 */
function isValid(size) {
  return maxFileSize === 0 || size < maxFileSize;
}

/**
 * moves given file to destination directory
 * @param destinationDir parent directory
 * @param sourceFile the file need to be moved
 * @param destinationFile the final file
 * @param successCb callback for successfully moving the file
 * @param failureCb callback for failing to move the file
 */
function moveFile(destinationDir, sourceFile, destinationFile, fileName, successCb, failureCb) {
  mkdirp(destinationDir, function(error) {
    var sourceStream, destStream;

    if(error) {
      console.error('Problem creating directory ' + destinationDir + ': ' + error);
      failureCb();
    } else {
      sourceStream = fs.createReadStream(sourceFile);
      destStream = fs.createWriteStream(destinationFile);

      sourceStream
        .on('error', function(error) {
          console.error('Problem copying file: ' + error.stack);
          destStream.end();
          failureCb();
        })
        .on('end', function() {
          destStream.end();
          successCb(fileName);
        })
        .pipe(destStream);
    }
  })
}

function moveUploadedFile(file, uuid, parentDir, successCb, failureCb) {
  var destinationDir = uploadedFilesPath + parentDir + "/",
      fileDestination = destinationDir + file.name;
  moveFile(destinationDir, file.path, fileDestination, file.name[0], successCb, failureCb);
}
