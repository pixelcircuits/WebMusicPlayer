// Core
var fs = require('fs');
var https = require('https');
var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var spawn = require('child_process').spawn;

// Modules
var ws = require('./server/websockets.js');
var db = require('./server/persistence.js');
var img = require('./server/image.js');
var player = require('./server/player.js');
var bluetooth = require('./server/bluetooth.js');
var audio = require('./server/audio.js');
var settings = require('./server/settings.js');

// Properties
var serverPort = 80;


///////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// Websocket Controls ///////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////

// Play song by Id
ws.subscribe_c("Play", function(id) {
	if(id) {
		db.findSongById(id, function(song) {
			if(song) player.play(song);
		});
	} else {
		player.play(null);
	}
}, false, 'string');

// Play playlist by Id
ws.subscribe_c("PlayPlaylist", function(id) {
	db.getPlaylist(id, function(playlist){
		if(playlist) {
			player.queueUpdate(playlist.songs);
			player.play(playlist.songs[0]);
		}
	});
}, false, 'string');

// Pause
ws.subscribe_c("Pause", function() {
	player.pause();
}, false);

// Stop
ws.subscribe_c("Stop", function() {
	player.stop();
}, false);

// Seek
ws.subscribe_c("Seek", function(s) {
	player.seek(parseFloat(s));
}, false, 'string');

// Send VisualsData message for current playing song
ws.subscribe_c("VisualsSave", function(data) {
	db.saveVisual(data, function(){});
}, false, 'json');

////////////////////////////////////////////////////////////////////////////////////////////////

// Send Playlists and IconData messages for all playlists
ws.subscribe_c("PlaylistsRequest", function() {
	db.searchPlaylists(null, function(playlists) {
		//send playlist info
		var playlistData = [];
		for(p in playlists) {
			if(playlists[p].songs.length > 0) playlistData.push({id:playlists[p].id, name:playlists[p].name, numSongs:playlists[p].songs.length});
		}
		ws.publish_c("Playlists", JSON.stringify(playlistData), true);
		
		//send art data for playlist
		function getPlaylistArt(playlist) {
			function sendIcon(count, data) {
				var buff = new Array((16+1) + (1+1) + (16*16*3));
				for(var i=0; i<16; i++) buff[i] = playlist.id.charCodeAt(i);
				buff[16] = 0; buff[16+1] = count; buff[16+2] = 0;
				for(var i=0; i<(16*16*3); i++) buff[16+3+i] = data[i];				
				ws.publish_c("IconData", buff, true);
			}
			var urls = [];
			for(var s in playlist.songs) {
				var art = playlist.songs[s].albumArtIcon;
				if(art && urls.indexOf(art)<0) {
					urls.push(art);
					if(urls.length >= 4) break;
				}
			}
			if(urls.length == 1) {
				img.getIcon16(urls[0], function(icon) {
					if(icon) sendIcon(1, icon);
				});
			} else if(urls.length > 1) {
				var icons = {};
				icons.length = 0;
				function complete(url, icon) {
					icons[url] = icon;
					icons.length++;
					if(icons.length == urls.length) {
						validIcons = [];
						for(var u in urls) if(icons[urls[u]]) validIcons.push(urls[u]);
						if(validIcons.length == 1) {
							sendIcon(1, icons[validIcons[0]]);
						} else if(validIcons.length > 1) {
							var combined = new Array(16*16*3);
							for(var v=0; v<validIcons.length; v++) {
								var icon8 = img.halfImage(icons[validIcons[v]], 16);
								for(var i=0; i<(8*8*3); i++) combined[(8*8*3)*v + i] = icon8[i];
							}
							sendIcon(validIcons.length, combined);
						}
					}
				}
				function fetch(url) { img.getIcon16(url, function(icon) { complete(url, icon); }); }
				for(var u=0; u<urls.length; u++) fetch(urls[u]);
			}
		}
		for(var p in playlists) getPlaylistArt(playlists[p]);
	});
}, true);

// Send ArtData message for current playing song
ws.subscribe_c("AlbumArtRequest", function() {
	var albumArt = player.getData().playing.albumArtIcon;
	if(albumArt) {
		img.getIcon32(albumArt, function(icon) {
			if(icon) ws.publish_c("ArtData", icon, true);
		});
	}
}, true);

// Send VisualsData message for current playing song
ws.subscribe_c("VisualsRequest", function() {
	var songId = player.getData().playing.id;
	if(songId) {
		db.getVisual(songId, function(visuals){
			if(visuals) ws.publish_c("VisualsData", JSON.stringify(visuals), true);
		});
	}
}, true);

////////////////////////////////////////////////////////////////////////////////////////////////

// Update settings
ws.subscribe_c("SettingsUpdate", function(data) {
	settings.setSettings(data);
	
	if(data["selectedBluetooth"] !== undefined) bluetooth.pair(data["selectedBluetooth"]);
	if(data["audioOutput"] !== undefined) audio.setOutput(data["audioOutput"]);
	if(data["audioVolume"] !== undefined) audio.setVolume(data["audioVolume"]);
}, true, 'json');


/////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// REST API ///////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
var app = express();
app.use(bodyParser.json());

// Configure Express to serve index.html and any other static pages stored in the home directory
app.use(express.static(__dirname)); 

// Poll
app.get('/poll', function (req, res) {
	res.status(200).send(player.getData());
}); 

// Play
app.post('/play', function (req, res) {
	player.play(req.body);
	res.status(200).send(player.getData());
}); 

// Pause
app.get('/pause', function (req, res) {
	player.pause();
	res.status(200).send(player.getData());
}); 

// Stop
app.get('/stop', function (req, res) {
	player.stop();
	res.status(200).send(player.getData());
}); 

// Seek
app.get('/seek/:time', function (req, res) {
	player.seek(req.params.time);
	res.status(200).send(player.getData());
});

////////////////////////////////////////////////////////////////////////////////////////////////

// Queue Update
app.post('/queue/update', function (req, res) {
	player.queueUpdate(req.body);
	res.status(200).send(player.getData());
});

// Queue Repeat
app.get('/queue/repeat/:repeat', function (req, res) {
	player.queueRepeat(req.params.repeat == 'true');
	res.status(200).send(player.getData());
});
	
////////////////////////////////////////////////////////////////////////////////////////////////

// Search Songs
app.get('/search/songs', function (req, res) {
	db.searchSongs(req.query.text, function(songs) {
		res.status(200).send(songs);
	});
});

// Search Albums
app.get('/search/albums', function (req, res) {
	db.searchAlbums(req.query.text, function(albums) {
		res.status(200).send(albums);
	});
});
	
// Search Artists
app.get('/search/artists', function (req, res) {
	db.searchArtists(req.query.text, function(artists) {
		res.status(200).send(artists);
	});
});

// Get Song Details
app.post('/details/songs', function (req, res) {
	db.songDetails(req.body, function(songs) {
		res.status(200).send(songs);
	});
});

// Get Album Details
app.post('/details/albums', function (req, res) {
	db.albumDetails(req.body, function(albums) {
		res.status(200).send(albums);
	});
});

// Get Artist Details
app.post('/details/artists', function (req, res) {
	db.artistDetails(req.body, function(artists) {
		res.status(200).send(artists);
	});
});

// Save Song
app.post('/song/save', function (req, res) {
	db.saveSong(req.body, function(result) { 
		if(result && result.tag) player.updateData(result);
		res.status(200).send(result);
	});
});

// Delete Song
app.post('/song/delete', function (req, res) {
	db.deleteSong(req.body, function(result) { 
		if(result && result.id) player.updateDataDelete(result.id);
		res.status(200).send(result);
	});
});

// Search Playlists
app.get('/search/playlists', function (req, res) {
	db.searchPlaylists(req.query.text, function(playlists) {
		res.status(200).send(playlists);
	});
});

// Save Playlist
app.post('/playlist/save', function (req, res) {
	db.savePlaylist(req.body, function(result) { 
		res.status(200).send(result);
	});
});

// Delete Playlist
app.post('/playlist/delete', function (req, res) {
	db.deletePlaylist(req.body, function(result) { 
		res.status(200).send(result);
	});
});
	
////////////////////////////////////////////////////////////////////////////////////////////////

// Get Visuals Supported
app.get('/visuals/supported', function (req, res) {
	if(ws.isMainClientConnected()) {
		res.status(200).send("true");
	} else {
		res.status(200).send("false");
	}
});

// Get Visuals
app.get('/visuals/get/:songId', function (req, res) {
	db.getVisual(req.params.songId, function(visuals) {
		res.status(200).send(visuals);
	});
});

// Save Visuals
app.post('/visuals/save', function (req, res) {
	db.saveVisual(req.body, function(result) { 
		if(result && result.songId) player.updateData(null, result);
		res.status(200).send(result);
	});
});

// Delete Visuals
app.get('/visuals/delete/:songId', function (req, res) {
	db.deleteVisual(req.params.songId, function(visual) {
		res.status(200).send(visual);
	});
});

/////////////////////////////////////////////////////////////////////////////////////////////////

// Art Upload
var storage = multer.diskStorage({
	destination: __dirname + '/server/data/imgs/',
	filename: function (req, file, cb) {
		cb(null, file.originalname);
	}
});
var fileFilter = function(req, file, cb) {
	cb(null, file.mimetype == 'image/jpeg' || file.mimetype == 'image/png' || file.mimetype == 'image/gif');
}
var upload = multer({storage:storage, fileFilter:fileFilter});
app.post('/art/upload', upload.single('upload'), function (req, res) {
	if(req.file) {
		res.status(200).send('server/data/imgs/' + req.file.filename);
	} else {
		res.status(415).send('Bad File');
	}
});

// Get Art
app.get('/art/collection', function (req, res) {
	fs.readdir(__dirname + '/server/data/imgs/', function(err, files) {
		if(err) {
			res.status(500).send(err);
		} else {
			for(var i=0; i<files.length; i++) files[i] = 'server/data/imgs/' + files[i];
			res.status(200).send(files);
		}
	});
});

////////////////////////////////////////////////////////////////////////////////////////////////

// Get plugin player scripts
app.get('/plugins/scripts/player', function (req, res) {
	settings.getSetting("pluginConfiguration", function(data) {
		var pluginScripts = [];
		if(data) {
			for(var i=0; i<data.length; i++) {
				var path = 'plugins/' + data[i].name + '/plugin_player.js';
				if(fs.existsSync(__dirname + '/' + path)) {
					data[i].path = path;
					pluginScripts.push(data[i]);
				}
			}
		}
		pluginScripts.sort(function(a, b) {
			return a.index - b.index;
		});
		res.status(200).send(pluginScripts);
	});
});

// Get plugin search scripts
app.get('/plugins/scripts/search', function (req, res) {
	settings.getSetting("pluginConfiguration", function(data) {
		var pluginScripts = [];
		if(data) {
			for(var i=0; i<data.length; i++) {
				var path = 'plugins/' + data[i].name + '/plugin_search.js';
				if(fs.existsSync(__dirname + '/' + path)) {
					data[i].path = path;
					pluginScripts.push(data[i]);
				}
			}
		}
		pluginScripts.sort(function(a, b) {
			return a.index - b.index;
		});
		res.status(200).send(pluginScripts);
	});
});

////////////////////////////////////////////////////////////////////////////////////////////////

// Start bluetooth scan
app.get('/bluetooth/scan', function (req, res) {
	bluetooth.scan();
	res.status(200).send();
});

// Get bluetooth select status
app.get('/bluetooth/status', function (req, res) {
	var status = bluetooth.getStatus();
	res.status(200).send(status);
});

////////////////////////////////////////////////////////////////////////////////////////////////

// Get all settings
app.get('/settings/get', function (req, res) {
	settings.getAllSettings(function(settings) {
		res.status(200).send(settings);
	});
});

// Set settings
app.post('/settings/set', function (req, res) {
	settings.setSettings(req.body);
	
	if(req.body["selectedBluetooth"] !== undefined) bluetooth.pair(req.body["selectedBluetooth"]);
	if(req.body["audioOutput"] !== undefined) audio.setOutput(req.body["audioOutput"]);
	if(req.body["audioVolume"] !== undefined) audio.setVolume(req.body["audioVolume"]);
	res.status(200).send("");
});

// Shutdown
app.get('/settings/shutdown', function (req, res) {
	if(process.platform == "linux") {
		if(ws.isMainClientConnected()) ws.publish_c("Shutdown", null, true);
		else spawn('shutdown', ['-h', 'now']);
	}
	res.status(200).send("");
});

////////////////////////////////////////////////////////////////////////////////////////////////

// All other GETs
app.get('*', function (req, res) {
	res.status(404).send('Unrecognised API call');
});

// Error handling
app.use(function (err, req, res, next) {
	if (req.xhr) {
		res.status(500).send('Oops, Something went wrong!');
	} else {
		next(err);
	}
});

/////////////////////////////////////////////////////////////////////////////////////////////////

// Start Express App Server
app.listen(serverPort);
console.log('App Server is listening on port ' + serverPort);
