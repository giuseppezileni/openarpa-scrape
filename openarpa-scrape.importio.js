var importio = require("import-io").client;
var request = require('request');

module.exports.version = '1.3.2';

var url_scrape = 'https://api.import.io/store/data/bd405210-8020-4a43-87f4-78b7bbb42ac3/_query?input/webpage/url=http%3A%2F%2Farpa.puglia.it%2Fweb%2Fguest%2Fqariainq&_user=df450de0-1945-4212-9284-e84133bf5c7e&_apikey=kM1OcWAonh0Mtf3v%2Bf4qaoqts%2B1MogWSGqAtO%2BEjH1MZPdunEpkNODuLmt8aTBNdDfHgEu5Hasfw8T%2FtwDkq9g%3D%3D';
var url_scrape_taranto = 'https://api.import.io/store/data/1e384dce-15ea-4f74-a0c5-581599a65f53/_query?input/webpage/url=http%3A%2F%2Fwww.arpa.puglia.it%2Fweb%2Fguest%2Fqaria_ilva&_user=df450de0-1945-4212-9284-e84133bf5c7e&_apikey=kM1OcWAonh0Mtf3v%2Bf4qaoqts%2B1MogWSGqAtO%2BEjH1MZPdunEpkNODuLmt8aTBNdDfHgEu5Hasfw8T%2FtwDkq9g%3D%3D';

var error = '';

module.exports = {

	taranto: function (callback_import) {

		error = '';
    
	    // To use an API key for authentication, use the following code:
	    var io = new importio("df450de0-1945-4212-9284-e84133bf5c7e", "kM1OcWAonh0Mtf3v+f4qaoqts+1MogWSGqAtO+EjH1MZPdunEpkNODuLmt8aTBNdDfHgEu5Hasfw8T/twDkq9g==", "import.io");

	    // Once we have started the client and authenticated, we need to connect it to the server:
	    io.connect(function(connected) {
	      // Make sure that your code to use the library only runs after this callback has returned, 
	      // as prior to this the library is still connecting and may not yet be ready to issue queries

	      // Once the callback is called, we need to check whether the connection request was successful
	      if (!connected) {
	        console.error("Unable to connect");
	        return;
	      }

	      // Define here a variable that we can put all our results in to when they come back from
	      // the server, so we can use the data later on in the script
	      var data = [];

	      // Record the number of currently running queries to the server
	      var runningQueries = 0;

	      // In order to receive the data from the queries we issue, we need to define a callback method
	      // This method will receive each message that comes back from the queries, and we can take that
	      // data and store it for use in our app
	      var callback = function(finished, message) {
	        // Disconnect messages happen if we disconnect the client library while a query is in progress
	        if (message.type == "DISCONNECT") {
	        	error = "The query was cancelled as the client was disconnected";
	          console.error(error);
	        }
	        // Check the message we receive actually has some data in it
	        if (message.type == "MESSAGE") {
	          if (message.data.hasOwnProperty("errorType")) {
	            // In this case, we received a message, but it was an error from the external service
	            error = "Got an error!";
	            console.error(error, message.data);
	          } else {
	            // We got a message and it was not an error, so we can process the data
	            console.log("Got data!", message.data);
	            data = data.concat(message.data.results);
	          }
	        }
	        if (finished) {
	          // When the query is finished, show all the data that we received
	          console.log("Done single query");
	          runningQueries--;
	          // If all queries are done, then log out the data we have
	          if (runningQueries <= 0) {
	            runningQueries = 0;
	            // console.log(data);
	            console.log("All queries completed");
	            if (typeof callback_import === 'function') {
	                callback_import(error, data);
	            };
	          }
	        }
	      }

	      // Issue three queries to the same data source with different inputs
	      // You can modify the inputs and connectorGuids so as to query your own sources
	      // To find out more, visit the integrate page at http://import.io/data/integrate/#minijs
	      
	      // Also increment the number of queries we are running
	      runningQueries += 1;

	      // Query for tile arpa-taranto
	      io.query({
	        "connectorGuids": [
	          "1e384dce-15ea-4f74-a0c5-581599a65f53"
	        ],
	        "input": {
	          "webpage/url": "http://www.arpa.puglia.it/web/guest/qaria_ilva"
	        }
	      }, callback);
	    });
	},

	scraping: function (callback_import) {
		error = '';
	    var io = new importio("df450de0-1945-4212-9284-e84133bf5c7e",
	                          "kM1OcWAonh0Mtf3v+f4qaoqts+1MogWSGqAtO+EjH1MZPdunEpkNODuLmt8aTBNdDfHgEu5Hasfw8T/twDkq9g==", 
	                          "import.io");

	    io.connect(function(connected) {
	        if (!connected) {
	            error = "Unable to connect\n";
	            console.error(error);
	            return;
	        };
	        var data = [];
	        var runningQueries = 0;
	        var callback = function(finished, message) {
	            if (message.type == "DISCONNECT") {
	                error = "The query was cancelled as the client was disconnected\n";
	                console.error(error);
	            };
	            if (message.type == "MESSAGE") {
	                if (message.data.hasOwnProperty("errorType")) {
	                    error = "Got an error!\n";
	                    console.error(error, message.data);
	                } else {
	                    console.log("Got data!", message.data);
	                    data = data.concat(message.data.results);
	                };
	            };
	            if (finished) {
	                console.log("Done single query");
	                runningQueries--;
	                if (runningQueries <= 0) {
	                    runningQueries = 0;
	                    console.log(data);
	                    console.log("All queries completed");
	                    if (typeof callback_import === 'function') {
	                        callback_import(error, data);
	                    };
	                };
	            };
	        };
	        
	        runningQueries += 1;

	        io.query({
	            "connectorGuids": [
	                "bd405210-8020-4a43-87f4-78b7bbb42ac3"
	            ],
	            "input": {
	                "webpage/url": "http://arpa.puglia.it/web/guest/qariainq"
	            }
	        }, callback);
	    });
	}

};
