//Get the necessary modules
var http = require('http');
var fs = require('fs');

// Get the settings data file
var settings = require('./settings.json');
// Get the recordings metadata file
var metadata = require('./metadata.json');

// Load in vars from the settings file
var url = settings.streamUrl;
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
    "fileName":""
  };
  // Calculate ID by iterating ID of previous file
  if (metadata.recordings[0]) {
    var id = metadata.recordings[metadata.recordings.length-1].id+1;
  } else {
    var id = 1;
  }
  // Get the current server date/time
  var now = new Date();
  // Populate the meta object
  meta.id = id;
  meta.txTime = String(pad(now.getHours())) + String(pad(now.getMinutes())) + String(pad(now.getSeconds()));
  meta.txDate = String(pad(now.getDate())) + String(pad(now.getMonth()+1)) + String(now.getFullYear());
  meta.fileName = stationName + "_" + meta.txTime + "_" + meta.txDate + ".mp3";
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
  var record = http.get(url, function(res) {
    var statusCode = res;
    var contentType = res.headers['content-type'];
    var error;
    if (statusCode !== 200) {
      error = new Error("Request failed. Status code: " + statusCode);
    } else if (!/^audio\/mpeg/.test(contentType)){
      error = new Error('Invalid content type. Expecting audio/mpeg but recieved' + contentType);
    }
    if (error) {
      console.error(error.message);
      res.resume();
      return;
    }
    console.log("RECORDING COMMENCED ON FILE ID " + id);
    res.pipe(wstream);
    deleteOldFiles();
    res.on('end', function(){
      console.log('Recording paused');
    })

  }).on('error', function(e){
    console.error('Gor error: ' + e.message);
  })

  // After a specified interval (usually one hour), stop the stream to split the files\
  setTimeout(function(){
    wstream.end();
    console.log('TOP OF THE HOUR. FILE SPLIT.');
    return;
  },duration);
}



function initialise(){
  // First, work out how many milliseconds are left until the top of the hour
  var currentMinutes = new Date().getMinutes();
  var currentSeconds = new Date().getSeconds();
  var initialDur = 3600000-((currentMinutes*60)+currentSeconds)*1000;
  // Now make an initial recording up until the top of the hour
  record(5000);
  // After the initial duration has passed, fire an hour long recording
  setTimeout(function(){
    // At the top of the hour, run this code
    record(10000);
    // Recurring hourly recordings thereafter
    setInterval(function(){
      record(10000);
    },10000)
  },5000)
}



initialise();
