# openARPA-scrape
nodeJS module to scraping ARPA's site

## Installation

<pre>npm install openarpa-scrape</pre>

## Usage

<pre>monitoring (warning, geojson, callback)</pre>

### Parameters
* warning: true if only warning value, otherwise all value > 0
* geojson: true if only [geojson] format 

Restituisce tutti i valori delle centraline ARPA per il monitoraggio della qualità dell'aria  

<pre>taranto (callback)</pre>

Restituisce tutti i valori delle centraline ARPA per il monitoraggio della qualità dell'aria nella sola zona di Taranto-ILVA

<pre>amianto (callback)</pre>

Restituisce tutti i siti di amianto nel territorio barese in formato geojson

<pre>prevision (geojson, lat, lng, limit, callback)</pre> 

Restituisce tutti i dati di monitoraggio della qualità dell'aria dalla centralina più vicina alle cordinate geografiche, e la previsioni meteo per la diffusione degli inquinanti. Il parametro <pre>limit</pre> può essere <pre>hour</pre> per la previsione ogni 3 ore nei prossimi 5 giorni, oppure <pre>daily</pre> per la previsione nei prossimi 16 giorni.

## Examples
<pre>
	var openarpa = require('openarpa-scrape');

	openarpa.amianto(true, false, function (data) {
		// 
	});

</pre>

## Response Data
[openARPA]https://github.com/opendatabari/openARPA.git NodeJS Server REST 

## Developers & Support
Giuseppe Zileni ([Twitter](https://twitter.com/gzileni)/[Mail](mailto:me@gzileni.name)/[Site](http://www.gzileni.name))
