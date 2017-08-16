// Toggle class on each section on click, controlling collapsible behaviour
document.querySelectorAll('section.panel').forEach(function(section){
  section.querySelector('h3').addEventListener('click',function(){
    if (section.classList == "panel collapsed") {
      section.classList.remove('collapsed');
    } else {
      section.classList.add('collapsed');
    }
  })
})

function clickableRecordings(){
  // Make each recording clickable and add download, play, pin functionality
  var recordings = document.querySelectorAll('li.recording');
  recordings.forEach(function(recording){
    // Add the event listener to each recording in the list
    recording.addEventListener('click',function(){
      // Remove the class from all other elements first
      for (var i = 0; i < recordings.length; i++) {
        recordings[i].classList.remove('selected');
      }
      // Now add the class to the one we clicked
      recording.classList.add('selected');
      // Grab the ID of the recording
      var id = recording.id;
    })
  })
}

clickableRecordings();

var currentPage = 1;
// Handle pagination of the recordings list
document.querySelectorAll('div.pagination a').forEach(function(button){
  button.addEventListener('click',function(){
    // Iterate the page counter and handle
    if (this.id === "next-page") {
      currentPage++;
    } else {
      currentPage--;
    }
    // Clear all recording li s from the ul parent
    var recordingsList = document.querySelector('ul#recordings')
    recordingsList.innerHTML = '';
    // Turn on the spinner
    document.getElementById('spinner').classList.add('show');
    // Where is the API?
    var endpoint = '/api';
    // Make the API get request
    var requester = new XMLHttpRequest();
    requester.open('GET',endpoint,true);
    requester.send();
    requester.addEventListener('readystatechange',processResponse,false);
    function processResponse(e){
      e.preventDefault();
      if (requester.readyState == 4 && requester.status == 200) {
          // Add the current page to the top of the list
          if (currentPage !== 1) {
            var pageText = document.createTextNode("Page "+currentPage);
            var pageElement = document.createElement('h2');
            pageElement.appendChild(pageText);
            recordingsList.appendChild(pageElement);
          }
          // Parse the HTTP response into a JS object
          var recordingsListResponse = JSON.parse(requester.responseText).recordings;
          //  Pull the correct ten results into a new array
          var firstItem = currentPage*10-10;
          var lastItem = currentPage*10;
          var currentPageResults = recordingsListResponse.slice(firstItem, lastItem);
          // Disable the "next page" button if there are no more results to fetch
          var nextResult = recordingsListResponse[currentPage*10];
          if (nextResult === undefined) {
            document.getElementById('next-page').classList.add('unclickable');
          } else {
            document.getElementById('next-page').classList.remove('unclickable');
          }
          // Disable the "previous page" button in same circumstances
          if (currentPage !== 1) {
            document.getElementById('previous-page').classList.remove('unclickable');
          } else {
            document.getElementById('previous-page').classList.add('unclickable');
          }
          // Turn off the spinner
          document.getElementById('spinner').classList.remove('show');
          // Output the results
          currentPageResults.forEach(function(result){
            var resultItem = document.createElement('li');
            resultItem.classList.add('recording');
            if (result.txTime.substr(0,2)<17) {
              resultItem.innerHTML = `<h5 class="daytime">Recorded on ${result.txDate} at ${result.txTime}</h5>`;
            } else {
              resultItem.innerHTML = `<h5 class="specialist">Recorded on ${result.txDate} at ${result.txTime}</h5>`;
            }
            // Big old template string to fill out the content
            resultItem.innerHTML += `
              <h4>${result.showName}</h4>
              <p>${result.showDesc}</p>
              <audio controls>
                <source src="/recordings/${result.fileName}.mp3"></source>
              </audio>
            `;

            if (result.permalink == false) {
              resultItem.innerHTML += `
                <div class="buttons">
                  <a class="btn" download href="/recordings/${result.fileName}.mp3"><i class="fa fa-download"></i>Download</a>
                </div>
              `;
            } else {
              resultItem.innerHTML += `
                <div class="buttons">
                  <a class="btn" download href="/recordings/${result.fileName}.mp3"><i class="fa fa-download"></i>Download</a>
                  <a class="btn" href="${result.permalink}">Show profile</a>
                </div>
              `;
            }


            recordingsList.appendChild(resultItem);
            // Make the new results clickable
            clickableRecordings();
          })
       }
    }
  })
})


// Search functionality

// A function to display the search result(passed in as an object) on the front end
function displaySearchResult(result){
  var resultBox = document.querySelector('div.result-container');
  if (result.showName !== undefined) {
    console.log(result)
    resultBox.classList.add('open');
    resultBox.innerHTML = `
      <h4><span>Result:</span> ${result.showName}</h4>
      <p>${result.showDesc}</p>
      <audio controls>
        <source src="/recordings/${result.fileName}.mp3"></source>
      </audio>
      <div class="buttons">
        <a class="btn" download href="/recordings/${result.fileName}.mp3"><i class="fa fa-download"></i>Download</a>
        <a class="btn" href="${result.permalink}";>Show profile</a>
      </div>
      <i class="fa fa-close" id="close-result"></i>
    `;
    document.getElementById('close-result').addEventListener('click',function(){
      resultBox.innerHTML = '';
      resultBox.classList.remove('open');
    });
  } else {
    resultBox.classList.add('open');
    resultBox.innerHTML = `
    <h4><span>No result found!</span></h4>
    `;

  }
  // Turn off the spinner
  document.getElementById('spinner2').classList.remove('show');
}

// Search the array and return the matching element
function search(haystack, dateQuery, timeQuery){
  // Blank object to store the result
  var result = {};
  // Check each element of the array for a match, first by date, then by time
  for (var i = 0; i < haystack.recordings.length; i++) {
    if (haystack.recordings[i].txDate === processDate(dateQuery) && haystack.recordings[i].txTime.substr(0,2) === processTime(timeQuery)) {
      result = haystack.recordings[i];
    }
  }
  displaySearchResult(result);
}

// Helper functions to format the date and time query strings passed in from the form
function processDate(rawdate){
  var processedDate = rawdate.substr(8,2) +"/"+ rawdate.substr(5,2) +"/"+ rawdate.substr(0,4);
  return processedDate;
}
function processTime(rawtime){
  return rawtime.substr(0,2);
}

// Take in a date and time and return a result as an object for display
function fetchSearchResults(dateQuery, timeQuery){
  // Where is the API?
  var endpoint = '/api';
  // Grab the API data
  var finder = new XMLHttpRequest();
  finder.open('GET',endpoint,true);
  finder.send();
  finder.addEventListener('readystatechange',processResponse,false);
  function processResponse(e){
    e.preventDefault();
    if (finder.readyState == 4 && finder.status == 200) {
      var result = search(JSON.parse(finder.responseText), dateQuery, timeQuery);
    }
  }
}

var form = document.querySelector('form');

form.querySelector('input#submit').addEventListener('click',function(e){
  // Stop page from reloading on click
  e.preventDefault();
  // Turn on the spinner
  document.getElementById('spinner2').classList.add('show');
  // Grab the search terms
  var dateQuery = form.querySelector('input#date').value;
  var timeQuery = form.querySelector('input#time').value;
  // Call the function which handles searching
  fetchSearchResults(dateQuery, timeQuery);
})
