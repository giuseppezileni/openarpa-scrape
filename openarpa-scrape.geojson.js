var request = require('request');
var async = require('async');

module.exports.version = '1.3.2';

var dataset_stations_geojson = 'http://dati.openbsk.it/dataset/e1887afc-345a-43ae-b9f8-95b5515eb6df/resource/8df7cff6-7605-456d-9d33-238d7905c115/download/arpacentraline.geojson';
var dataset_stations_json = 'http://dati.openbsk.it/dataset/e1887afc-345a-43ae-b9f8-95b5515eb6df/resource/72ad7767-af7e-4562-a395-5432f37a4681/download/centraline.json';

var geojson= {
    type : "FeatureCollection",
    features: []
};

module.exports = {
    
    stations_geojson: function (callback) {
     
        request(dataset_stations_geojson, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                if (typeof callback === 'function') {
                    callback(JSON.parse(body));    
                }
            } else {
                // 
                console.log('error to load dataset delle posizioni delle cetraline');
            }   
        });   
    },
    
    stations: function(callback) {
        
        request(dataset_stations_json, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                if (typeof callback === 'function') {
                    var data = JSON.parse(body);
                    create_geojson(data);
                    if (typeof callback === 'function') {
                        callback(geojson);    
                    }
                }
            } else {
                // 
                console.log('error to load dataset delle posizioni delle cetraline');
            }   
        });  
        
    }
 };

function create_geojson(data) {
    
    async.each(data, function (item, callback) {
        
        var feature = 
            { 
                type: "Feature", 
                properties: { 
                    id: item.id, 
                    centralina: item.centralina, 
                    descrizione: item.descrizione, 
                    lat: Number(item.lat), 
                    lng: Number(item.lng), 
                    citta: item.citta, 
                    localita: item.localita, 
                    inquinanti: item.inquinanti,
                    warning_poll: '',
                    warning_value: 0,
                    values: [],
                    title: '',
                    color: '#000000',
                    radius: 4,
                    opacity: 0.1,
                    weather: {}
                }, "geometry": { 
                    type: "Point", 
                    "coordinates": [ Number(item.lng), Number(item.lat) ] 
                }
        };

        geojson.features.push(feature);
        
        callback();

    }, function (err) {
        if (err) {
            console.log('error to create geojson');
            geojson.features = [];
        } else {
            console.log('done');    
        };
    });
    
};

