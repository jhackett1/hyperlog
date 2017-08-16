// Hook into the Mixcloud API to process uploads

// Get the modules
var request = require('request');
// For debug - not needed when run as an include from recorder.js
var fs = require('fs');
// Grab the access token from the JSON file and save it as a var
var accessToken = require('./accesstoken.json').access_token;

// Function to check whether our accesstoken is valid and which account it is for
function checkAuth(){
  request({
    // Endpoint
    uri: "https://api.mixcloud.com/me/?access_token=" + accessToken,
    // Verb
    method: "GET",
    // Form data - the two required fields, a readable file stream and the name of the show
    // Optional callback on request completion. Was it successful?
  }, function(error, response, body) {
    // If there was an error, log it
    if (error) {
      return console.error('Mixcloud authentication failure:', error);

    }
    // Otherwise, just log the response
    console.log('Hyperlog is authenticated with the ' + JSON.parse(body).name + ' Mixcloud account');

  });
}


// Function to process an upload, accepting the metadata object of the recording as an argument
function processUpload(metaObject){
  // Grab the icon file, and when you've got it, continue the upload
  request(metaObject.icon).pipe(fs.createWriteStream(__dirname + '/public/icon.jpg')
    .on('finish', function(){
      startUpload(metaObject)
    }));
}

// Interact with the Mixcloud API
function startUpload(metaObject){
  // // // Make the request
  request({
    // Endpoint
    uri: "https://api.mixcloud.com/upload/?access_token=" + accessToken,
    // Verb
    method: "POST",
    // Form data - the two required fields, a readable file stream and the name of the show
    formData: {
      name: metaObject.showName,
      mp3: fs.createReadStream(__dirname + '/public/recordings/' + metaObject.fileName + '.mp3'),
      picture: fs.createReadStream(__dirname + '/public/icon.jpg'),
      description: metaObject.showDesc
    }
    // Optional callback on request completion. Was it successful?
  }, function(error, response, body) {
    // If there was an error, log it
    if (error) {
      return console.error('Upload failed:', error);
    }
    // Otherwise, just log the response
    console.log(body);
  });
}


module.exports = {
  processUpload: function(metaObject){
    processUpload(metaObject)
  },
  checkAuth: function(){
    checkAuth();
  }
};
