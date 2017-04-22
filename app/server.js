//Get the necessary modules
var http = require('http');
var fs = require('fs');
var express = require('express');
// Get the right express method
var app = express();
// Get the settings data file
var settings = require('./settings.json');
// Load in vars from the settings file
var url = settings.streamUrl;
var duration = settings.logDuration;
var offset = settings.logOffset;

// Create the writable stream for the output
var wstream = fs.createWriteStream('app/public/recordings/output.mp3');

//Get the data, save it to file and log it to the console
http.get(url, function(response) {
  // Save the data to a stream
  response.pipe(wstream);
  // WHen you finish, say so
  response.on('end', function() {
    console.log('FINISHED STREAMING');
  });
});

// Which port shall we listen on?
app.set('port', process.env.PORT || 3000 );
// Which directory will host static assets
app.use(express.static('app/public'));
// Init the server
var server = app.listen(app.get('port'), function() {
    console.log('SOURCE STREAM: '+url);
  console.log('Hyperlog is running on port ' + app.get('port') + '\nCtrl+C to stop...');
});
