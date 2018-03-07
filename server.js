var express = require('express');
var request = require('request');

var client_id = '34cc976bb02444f598495f72da4e5615'; // TODO move to config file
var client_secret = '6203a8869f664f57b294c1a02d904a01'; // TODO move to config file

var app = express();
app.set('port', (process.env.PORT || 5000));

// Add headers
app.use(function (request, response, next) {
	// Website you wish to allow to connect
	response.setHeader('Access-Control-Allow-Origin', 'https://www.youtube.com');
	// Request methods you wish to allow
	response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	// Request headers you wish to allow
	response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	response.setHeader('Access-Control-Allow-Credentials', true);
	// Pass to next layer of middleware
	next();
});

app.get('/trackAnalysis', function (req, res) {
	var queryString = req.query.q;
	if (!queryString) {
		res.status(400).end('No track name given. Use /trackAnalysys?q=<track_name>.');
		return;
	}
	request.post(getAuthOptions(client_id, client_secret), function (error, response, body) {
		if (!error && response.statusCode === 200) {
			var token = body.access_token;
			var parsed_query_string = parseQueryString(queryString);
			console.log('Access token: ' + token);
			console.log('Prased query string: ' + parsed_query_string);
			request.get(getSearchOptions(parsed_query_string, token), function (error, response, body) {
				if (!error && response.statusCode === 200) {
					var items = body.tracks.items;
					console.log(items.length + ' results found.');
					
					if (items.length <= 0) {
						res.status(404).end('No tracks with name "' + parsed_query_string + '" found.');
						return;
					}
					var track = items[0];
					var artists_names = getArtistsNames(track);
					
					var track_info = {};
					track_info.artists = artists_names;
					track_info.track = track.name;
					track_info.id = track.id;

					request.get(getTrackFeaturesOptions(track.id, token), function (error, response, body) {
						if (!error && response.statusCode === 200) {
							track_info.key = body.key;
							track_info.tempo = body.tempo;
							track_info.loudness = body.loudness;
							console.log(track_info);
							res.send(track_info);
						}
					});
				}
			});
		}
	});
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

function getAuthOptions(client_id, client_secret) {
	return {
		url: 'https://accounts.spotify.com/api/token',
		headers: {
			'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
		},
		form: {
			grant_type: 'client_credentials'
		},
		json: true
	};
}

function getSearchOptions(parsed_query_string, token) {
	return {
		url: 'https://api.spotify.com/v1/search?q=' + parsed_query_string + '&type=track',
		headers: {
			'Authorization': 'Bearer ' + token
		},
		json: true
	};
}

function getTrackFeaturesOptions(track_id, token) {
	return {
		url: 'https://api.spotify.com/v1/audio-features/' + track_id,
		headers: {
			'Authorization': 'Bearer ' + token
		},
		json: true
	};
}

function getArtistsNames(track) {
	var artists = [];
	track.artists.forEach(function(artist) {
		artists.push(artist.name);
	});
	return artists.join();
}

function parseQueryString(queryString) {
	var parsed_query_string = queryString;
	if (parsed_query_string.match((/(\(|\[).*remix.*(\)|\])/gi))) { // if we have (..remix...) / [..remix..] we should not remove everything
		parsed_query_string = parsed_query_string.replace(/(\(|\[|\)|\])/gi, ""); // remove the brackets only
	} else {
		parsed_query_string = parsed_query_string.replace(/(\(|\[).*(\)|\])/gi, ""); // remove everything between brackets (...) or [...]
	}
	parsed_query_string = parsed_query_string.replace(/(4k|hd|ft|ft.|feat|feat.)/gi, ""); // remove specific words
	return parsed_query_string.trim();
}