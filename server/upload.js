import { Meteor } from 'meteor/meteor';

var fs = require('fs'),
    mkdirp = require('mkdirp'),
    multiparty = require('multiparty'),

    fileInputName = process.env.FILE_INPUT_NAME || "qqfile",
    publicDir = process.env.PUBLIC_DIR,
    nodeModulesDir = process.env.NODE_MODULES_DIR,
    uploadedFilesPath = process.env.UPLOADED_FILES_PATH,
    chunkDirName = "chunks",
    port = process.env.SERVER_PORT || 8000,
    maxFileSize = process.env.MAX_FILE_SIZE || 0;

// Meteor.methods({
//   onUpload: function(req, res) {
//     var form = new multiparty.Form();
//
//     console.log("req", req);
//     //console.log("form", form);
//
//     //form.parse()
//
//
//
//   }
// });

JsonRoutes.add('post', 'uploads', function(req, res, next) {
  // console.log("req", req);
  console.log("res", res);

  var form = new multiparty.Form();

  form.parse(req, function(err, fields, files) {
    console.log('fields', fields);
    console.log('files', files)
    var partIndex = fields.qqpartindex;

    //JsonRoutes.setResponseHeaders({'Content-Type', 'text/plain'});

    console.log('partIndex', partIndex);

    if(partIndex == null) {
      onSimpleUpload(fields, files[fileInputName][0], res);
    } else {

    }
  })
});

function onSimpleUpload(fields, file, res) {
  var uuid = fields.qquuid,
      responseData = {
        success: false
      };

  file.name = fields.qqfilename;

  if(isValid(file.size)) {
    moveUploadedFile(file, uuid, function() {
      responseData.success = true;
      // res.send(responseData);
      // JsonRoutes.sendResult(responseData);
    }, function() {
      responseData.error = "Problem saving the file";
      // res.send(responseData);
      // JsonRoutes.sendResult(responseData);

    });
  } else {
    failWithTooBigFile(responseData, res);
  }
}

function failWithTooBigFile(responseData, res) {
  responseData.error = "File too big";
  responseData.preventRetry = true;
  // res.send(responseData);
  // JsonRoutes.sendResult(responseData);

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
          successCb();
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
