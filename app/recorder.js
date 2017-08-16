// Get the modules
const fs = require('fs');
const http = require('http');
const https = require('https');
const cron = require('node-cron');

// Get the local settings file
var settings = require('./settings.json');

// Grab the mixcloud API modules
var mixcloud = require('./mixcloud.js');

// Some local constants
const station = settings.stationName;
const url = settings.listenUrl;
const recDir = './app/public/recordings/';
const metadataFile = './app/metadata.json';
// Save a five-day rolling log
const archiveLimit = settings.archiveLimit;

// Blank variable to store meta object
let metaObject;

// Do the recordings directory and metadata file exist and parse properly? If not, create them
function checkIntegrity(){
  // Recording directory
  if (!fs.existsSync(recDir)) {
    console.log('Recordings directory does not exist. Creating.');
    fs.mkdirSync(recDir, 0744);
  }
  initialMeta = JSON.stringify({"recordings":[]});
  // Metadata file
  if (!fs.existsSync(metadataFile)) {
    console.log('Metadata file does not exist. Creating.');
    fs.writeFileSync(metadataFile, initialMeta)
  }
  //Check whether metadata file is valid JSON and overwrite it if not
  try {
    var data = fs.readFileSync(metadataFile);
    JSON.parse(data);
  } catch(e) {
    console.log("Metadata file corrupted. Regenerating.")
    fs.writeFileSync(metadataFile, initialMeta)
  }
}

// Delete the oldest recording if the directory has more files than the specified limit
function cleanUp(fileToDelete){
  console.log(fileToDelete);
  // And delete the corresponding file
  fs.unlink(recDir + fileToDelete, function(){
    console.log("Deleted oldest file: "+ fileToDelete);
  })
}


// Take the input data and write it to the metadata file
function writeMeta(fileName){
  // Read the metadata file into memory
  fs.readFile(metadataFile, (err, data) => {
    // Handle errors
    if (err) throw err;
    // Parse the existing metadata into memory
    var existingMetadata = JSON.parse(data);

    if (existingMetadata.recordings.length>archiveLimit) {
      // Remove the first element from the array
      var recToDelete = existingMetadata.recordings.shift();
      cleanUp(recToDelete.fileName);
    }

    // Split the filename into an array
    var parsedData = fileName.split("_");
    //Properly format the date string
    var timeString = parsedData[1].substring(0,2) + ":" + parsedData[1].substring(2,4) + ":" + parsedData[1].substring(4,6);
    var dateString = parsedData[2].substring(0,2) + "/" + parsedData[2].substring(2,4) + "/" + parsedData[2].substring(4,8);
    // Query the Marconi API to fill in show names, descriptions and production codes
    https.get('https://smoke.media/wp-json/shows/now_playing', function(res2){
      let rawData = '';
      res2.on('data', (chunk) => { rawData += chunk; });
      res2.on('end', () => {

        try {
          const marconiResponse = JSON.parse(rawData);
          // Represent the array in an object
          if (marconiResponse.success == 0) {
            var newRecording = {
              "fileName": fileName,
              "txTime": timeString,
              "txDate": dateString,
              "showName": "Jukebox",
              "showDesc": "Nonstop music",
              "permalink": false
            }
          } else {
            var newRecording = {
              "fileName": fileName,
              "txTime": timeString,
              "txDate": dateString,
              "showName": marconiResponse.show.title,
              "showDesc": marconiResponse.show.desc,
              "permalink": marconiResponse.show.permalink,
              "icon": marconiResponse.show.icon_thumb,
              "genre": marconiResponse.show.genre
            }
          }
          // Append that object to the metadata file
          existingMetadata.recordings.push(newRecording);
          var newMetadata = JSON.stringify(existingMetadata);
          fs.writeFile(metadataFile,newMetadata,function(){
            console.log("Metadata file updated!");
          })
          metaObject = newRecording;
        } catch (e) {
          console.error(e.message);
        }
      });
    });
  });
}

// Helper function to format dates
function pad(n){return n<10 ? '0'+n : n}

// Function which returns a filename for a recording
function buildFilename(){
  var now = new Date();
  var fileName =  station + "_" +
                  pad(now.getHours()) +
                  pad(now.getMinutes()) +
                  pad(now.getSeconds()) + "_" +
                  pad(now.getDate()) +
                  pad(now.getMonth()+1) +
                  pad(now.getFullYear());
  return fileName;
}

// Record for specified duration
function record(duration){
  var fileName = buildFilename();
  // Create the file to write to
  var writeStream = fs.createWriteStream(recDir + fileName +'.mp3');
  // Make a request for the audio data
  http.get(url, function (response) {
    // Handle errors
    response.on('error', console.error);
    // Write the data to the stream
    response.pipe(writeStream);
    console.log('Now writing file ' + fileName + '.mp3 for ' + duration/1000 + ' seconds.');
    writeMeta(fileName);
    // Stop the stream after a delay
    setTimeout(function(){
      response.unpipe(writeStream);
      writeStream.end();
      console.log('Finished writing file ' + fileName + '.mp3');

      // Now the file is done, upload it to Mixcloud IF it is a show
      if (metaObject.showName !== 'Jukebox') {
        console.log('Uploading to Mixcloud...')
        mixcloud.processUpload(metaObject);
      } else {
        // For debug
        console.log('Jukebox: Skipping Mixcloud upload');
      }

    },duration);
  });
}

// Check environment and begin recording
function initialise(){
    // Check Mixcloud authentication is working
    mixcloud.checkAuth();
    // Check recordings dir exists
    checkIntegrity();
    // How many milliseconds are left until the top of the hour?
    var currentMinutes = new Date().getMinutes();
    var currentSeconds = new Date().getSeconds();
    var initialDur = 3600000-((currentMinutes*60)+currentSeconds)*1000;
    // Make the first recording up until the of the hour
    record(initialDur);
    // Run subsequent recordings on the top of the hour
    cron.schedule('0 * * * *', function(){
      record(60000);
    });
}

// Do everything
initialise();
