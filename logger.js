//You need the HTTP module, file system and the MP3 encoder module
var http = require('http');
var fs = require('fs');

// Where are we getting the stream from? MUST BE MP3
var url = 'http://149.202.90.221:9036/;';

// How long will we record for, in seconds, before splitting the file
var duration = 3600;
// When shall recording start, in minutes past the hour
var offset = 0;

// Create the writable stream for the output
var wstream = fs.createWriteStream('output.mp3');

//Get the data, save it to file and log it to the console
http.get(url, function(response) {
  // Save the data to a stream
  response.pipe(wstream);
  console.log('SOURCE STREAM: '+url);
  console.log('Recording... Ctrl+C to stop.');
  // WHen you finish, say so
  response.on('end', function() {
    console.log('finished');
  });
});
