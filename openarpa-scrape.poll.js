var request = require('request');

module.exports.version = '1.3.2';

var dataset = 'http://dati.openbsk.it/dataset/8ec9f5ca-0632-426f-aea9-6b125ca50554/resource/78bbf151-9a9a-49cf-adc8-9e7d73a2b468/download/inquinanti.json';

module.exports = {
    
    load: function (callback) {
     
        request(dataset, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                if (typeof callback === 'function') {
                    callback(JSON.parse(body));    
                }
            } else {
                // 
                console.log('error to load dataset delle posizioni delle cetraline');
            }   
        });   
    }
};

