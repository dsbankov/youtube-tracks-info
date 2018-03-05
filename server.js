var express = require('express');
var request = require('request');

var app = express();

app.set('port', (process.env.PORT || 5000));

var client_id = '34cc976bb02444f598495f72da4e5615'; // TODO move to config file
var client_secret = '6203a8869f664f57b294c1a02d904a01'; // TODO move to config file

// your application requests authorization
var authOptions = {
	url: 'https://accounts.spotify.com/api/token',
	headers: {
		'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
	},
	form: {
		grant_type: 'client_credentials'
	},
	json: true
};

// Add headers
app.use(function (req, res, next) {
	// Website you wish to allow to connect
	res.setHeader('Access-Control-Allow-Origin', 'https://www.youtube.com');
	// Request methods you wish to allow
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	// Request headers you wish to allow
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	res.setHeader('Access-Control-Allow-Credentials', true);
	// Pass to next layer of middleware
	next();
});

app.get('/trackAnalysis', function (req, res) {
	var queryString = req.query.q;
	if (!queryString) {
		res.status(400).end('No track name given. Use /trackAnalysys?q=' + track_name + '.');
		return;
	}
	request.post(authOptions, function (error, response, body) {
		if (!error && response.statusCode === 200) {
			// use the access token to access the Spotify Web API
			var token = body.access_token;
			console.log('Access token: ' + token);

			request.get({
				url: 'https://api.spotify.com/v1/search?q=' + queryString + '&type=track',
				headers: {
					'Authorization': 'Bearer ' + token
				},
				json: true
			}, function (error, response, body) {

				var items = body.tracks.items;
				console.log(items.length + ' results found.');
				if (items.length <= 0) {
					res.status(404).end('No tracks with name "' + queryString + '" found.');
					return;
				}
				var track = items[0];
				
				var artists = [];
				track.artists.forEach(function(artist) {
					artists.push(artist.name);
				});
				
				console.log('Artist: ' + artists.join());
				console.log('Track: ' + track.name);
				console.log('ID: ' + track.id);
				var response_object = {};
				response_object.artist = artists.join();
				response_object.track = track.name;
				response_object.id = track.id;

				request.get({
					url: 'https://api.spotify.com/v1/audio-features/' + track.id,
					headers: {
						'Authorization': 'Bearer ' + token
					},
					json: true
				}, function (error, response, body) {
					console.log('Key: ' + body.key);
					console.log('Tempo: ' + body.tempo);
					console.log('Loudness: ' + body.loudness);
					response_object.key = body.key;
					response_object.tempo = body.tempo;
					response_object.loudness = body.loudness;
					res.send(response_object);
				});

			});

		}
	});
})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});