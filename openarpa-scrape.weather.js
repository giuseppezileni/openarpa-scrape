var request = require('request');
var _ = require('underscore');

module.exports.version = '1.3.2';

var url_import = 'http://dati.openbsk.it/dataset/4aac5962-06c2-451a-9283-40ff68f89502/resource/9eed961a-5e9a-4e21-89a9-c5a345fff65b/download/amiantodatocomune.geojson';

module.exports = {

	history_taranto: function (history_date, callback) {

	    console.log('historical data from taranto by ' +  history_date);

	    var url = 'http://api.openweathermap.org/data/2.5/history/city?q=Taranto,%20IT' +
	              '&units=metric&lang=it' +
	              '&start=' + history_date + '&cnt=7';

	    console.log(url);

	    request(url, function(error, response, body) {
	        if (!error && response.statusCode == 200) {
	            var wdi = JSON.parse(body);
	            // console.log('*** weather data: ' + JSON.stringify(wdi));
	            if (typeof callback === 'function') {
	                callback(null, wdi.list);
	            }
	        } else {
	        	if (typeof callback === 'function') {
	                callback(error, null);
	            }
	        }
	    });
	}, 

	forecast: function (lat, lng, limit, callback) {

	    var url = '';

	    if (limit == 'hour') {
	        url = 'http://api.openweathermap.org/data/2.5/forecast?lat=' + lat + '&lon=' + lng + '&units=metric';
	    } else if (limit == 'daily') {
	        url = 'http://api.openweathermap.org/data/2.5/forecast/daily?lat=' + lat + '&lon=' + lng + '&cnt=16&mode=json&units=metric';
	    };

	    // aggiungere il dat meteo ai valori
	    request(url, function(error, response, body) {
	        if (!error && response.statusCode == 200) {
	            var wdi = JSON.parse(body);
	            // console.log('*** weather data: ' + JSON.stringify(wdi));
	            if (typeof callback === 'function') {
	                callback(null, wdi.list);
	            }
	        } else {
	        	callback(error, null);
	        }
	    }); 

	},

	history: function (lat, lng, history_date, callback) {

		var url_owm = 'http://api.openweathermap.org/data/2.5/station/find?' +
                      'lat=' + lat + 
                      '&lon=' + lng + 
                      '&cnt=1';

        console.log('getting data weather station by : ' + url_owm);

        request(url_owm, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                    
                    var weather_station = JSON.parse(body);
                    ws = weather_station[0];
                    var owl_history = 'http://api.openweathermap.org/data/2.5/history/station?id=' + 
                                      weather_station[0].station.id + '&type=day&units=metric&lang=it' +
                                      '&start=' + history_date + '&cnt=1';

                    console.log('getting weather data by ' + owl_history);

                    request(owl_history, function(error, response, body) {
                        
                        if (!error && response.statusCode == 200) {
                            var wdi = JSON.parse(body);
                            // console.log('*** weather data: ' + JSON.stringify(wdi));
                            wd = wdi.list[0];
                            if (typeof callback === 'function') {
                                callback(null, wd, ws);
                            }
                        }
                    });
                
            } else {
                if (typeof callback === 'function') {
                    callback(error, null, null);
                }
            }   
        });
	},

	get_title: function (weather_data) {

	    var title = '';
	    var self = this;
	    
	    if (typeof weather_data != 'undefined' && typeof weather_data.temp != 'undefined') {

	        // console.log('weather data: ' + JSON.stringify(weather_data));
	        var temp = '<p>Temperatura min ' + Math.ceil(weather_data.temp.mi/40) + 
	                   ' ℃ - max ' + Math.ceil(weather_data.temp.ma/40) + ' ℃</p>';
	        var wind = '<p>' + weather_data.wind.gust.v + ' mps ' + self.get_wind_direction(weather_data.wind.gust.c) + '</p>';

	        title = temp + wind;
	    };

	    return title;

	},

	get_wind_direction: function (degree) {
	    var wind_dir;
	    
	    if (degree < 45) {
	        wind_dir = 'N';    
	    } else if (degree < 90) {
	        wind_dir = 'NE';
	    } else if (degree < 135) {
	        wind_dir = 'E';
	    } else if (degree < 180) {
	        wind_dir = 'SE';
	    } else if (degree < 225) {
	        wind_dir = 'S';
	    } else if (degree < 270) {
	        wind_dir = 'SW';
	    } else if (degree < 315) {
	        wind_dir = 'W';
	    } else {
	        wind_dir = 'NW';
	    };
	    
	    return wind_dir;
    
	},

	get_item: function (weather_data, weather_station) {
	    var self = this;

	    var w = {
	        data: null,
	        title: '',
	        station: null,
	        error: ''
	    };

	    if (_.size(weather_data) > 0) {
	        w.title = self.get_title(weather_data);
	        w.data = weather_data;
	    } else {
	        w.error = 'non sono riuscito a leggere i dati meteo.\n'
	    };

	    if (weather_station != null) {
	        w.station = weather_station;
	    } else {
	        w.error += 'non sono riuscito a leggere i dati meteo della stazione.\n'
	    };

	    return w;
	}

};