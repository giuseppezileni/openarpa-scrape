var monitor = require('./openarpa-scrape.monitor.js');

module.exports.version = '1.3.2';

module.exports = {
    monitoring: function (warning, isgeo, callback) {
        console.log('stating import ...');
        monitor.monitoring(warning, isgeo, function (data) {
            console.log('end import data ...');
            if (typeof callback === 'function') {
                callback(data);    
            };
        });
    },
    taranto: function (isgeo, callback) {
        var self = this;
        monitor.taranto(isgeo, function (data) {
            console.log('end import data from taranto ...');
            if (typeof callback === 'function') {
                callback(data);    
            }; 
        });
    },
    prevision: function (isgeo, lat, lng, limit, callback) {
        var self = this;
        monitor.prevision(lat, lng, limit, isgeo, function (data) {
            console.log('end import data from prevision ...');
            if (typeof callback === 'function') {
                console.log('callback json response');
                callback(data);    
            }; 
        });
    },
    amianto: function (callback) {
    	console.log('import amianto geojson data');
    	monitor.amianto(function (data) {
    		console.log('end geojson data ...');
            if (typeof callback === 'function') {
                callback(data);    
            };	
    	})
    }
}