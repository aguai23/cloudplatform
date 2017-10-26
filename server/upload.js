import { Meteor } from 'meteor/meteor';

var fs = require('fs'),
    rimraf = require("rimraf"),
    mkdirp = require('mkdirp'),
    multiparty = require('multiparty'),

    fileInputName = Meteor.settings.FILE_INPUT_NAME || "qqfile",
    // publicDir = process.env.PUBLIC_DIR,
    // nodeModulesDir = process.env.NODE_MODULES_DIR,
    uploadedFilesPath = Meteor.settings.UPLOADED_FILES_PATH,
    chunkDirName = "chunks",
    // port = process.env.SERVER_PORT || 8000,
    maxFileSize = Meteor.settings.MAX_FILE_SIZE || 0;

Picker.route('/test', function(params, req, res, next) {
  Meteor.setTimeout(function() {
    res.end('success');
  }, 3000);
});

Picker.route('/uploads', function(params, req, res, next) {
  if(req.method === 'POST') {
    var form = new multiparty.Form();

    form.parse(req, function(err, fields, files) {
      var partIndex = fields.qqpartindex;

      if(partIndex == null) {
        onSimpleUpload(fields, files[fileInputName][0], res);
      } else {

      }
    });
  }
});

Picker.route('/delete/:uuid', function(params, req, res, next) {
  // console.log("params", params);
  // console.log("req", req);
  var uuid = params.uuid,
      dirToDelete = uploadedFilesPath + uuid;

  rimraf(dirToDelete, function(error) {
    if(error) {
      console.error("Problem deleteing file. " + error);
      res.status(500);
    }

    res.end("Delete successfully");
  });
});


function onSimpleUpload(fields, file, res) {
  var uuid = fields.qquuid,
      responseData = {
        success: false
      };

  file.name = fields.qqfilename;

  if(isValid(file.size)) {
    moveUploadedFile(file, uuid, function(filePath) {
      responseData.success = true;
      responseData.filePath = filePath;
      res.end(JSON.stringify(responseData));
    }, function() {
      responseData.error = "Problem saving the file";
      res.end(JSON.stringify(responseData));

    });
  } else {
    failWithTooBigFile(responseData, res);
  }
}

function failWithTooBigFile(responseData, res) {
  responseData.error = "File too big";
  responseData.preventRetry = true;
  res.end(JSON.stringify(responseData));

}

function isValid(size) {
  return maxFileSize === 0 || size < maxFileSize;
}

function moveFile(destinationDir, sourceFile, destinationFile, successCb, failureCb) {
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
          successCb(destinationFile);
        })
        .pipe(destStream);
    }
  })
}

function moveUploadedFile(file, uuid, successCb, failureCb) {
  var destinationDir = uploadedFilesPath + uuid + "/",
      fileDestination = destinationDir + file.name;

  moveFile(destinationDir, file.path, fileDestination, successCb, failureCb);
}
