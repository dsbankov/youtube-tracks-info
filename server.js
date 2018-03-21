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
			console.log('Parsed query string: ' + parsed_query_string);
			request.get(getSearchOptions(parsed_query_string, token), function (error, response, body) {
				// console.log(!error);
				// console.log(response.statusCode);
				// console.log(body);
				if (!error && response.statusCode === 200 && body && body.tracks && body.tracks.total > 0) {
					var items = body.tracks.items;
					console.log(body.tracks.total + ' results found!');
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
							track_info.key = getNote(body.key, body.mode);
							track_info.tempo = Math.round(body.tempo);
							track_info.loudness = body.loudness.toFixed(1);
							console.log('All info: ' + JSON.stringify(body));
							console.log('Response: ' + JSON.stringify(track_info));
							res.send(track_info);
						} else {
							res.status(500).end('Error while getting track info. Details: ' + error);
							return;
						}
					});
				} else {
					res.status(404).end('Error while searching. No tracks with name "' + parsed_query_string + '" found.');
					return;
				}
			});
		} else {
			res.status(500).end('Error while getting access token. Details: ' + error);
			return;
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

function getNote(key, mode) {
	var mode_string = (mode == 0) ? 'Minor' : 'Major';
	var number_to_note = new Map();
	number_to_note.set(0, "C");
	number_to_note.set(1, "C#");
	number_to_note.set(2, "D");
	number_to_note.set(3, "D#");
	number_to_note.set(4, "E");
	number_to_note.set(5, "F");
	number_to_note.set(6, "F#");
	number_to_note.set(7, "G");
	number_to_note.set(8, "G#");
	number_to_note.set(9, "A");
	number_to_note.set(10, "A#");
	number_to_note.set(11, "B");
	return number_to_note.get(key) + ' ' + mode_string;
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
	parsed_query_string = parsed_query_string.replace(/(4k|hd|ft\.|ft|feat\.|feat|\|)/gi, ""); // remove specific words/characters
	parsed_query_string = parsed_query_string.replace(/\s+/gi, " "); // trim consecutive whitespaces
	return parsed_query_string.trim();
}