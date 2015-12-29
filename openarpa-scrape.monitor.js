var _ = require("underscore");
var async = require("async");
var _geojson = require('./openarpa-scrape.geojson.js');
var _poll = require('./openarpa-scrape.poll.js');
var _amianto = require('./openarpa-scrape.amianto.js');
var moment = require('moment');
var request = require('request');
var S = require('string');
var _weather = require('./openarpa-scrape.weather.js');
var _import = require('./openarpa-scrape.importio.js')

module.exports.version = '1.3.2';

var columns= ['centralina', 
              'prov', 
              'comune', 
              'valore',
              'ngiorni'];

var columns_scrape = ['NomeCentralina ',
                      'Provincia ',
                      'Comune ',
                      'Valore ',
                      'N. giorni di superamento*']

var pollutants = {
    date: '',
    header: [],
    geojson: {
        type : "FeatureCollection",
        features: []
    },
    items: []
};

var geojson_dataset = {
    type : "FeatureCollection",
    features: []
};

var error_response = {
    description: '',
    error: ''
};

var isTaranto = false;
var isPrevision = false;
var warn = false;
var isgeojson = false;
var lat_prevision;
var lng_prevision;
var limit_prevision;

module.exports = {
    monitoring: function (warning, isgeo, callback_import) {
        warn = warning;
        
        if (typeof isgeo != 'undefined') {
            console.log('prepare data ... by ' + isgeo);
            isgeojson = isgeo.toUpperCase() == 'GEOJSON';
        };

        console.log('starting import data ...');
        scraping(callback_import);
    },
    taranto: function (isgeo, callback_import) {
        var self = this;
        isTaranto = true;
        this.monitoring(false, isgeo, callback_import);
    },
    prevision: function (lat, lng, limit, isgeo, callback_import) {
        isTaranto = false;
        lat_prevision = lat;
        lng_prevision = lng;
        limit_prevision = limit;
        isPrevision = true;
        var self = this;
        this.monitoring(false, isgeo, callback_import);
    },
    amianto: function (callback) {
        _amianto.load(function (error, data) {
            if (error) {
                error_response += error;
                if (typeof callback === 'function') {
                    callback(error_response);    
                };
            } else {
                if (typeof callback === 'function') {
                    callback(data);    
                }
            }
        });
    }
};

function getColor(poll) {

    var color;

    if (S(poll).include('PM10')) {
        color = "#66cdaa";
    } else if (S(poll).include('PM2.5')) {
        color = "#2f4f4f";
    } else if (S(poll).include('NO2')) {
        color = "#696969";
    } else if (S(poll).include('O3')) {
        color = "#708090";
    } else if (S(poll).include('C6H6')) {
        color = "#8b8989";
    } else if (S(poll).include('SO2')) {
        color = "#8b8378";
    } else if (S(poll).include('H2S')) {
        color = "#000080";
    } else if (S(poll).include('PM10 ENV')) {
        color = "#0000ff";
    } else if (S(poll).include('IPA')) {
        color = "#20b2aa";
    } else if (S(poll).include('PM2.5 SWAM')) {
        color = "#bebebe";
    } else if (S(poll).include('PM10 SWAM')) {
        color = "#778899";
    } else if (S(poll).include('PM10 B')) {
        color = "#696969";
    } else {
        color = "#000000";
    };

    console.log('checking color ' + poll + ' - ' + color);

    return color;
}

function scraping(callback_import) {

    error_response.description = '';
    error_response.error = false;

    async.series([
        load_pollutants,            // carico gli inquinanti
        load_geojson,               // carico il dataset geojson
        load_data,                  // costruisci i dati json/geojson
        filter_geojson,             // pulisce il file geojson
        filter_prevision,   
        filter_prevision_geojson,    // filtra il risultato in base alle coordinate
        save_weather_data,          // carico i dati meteo
        save_weather_data_taranto,  // carico i dati meteo per il file geojson
        save_weather_data_prevision // carico le previsioni meteo per determinate coordinate
    ], function (err, results) {
        if (err) {
            error_response += err;
            if (typeof callback_import === 'function') {
                callback_import(error_response);
            }
        } else {
            if (results.indexOf('done') != 1) {
                console.log('done scraping ...');
                if (typeof callback_import === 'function') {
                    if (!error_response.error) {
                        console.log('features n.' + _.size(pollutants.geojson.features));
                        if (isgeojson) {
                            callback_import(pollutants.geojson);
                        } else {
                            callback_import(pollutants);  
                        } 
                    } else {
                        callback_import(error_response);
                    } 
                };
            };
        }
    });
};

function load_data(callback) {

    console.log('3.scraping data ...');

    if (isTaranto) {
        _import.taranto(function (error, data) {
            if (error != '') {
                callback(error);
            } else {
                _scraping(data);
                callback(null, 'next');
            }
        });
    } else {
        _import.scraping(function (error, data) {
            if (error != '') {
                callback(error);
            } else {
                _scraping(data);
                callback(null, 'next');
            }
        });
    };
};

function load_geojson(callback) {

    console.log('2.geojson loading ...');
    _geojson.stations(function (gjs) {
        // console.log(gjs);
        geojson_dataset = gjs;
        callback(null, 'next');
    });
};

function distance (lat1, lng1, lat2, lng2) {
          
  var R = 6371; // Radius of the earth in km
  var dStr = "";

  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lng2-lng1); 

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);

  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = Math.ceil((R * c) * 1000); // Distance in mt

  return d;

};

function deg2rad(deg) {
    return deg * (Math.PI/180)
};

function filter_prevision_geojson(callback) {
    console.log('6.filter prevision geojson ...');
    if (isPrevision) {

        var fi = _.sortBy(pollutants.geojson.features, function (item) {
            console.log(JSON.stringify(item));
            return distance(lat_prevision, 
                            lng_prevision, 
                            item.properties.lat,
                            item.properties.lng);
        });

        pollutants.geojson.features = _.initial(fi, _.size(fi) - 1);

    };
    callback(null, 'next');
};

// filtra il risultato in base alla distanza dalla coordinata
function filter_prevision(callback) {

    console.log('5.filter prevision ...');

    if (isPrevision) {
        // data sorted

        async.each(pollutants.items, function (item, callback_root) {

            // ordinamento dei valori 
            var pi = _.sortBy(item.values, function (item_val) {
                return distance(lat_prevision, 
                                lng_prevision, 
                                item_val.location.lat,
                                item_val.location.lng);
            });

            // prendo solo il valore della stazione più vicina
            item.values = _.initial(pi, _.size(pi) - 1);

            // console.log('values filtere ');

            callback_root()

        }, function (err) {
            if (err) {
                callback(err);
            } else {
                callback()
            }
        });

    };

    callback(null, 'next');
};

function filter_geojson(callback) {

    console.log('4.filter geojson ...');
    pollutants.geojson.features = _.filter(pollutants.geojson.features, function (item) {
        return item.properties.warning_value > 0;
    });
    pollutants.geojson.features = _.uniq(pollutants.geojson.features);
    callback(null, 'next');

};

function load_pollutants(callback) {

    console.log('1.inquinanti ...');

    _poll.load(function (p) {

        console.log('pollutants loading ...');
        var i = 0;
        while (p[i]) {
            var pl = {
                item: p[i],
                values: []
            };
            pollutants.items.push(pl);
            i++;
        };

        callback(null, 'next');
    });
};

function convert_date(data) {

    console.log(data);

    var d = data.trim().split(' ');
    var dr;

    if (typeof d[1] != 'undefined') {

        var d_date = d[1].toUpperCase();

        console.log(d);

        if (S(d_date).include('GENNAIO')) {
            d[1] = '01';
        } else if (S(d_date).include('FEBBRAIO')) {
            d[1] = '02';
        } else if (S(d_date).include('MARZO')) {
            d[1] = '03';
        } else if (S(d_date).include('APRILE')) {
            d[1] = '04';
        } else if (S(d_date).include('MAGGIO')) {
            d[1] = '05';
        } else if (S(d_date).include('GIUGNO')) {
            d[1] = '06';
        } else if (S(d_date).include('LUGLIO')) {
            d[1] = '07';
        } else if (S(d_date).include('AGOSTO')) {
            d[1] = '08';
        } else if (S(d_date).include('SETTEMBRE')) {
            d[1] = '09';
        } else if (S(d_date).include('OTTOBRE')) {
            d[1] = '10';
        } else if (S(d_date).include('NOVEMBRE')) {
            d[1] = '11';
        } else if (S(d_date).include('DICEMBRE')) {
            d[1] = '12';
        };

        dr = d.join('/');
        // console.log('converted data : ' + dr);
    } else {
        dr = moment();
    }

    return dr;

};

function save_weather_data_prevision(callback) {
    console.log('9. saving weather data by prevision ...');
    
    if (isPrevision) {
        console.log('loading weather data...');
        _weather.forecast(lat_prevision, lng_prevision, limit_prevision, function (error, weather_data) {
            if (error) {
                callback(error);
            } else {
                console.log('_save_weather');
                _save_weather(weather_data, function (err) {
                    if (err) {
                        callback(err);
                    } else {
                        console.log('done **');
                        callback(null, 'done');
                    }
                });
            }
        });
    } else {
        callback(null, 'done');    
    };
};

// salva i valori meteo nei dati json
function _save_weather(weather_data, callback) {

    console.log('--- saving weather data ...');

    async.each(pollutants.items, function (item, callback_series) {
        async.each(item.values, function (value, callback_series_child) {
            var w = _weather.get_item(weather_data, null);
            console.log('--- adding value: ' + JSON.stringify(w));
            value.weather = w;
            console.log('****');
            callback_series_child();
            
        }, function (err) {
            if (!err) {
                console.log('saving weather data series done.');
                callback_series();
            } else {
                error_response.description += err;
                error_response.error = true;
                callback_series(error_response.description);
            }
        })    
    }, function(err) {
        console.log('end save weather data ... err:' + err);
        if (!err) {
            console.log('weather data saved.');
            if (typeof callback === 'function') {
                console.log('callback weather data ...');
                callback();
            };
        } else {
            console.log('error ...');
            if (typeof callback === 'function') {
                callback('error to loading weather data  ...\n');
            };
        }
    });
};

// salvo i valori meteo storici per la città di taranto
function save_weather_data_taranto(callback) {

    console.log('8. saving weather data by taranto ...');

    var sd = getDataScrap().format('X');

    // console.log('load weather data geojson - scraping data: ' + sd);

    if (isTaranto && !isPrevision) {
        _weather.history_taranto(sd, function (error, weather_data) {
            if (error) {
                callback(error); 
            } else {
                _save_weather(weather_data, function (err) {
                    if (err) {
                        error_response.description += err;
                        error_response.error = true;
                        callback(err);
                    } else {
                        console.log('next');
                        callback(null, 'next');    
                    }
                });
            }
        });
    } else {
        callback(null, 'next');
    };

};

// pulisco la data dei dati di scraping dall'intestazione
function getDataScrap() {

    console.log('header: ' + JSON.stringify(pollutants.header));
    var header = pollutants.header[0];
    console.log('data header: ' + pollutants.header[1]);
    var new_date = convert_date(pollutants.header[1]);
    pollutants.date = new_date; 
    var sd = moment(new_date, "DD/MM/YYYY"); // unix time stamp

    return sd;

};

// salva tutti i dati meteo nei dati json
function save_weather_data(callback) {

    console.log('7.weather data ...');

    if (!isgeojson && !isPrevision) {

        var sd = getDataScrap().format('X');
        
        async.eachSeries(pollutants.items, function (item, callback_series) {

            async.eachSeries(item.values, function (val, callback_series_child) {

                _weather.history(val.location.lat, val.location.lng, sd, function (error, weather_data, station_weather) {
                    if (error != '') {
                        callback_series_child(error);
                    } else {
                        var w = _weather.get_item(weather_data, station_weather);
                        val.weather = w;
                        callback_series_child();  
                    }                  
                });
                
            }, function (err) {
                if (!err) {
                    console.log('series child done.');
                    callback_series();
                } else {
                    error_response.description += err;
                    error_response.error = true;
                    callback_series(error_response.description);
                }
            });

        }, function (err) {
            if (!err) {
                console.log('series done.');
                callback(null, 'next');
            } else {
                error_response.description += 'error to loading weather data ...\n';
                error_response.error = true;
                callback(error_response.description, null);
            }
        });
    } else {
        callback(null, 'next');
    };
};

function clean_str(str) {
    if (typeof str != 'undefined') {
        return str.trim().replace("/[^a-zA-Z0-9]/.,", " ");
    } else {
        return '';
    }
};

// clean data
function clean(array) {
    var j = 0;
    while (array[j]) {
        array[j] = array[j]
                     .trim()
                     .replace("/[^a-zA-Z0-9]/.", " ");
        array[j] = array[j]
                     .toUpperCase()
                     .replace("INQUINANTE", "");
        j++;    
    };  
    return array;
};

function getFeatures(centralina, comune) {

    var feature;
    
    // ricerca per centralina
    feature = _.find(geojson_dataset.features, 
                         function (item) {
        // console.log('properties by name: ' + JSON.stringify(item.properties));
        return S(item.properties.centralina
               .toUpperCase()).include(centralina.toUpperCase().trim());
    });

    if (typeof feature === 'undefined') {
        // altrimenti ricerco la centralina per comune
        // console.log('cerco la centralina per comune ...');
        feature = _.find(geojson_dataset.features, 
                             function (item) {
            // console.log('properties by city: ' + JSON.stringify(item.properties));
            return S(item.properties.citta.toUpperCase()).include(comune.toUpperCase().trim());
        });
    };

    // console.log('feature loading by dataset ... ' + comune + '-' + centralina + '/n' + JSON.stringify(feature));

    if (typeof feature !== 'undefined') {
        // console.log('**** feature trovata ***' + JSON.stringify(feature.properties));
            
        var f = { 
            type: 'Feature', 
            properties: { 
                id: feature.properties.id, 
                centralina: centralina, 
                descrizione: feature.properties.descrizione,
                lat: feature.properties.lat,
                lng: feature.properties.lng,
                prov: feature.properties.prov, 
                comune: comune, 
                inquinanti: feature.properties.inquinanti,
                warning_value: 0,
                warning_poll: '',
                color: '',
                radius: 4,
                opacity: 0.1,
                title: '',
                values: []         
            }, 
            geometry: { 
                type: 'Point', 
                'coordinates': [ feature.properties.lng, feature.properties.lat ] 
            } 
        };

        return f;
    } else {

        return null;
    }
};

function getRadius(value) {
    var rMax = 24;
    var rMin = 4;
    var r;

    if (value < 1) {
        r = rMin;
    } else {
        r = rMin * value;
    };

    if (r > rMax) {
        r = rMax;
    };

    return r;

};

function getOpacity(value) {
    var oMin = 0.1;
    var oMax = 0.5;
    var o = oMin;

    if (value >= 1) {
        o += (value / 10);
    };

    if (o > oMax) {
        o = oMax;
    };

    return o;
};

function getTitleData(item) {

    var first_data;
    var item_str;

    if (!isTaranto) {
        if (typeof item.text_1 === 'undefined') {
            first_data = clean_str(item.text_3.trim().toUpperCase().trim());
        } else {
            first_data = clean_str(item.text_1.trim().toUpperCase().trim());
        };

        item_str = S(first_data).strip('INQUINANTE:').s;
    } else {
        item_str = clean_str(item.text_3.trim().toUpperCase().trim());
    };

    return item_str;

};

// oggetto json
function getItemJSON(item) {

    var prov = '';
    var ngiorni = 0;
    var poll = '';

    if (isTaranto) {
        prov = 'Taranto';
    } else {
        ngiorni = S(clean_str(item.text_6)).replaceAll('-', '0').s;
        ngiorni = S(ngiorni).toInt();
        poll = clean_str(item.text_3);
    };

    var valore = S(clean_str(item.text_5)).toFloat();

    var item_json = {
        centralina: clean_str(item.text_1),
        prov: prov,
        comune: clean_str(item.text_2),
        valore: valore,
        ngiorni: ngiorni,
        warning: '',
        level: '',
        poll: poll,
        risk: 0,
        location: {
            lat: 0,
            lng: 0
        },
        weather: {}
    };
    
    return item_json;

};

// scraping del sito di arpa
function _scraping(data) {
    
    // console.log('elements n.' + _.size(data));
    var pollIndex;
    
    async.eachSeries(data, function (item, callback) {
       
        var isPoll = false;
        var item_str = getTitleData(item);

        var lastPoll = _.find(pollutants.items, function (p) {
            item_str = S(item_str).trim().s;
            if (S(item_str).include(p.item.name.toUpperCase())) {
                pollIndex = p;
                isPoll = true;
                console.log('*** poll founded: ' + JSON.stringify(p.item.name));
                return p;
            } else {
                return null;
            }
        });

        if (isTaranto) {
            if (isPoll) {
                isPoll = false;
            };
        };

        if (typeof pollIndex === 'undefined') {
            pollutants.header.push(clean_str(item.text_1));
            pollutants.header.push(clean_str(item.text_5));
            pollutants.header = _.uniq(pollutants.header);     
        } else {
            // console.log('pollulant founded ' + pollIndex.name);
            // controllo che non è una colonna
            
            if (!isPoll) {

                var isCol = false;

                if (!isTaranto) {
                    var col = _.find(columns_scrape, function (c) {
                        isCol = S(c.trim().toUpperCase()).include(item_str);
                        return isCol;        
                    });
                };

                if (!isCol && !isPoll) {
                    
                    // load feature object 
                    var item_json = getItemJSON(item);
                    
                    if (!isNaN(item_json.valore)) {
                        // leggo il valore per stabilire il livello di warning
                        item_json.warning = (item_json.valore / pollIndex.item.limit);
                        item_json.level = item_json.valore + ' ' + pollIndex.item.um +
                                          ' (' + pollIndex.item.limit + pollIndex.item.um + ')';
                    
                    };

                    if (item_json.valore > 0) {

                        var isExec;

                        if (warn) {
                            console.log('only warning value ... - level: ' + item_json.warning);
                            isExec = (item_json.warning >= 1);
                        } else {
                            isExec = true;
                        };

                        if (isExec) {

                            // leggo la feature del geojson
                            var feature = getFeatures(item_json.centralina, 
                                                      item_json.comune);

                            var title = '';

                            console.log('adding data ...');

                            if (feature != null) {

                                console.log('feature founded, update values ... to ' + pollIndex.item.name);
                                // console.log('feature: ' + JSON.stringify(feature));
                                item_json.poll = pollIndex.item.name;
                                item_json.location.lat = feature.properties.lat;
                                item_json.location.lng = feature.properties.lng;
                                item_json.centralina = feature.properties.centralina;
                                
                                title = '<h4>' + pollIndex.item.name + ' ' + item_json.warning + '</h4>';
                                title += '<h5>' + item_json.comune + ' - ' + item_json.centralina + ' </h5>';
                                
                                feature.properties.warning_value = item_json.warning;
                                feature.properties.warning_poll = pollIndex.item.name;
                                feature.properties.color = getColor(pollIndex.item.name);
                                feature.properties.radius = getRadius(item_json.warning);
                                feature.properties.opacity = getOpacity(item_json.warning);

                                feature.properties.title = title;
                                feature.properties.values.push(item_json);

                                pollutants.geojson.features.push(feature);
                            } else {
                                // aggiungere dati non rilevati
                            };
                            pollIndex.values.push(item_json);
                        };
                    };
                } else {
                    console.log('founded column ...');   
                }
            }
        };

        callback();    
        
    }, function (err) {
        if (err) {
            error_response.description += 'error to scraping data ...\n';
            error_response.error = true;
            callback(error_response.description);
        } else {
            console.log('end import');
        };
    });
    
    // console.log('**************************');
    // console.log(JSON.stringify(pollutants));
};

