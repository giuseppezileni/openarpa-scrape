var request = require('request');

module.exports.version = '1.3.2';

var url_import = 'http://dati.openbsk.it/dataset/4aac5962-06c2-451a-9283-40ff68f89502/resource/9eed961a-5e9a-4e21-89a9-c5a345fff65b/download/amiantodatocomune.geojson';

module.exports = {
    
    load: function (callback) {
     
        request(url_import, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                if (typeof callback === 'function') {
                    callback(null, JSON.parse(body));    
                }
            } else {
                if (typeof callback === 'function') {
                    callback('error to load dataset delle posizioni delle cetraline', null);    
                } 
            }   
        });   
    }
};