// Get the modules
const express = require('express');
const fs = require('fs');
const http = require('http');
const https = require('https');
const njds = require('nodejs-disks');
// Get the express method
const app = express();



// Run the recorder and mixcloud server script
require('./recorder.js');
require('./mixcloud.js');

// Get the settings data file
var metadata = require('./metadata.json');
var settings = require('./settings.json');
// Get the recordings metadata file
var metadataFile = './app/metadata.json';

// View and templating options
app.set('views', __dirname+'/views');
app.set('view engine', 'pug');

// Routes
app.get("/", function(req, res) {
  // Read the metadata file into memory
  fs.readFile(metadataFile, (err, data) => {
    // Handle errors
    if (err) throw err;
    // Get the most recent ten recordings
    var recordingsList = JSON.parse(data).recordings.reverse().slice(0,10);
    // Pass data to and render the template view
    res.render('index',{
      recordings: recordingsList
    });

  });
});

// The API
app.get("/api", function(req, res) {
  // Read the metadata file into memory
  fs.readFile(metadataFile, (err, data) => {
    // Handle errors
    if (err) throw err;
    // Create object to hold data
    var api = {};
    api.info = settings;
    api.recordings = JSON.parse(data).recordings.reverse();
    // Create extra API fields
    api.recordings.forEach(function(recording){
      // Build a URL
      var url = "http://" + settings.hostname + "/recordings/" + recording.fileName + '.mp3';
      recording.url = url;
    });
    // Send the JSON to the client
    res.send(JSON.stringify(api));
  });
});




// The manager
app.get("/manage", function(req, res) {
  njds.drives(
    function (err, drives) {
      njds.drivesDetail(drives, function (err, data) {
        // Process time string into a H:M:S format
        var uptimeRaw = process.uptime();
        uptimeH = Math.floor(uptimeRaw / 3600);
        uptimeRaw %= 3600;
        uptimeM = Math.floor(uptimeRaw / 60);
        uptimeS = parseInt(uptimeRaw % 60);
        var processedUptime = uptimeH + "h " + uptimeM + "m " + uptimeS + "s";
        // Send the JSON to the client
        res.render('manage',{
          uptime: processedUptime,
          listenUrl: settings.listenUrl,
          usedSpace: data[0].usedPer + "%"
        });
      });
    }
  )
});

// Which port shall we listen on?
app.set('port', process.env.PORT || 80 );
// Which directory will host static assets
app.use(express.static('app/public'));
// Init the server
var server = app.listen(app.get('port'), function() {
  console.log('Hyperlog is running on port ' + app.get('port') + '\nCtrl+C to terminate...');
});
