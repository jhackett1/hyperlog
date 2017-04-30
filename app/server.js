//Get the necessary modules
var express = require('express');
var pug = require('pug');
var njds = require('nodejs-disks');
// Get the right express method
var app = express();
// Get the settings data file
var settings = require('./settings.json');
// Get the recordings metadata file
var metadata = require('./metadata.json');

// Run the recorder script
require('./recorder.js');

// View and templating options
app.set('views', __dirname+'/views');
app.set('view engine', 'pug');

var usedSpace = "";

// Return the percentage used of the current drive
njds.drives(
  function (err, drives) {
    njds.drivesDetail(drives, function (err, data) {
      usedSpace = data[0].usedPer + "%";
    });
  }
)


// Routes
app.get("/", function(req, res) {
    res.render('index', {
      "station":settings.stationName,
      "recordings":metadata.recordings,
      "usedSpace":usedSpace
    });
});


app.get("/api", function(req, res) {
    // Create object to hold data
    var api = {};
    api.info = settings;
    api.recordings = metadata.recordings;
    // Send the JSON to the client
    res.send(JSON.stringify(api));
});

// Which port shall we listen on?
app.set('port', process.env.PORT || 3000 );
// Which directory will host static assets
app.use(express.static('app/public'));
// Init the server
var server = app.listen(app.get('port'), function() {
  console.log('Hyperlog is running on port ' + app.get('port') + '\nCtrl+C to terminate...');
});
