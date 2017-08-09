// WHAT'S THE FLOW
// |
// |
// |-> IS THE RECORDING FINISHED? (PUT IT IN THE SET-TIMEOUT)
// |-> WAS THERE A SHOW? (WAS META RECORDED?)
// |-> SHOULD THE SHOW BE PUBLISHED TO MIXCLOUD? (IS IT 'ACTIVE'?)
// |-> IF META, GET META (TITLE, DESC, IMAGE, GENRE)
// |-> PASS FILE AND META INTO THIS MODULE AND PROCESS THE UPLOAD
// |
// |______> FINALLY, WE'RE HERE


// TODO TAKE IN MORE METADATA, INCLUDING IMAGE
// PASS METADATA INTO THIS MODULE
// INCLUDE 'ACTIVE'/PUBLISH OPTION ON WEBSITE



// Hook into the Mixcloud API to process uploads
module.exports = {};

// Get the modules
var request = require('request');
var fs = require('fs');

// The access token
var accessToken = '29x3RgLnjhc8baX2RbhdrxcdYvLNYyEW';

function processUpload(name, fileName){
  // Make the request
  request({
    // Endpoint
    uri: "https://api.mixcloud.com/upload/?access_token=" + accessToken,
    // Verb
    method: "POST",
    // Form data - the two required fields, a readable file stream and the name of the show
    formData: {
      name: name,
      mp3: fs.createReadStream(__dirname + filename)
    }
    // Optional callback on request completion. Was it successful?
  }, function(error, response, body) {
    if (error) {
      return console.error('upload failed:', error);
    }
    console.log(body);
  });
}
