//Get the necessary modules
var http = require('http');
var https = require('https');
var fs = require('fs');

// Get the settings data file
var settings = require('./settings.json');
// Get the recordings metadata file
var metadata = require('./metadata.json');

// Load in vars from the settings file
var url = settings.streamUrl;
var targetDuration = settings.logDuration*1000; //In milliseconds
var archiveLength = settings.archiveLength;
var stationName = settings.stationName.toLowerCase();

// Function to clear out old files if the number of recordings is greater than the number specified in the settings
function deleteOldFiles(){
  // If the number of elements in the metadata array is more than 750, delete the oldest/first file
  if (metadata.recordings.length > archiveLength) {
    // Get the filename of the first/oldest file from the object
    var fileName = metadata.recordings[0].fileName;
    var deletePath = './app/public/recordings/'+fileName;
    // Perform the deletion
    fs.unlink(deletePath, function(){
      console.log("More than " + archiveLength + " items in archive. Deleting oldest: "+ fileName);
    })
    // Pop the first object off the array for good measure
    metadata.recordings.shift();
    var newData = JSON.stringify(metadata);
    // // And write the new data to the file
    fs.writeFile('./app/metadata.json',newData, function(err){
        if (err) throw err;
    });
  }
}

// Helper function to format the date
function pad(n){return n<10 ? '0'+n : n}

// Record and store a single log hour
function record(duration){
  // A blank default object to store the metadata
  var meta = {
    "id":0,
    "txTime":"",
    "txDate":"",
    "showName":"",
    "fileName":""
  };
  // Options for the below request
  var options = {
    host: 'faraday.smokeradio.co.uk',
    port: 443,
    path: '/api/live-info',
    method: 'GET',
    "rejectUnauthorized": false
  };
  // Make the request and update the var
  var req = https.request(options, function(res) {
    // Blank var to store response body
    var body = '';
    // Fill up the body var with the response chunk by chunk
    res.on('data', function(chunk){
        body += chunk;
    });
    // At the end of the asynchronous request, execute this callback
    res.on('end', function(){
      // Calculate ID by iterating ID of previous file
      if (metadata.recordings[0]) {
        var id = metadata.recordings[metadata.recordings.length-1].id+1;
      } else {
        var id = 1;
      }
      // Calculate show name from Airtime API if exists, else use placeholder
      if (JSON.parse(body).currentShow === undefined) {
        var showName = JSON.parse(body).currentShow[0].name;
      } else {
        var showName = 'Jukebox';
      }

      // Get the current server date/time
      var now = new Date();
      // Populate the meta object
      meta.id = id;
      meta.txTime = String(pad(now.getHours())) + String(pad(now.getMinutes())) + String(pad(now.getSeconds()));
      meta.txDate = String(pad(now.getDate())) + String(pad(now.getMonth()+1)) + String(now.getFullYear());
      meta.showName = showName;
      meta.fileName = stationName + "_" + meta.txTime + "_" + meta.txDate + "_" + meta.showName.toLowerCase().replace(/\s/g, '') + ".mp3";
      // Append this object to the existing metadata
      metadata.recordings.push(meta);
      var newData = JSON.stringify(metadata);
      // And overwrite the existing metadata file with the new data
      fs.writeFile('./app/metadata.json',newData, function(err){
          if (err) throw err;
      });
      // Create the writable stream for the output, based on the filename calculated above
      var wstream = fs.createWriteStream('app/public/recordings/' + meta.fileName);

      //Get the data, save it to file and log it to the console
      var record = http.get(url, function(response) {
        // Save the data to a stream
        response.pipe(wstream);
        // Make sure the archive rolls over by deleting the oldest files
        deleteOldFiles();
        // WHen you finish, say so
        response.on('end', function() {
          console.log('Recording paused');
        });
      });

      // After a specified interval (usually one hour), stop the stream to split the files\
      setTimeout(function(){
        wstream.end();
        return;
      },duration);

    });
  });
  req.end();
}


// Set the first recording going, then begin recurring recordings
function initialiseRecording(){
  // Get the current minutes past the hour
  var currentMinutes = new Date().getMinutes();
  // Get the current seconds past the minute
  var currentSeconds = new Date().getSeconds();
  // Work out how many milliseconds we should record for to take us up to the start of the next hour
  var initialDuration = 3600000-((currentMinutes*60)+currentSeconds)*1000;
  // Make an initial recording until the top of the hour
  record(initialDuration);
  console.log('Initial recording commenced. Will split in '+ initialDuration/1000 +" seconds");
  // Wait until the top of the hour, then execute hourly recordings
  setTimeout(function(){
    // Make an hourly recording every hour
    setInterval(function(){
        console.log("HOUR END: file split.");
      record(targetDuration);
    },targetDuration)
  },initialDuration);
}

// DO ALL THE THINGS
initialiseRecording();
