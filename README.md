Hyperlog
========

Hyperlog is a 24/7 cloud audio and data logger for online radio stations.

Hyperlog keeps a rolling archive of your station's transmitted audio output to fulfill statutory requirements, continuously deleting files older than a certain age.

Unlike traditional solutions, it does not need to be fed via a hardware audio input on the server, meaning that it is suitable for stations with minimal on-site infrastructure, or who use multiple studios in remote locations.

Log files can be managed via a browser interface or a simple JSON API.

Installation
-----------

Hyperlog is based on node.js, so you'll need to install that and npm first. It runs on any operating system that supports node.js.

Once you've downloaded this archive, run the terminal command

    npm install

To run the server, go to the app directory and say

    node server

By default, the browser interface will then be accessible from localhost:3000.
