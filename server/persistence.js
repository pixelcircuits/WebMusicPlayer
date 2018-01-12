//////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////// Datastore ////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
var Datastore = require('nedb');
//https://github.com/louischatriot/nedb
	
var dir = __dirname + '/data/';
if(/^win/.test(process.platform)) dir = __dirname + '\\data\\';
var db = {};
db.songs = new Datastore({ filename: dir + 'songs.db', autoload: true });
db.songs.ensureIndex({ fieldName: 'title' }, function (err) { if(err) console.log('Persistence: failed to index title field [' + err + ']'); });
db.songs.ensureIndex({ fieldName: 'artist' }, function (err) { if(err) console.log('Persistence: failed to index artist field [' + err + ']'); });
db.songs.ensureIndex({ fieldName: 'album' }, function (err) { if(err) console.log('Persistence: failed to index album field [' + err + ']'); });
db.playlists = new Datastore({ filename: dir + 'playlists.db', autoload: true });
db.playlists.ensureIndex({ fieldName: 'name' }, function (err) { if(err) console.log('Persistence: failed to index name field [' + err + ']'); });
db.visuals = new Datastore({ filename: dir + 'visuals.db', autoload: true });
db.visuals.ensureIndex({ fieldName: 'songId' }, function (err) { if(err) console.log('Persistence: failed to index name field [' + err + ']'); });

//////////////////////////////////////////////////////////
// Helper functions to clean an object into song format //
//////////////////////////////////////////////////////////
function cleanSong(song) {
	return {
		id: song._id ? song._id : null,
		tag: song.tag ? song.tag : '',
		title: song.title ? song.title : '',
		artist: song.artist ? song.artist : '',
		artistImg: song.artistImg ? song.artistImg : '',
		album: song.album ? song.album : '',
		albumArt: song.albumArt ? song.albumArt : '',
		albumArtIcon: song.albumArtIcon ? song.albumArtIcon : ''
	};
}
function cleanSongs(songs) {
	for(var i=0; i<songs.length; i++) songs[i] = cleanSong(songs[i]);
	return songs;
}
function cleanSongForDatabase(song) {
	var clean = {
		tag: song.tag ? song.tag : '',
		title: song.title ? song.title : '',
		artist: song.artist ? song.artist : '',
		artistImg: song.artistImg ? song.artistImg : '',
		album: song.album ? song.album : '',
		albumArt: song.albumArt ? song.albumArt : '',
		albumArtIcon: song.albumArtIcon ? song.albumArtIcon : ''
	};
	if(song.id) clean._id = song.id;
	return clean;
}

//////////////////////////////////////////////////////////////
// Helper functions to clean an object into playlist format //
//////////////////////////////////////////////////////////////
function cleanPlaylist(playlist) {
	var clean = {
		id: playlist._id ? playlist._id : null,
		name: playlist.name ? playlist.name : '',
		songs: []
	};
	if(playlist.songs) {
		for(var i=0; i<playlist.songs.length; i++) {
			clean.songs.push(cleanSong(playlist.songs[i]));
		}
	}
	return clean;
}
function cleanPlaylistForDatabase(playlist) {
	var clean = {
		name: playlist.name ? playlist.name : '',
		songIds: []
	};
	if(playlist.id) clean._id = playlist.id;
	if(playlist.songs) {
		for(var i=0; i<playlist.songs.length; i++) {
			if(playlist.songs[i] && playlist.songs[i].id && clean.songIds.indexOf(playlist.songs[i].id) == -1) {
				clean.songIds.push(playlist.songs[i].id);
			}
		}
	}
	return clean;
}

/////////////////////////////////////////////////////////////
// Helper functions to clean an object into visuals format //
/////////////////////////////////////////////////////////////
function cleanVisual(visual) {
	var clean = {
		songId: visual.songId ? visual.songId : null,
		background: visual.background ? visual.background : 0,
		foreground: visual.foreground ? visual.foreground : 0,
		color0: visual.color0 ? visual.color0 : [0,0,0],
		color1: visual.color1 ? visual.color1 : [0,0,0],
		color2: visual.color2 ? visual.color2 : [0,0,0]
	};
	return clean;
}
function cleanVisualForDatabase(visual) {
	var clean = {
		songId: visual.songId ? visual.songId : null,
		background: visual.background ? visual.background : 0,
		foreground: visual.foreground ? visual.foreground : 0,
		color0: visual.color0 ? visual.color0 : [0,0,0],
		color1: visual.color1 ? visual.color1 : [0,0,0],
		color2: visual.color2 ? visual.color2 : [0,0,0]
	};
	return clean;
}

//////////////////////////////////////////////////////////////////////
// Helper functions to sort list of songs into album/artist objects //
//////////////////////////////////////////////////////////////////////
function sortAlbums(songs) {
	var albumList = [];
	if(songs) {
		var albums = {};
		for(var s in songs) {
			var album = albums[songs[s].album];
			if(!album) {
				album = { 
					artist: songs[s].artist,
					artistImg: songs[s].artistImg,
					album: songs[s].album,
					albumArt: songs[s].albumArt,
					albumArtIcon: songs[s].albumArtIcon,
					songs: [] 
				};
				albumList.push(album);
				albums[songs[s].album] = album;
			}
			album.songs.push(songs[s]);
		}
	}
	return albumList;
}
function sortArtists(songs) {
	var artistList = [];
	if(songs) {
		var artists = {};
		for(var s in songs) {
			var artist = artists[songs[s].artist];
			if(!artist) {
				artist = { 
					artist: songs[s].artist,
					artistImg: songs[s].artistImg,
					albums: [] 
				};
				artistList.push(artist);
				artists[songs[s].artist] = artist;
			}
			artist.albums.push(songs[s]);
		}
	}
	for(var a in artistList) {
		artistList[a].albums = sortAlbums(artistList[a].albums);
	}
	return artistList;
}

/////////////////////////////
// Song Database Functions //
/////////////////////////////
var Database = function () {};
Database.prototype.searchSongs = function(title, callback) {
	db.songs.find({ title: new RegExp(('' + title).trim(), 'i') }, function (err, docs) {
		callback(cleanSongs(docs));
	});
};
Database.prototype.searchAlbums = function(album, callback) {
	db.songs.find({ album: new RegExp(('' + album).trim(), 'i') }, function (err, docs) {
		callback(sortAlbums(cleanSongs(docs)));
	});
};
Database.prototype.searchArtists = function(artist, callback) {
	db.songs.find({ artist: new RegExp(('' + artist).trim(), 'i') }, function (err, docs) {
		callback(sortArtists(cleanSongs(docs)));
	});
};
Database.prototype.songDetails = function(songs, callback) {
	var results = [];
	var count = songs.length;
	function complete(song){
		if(song) results.push(song);
		if((--count) <= 0) callback(cleanSongs(results));
	}	
	for(var s in songs) {
		var q = {};
		q.title = songs[s].title;
		q.artist = songs[s].artist;
		if(songs[s].album) q.album = songs[s].album;
		db.songs.findOne(q, function (err, doc) { complete(doc); });
	}
};
Database.prototype.albumDetails = function(albums, callback) {
	var results = [];
	var count = albums.length;
	function complete(songs){
		if(songs) results = results.concat(songs);
		if((--count) <= 0) callback(sortAlbums(cleanSongs(results)));
	}	
	for(var a in albums) {
		var q = {};
		q.album = albums[a].album;
		q.artist = albums[a].artist;
		db.songs.find(q, function (err, docs) { complete(docs); });
	}
};
Database.prototype.artistDetails = function(artists, callback) {
	var results = [];
	var count = artists.length;
	function complete(songs){
		if(songs) results = results.concat(songs);
		if((--count) <= 0) callback(sortArtists(cleanSongs(results)));
	}	
	for(var a in artists) {
		var q = {};
		q.artist = artists[a].artist;
		db.songs.find(q, function (err, docs) { complete(docs); });
	}
};
Database.prototype.saveSong = function(song, callback) {
	song = cleanSongForDatabase(song);
	if(song.title && song.artist) {
		var q = {};
		q.title = song.title;
		q.artist = song.artist;
		if(song.album) q.album = song.album;
		db.songs.findOne(q, function (err, doc) {
			if(doc) {
				if(song._id && doc._id!=song._id) {
					// Title, Artist, Album already in database
					callback({errorType:"alreadyTagged", key:""});
				} else {
					// Title, Artist, Album didn't change
					db.songs.update({_id: doc._id}, song, {multi:false, returnUpdatedDocs:true}, function(err, count, doc) {
						if(err) callback(err);
						else if(count==0) callback({errorType:"doesNotExist", key:""});
						else callback(cleanSong(doc));
					});
				}
			} else {
				if(song._id) {
					// Title, Artist, Album changed
					db.songs.update({_id: song._id}, song, {multi:false, returnUpdatedDocs:true}, function(err, count, doc) {
						if(err) callback(err);
						else if(count==0) callback({errorType:"doesNotExist", key:""});
						else callback(cleanSong(doc));
					});
				} else {
					// Completely new insert
					db.songs.insert(song, function (err, doc) {
						if(err) callback(err);
						else callback(cleanSong(doc));
					})
				}
			}
		});
	}
};
Database.prototype.deleteSong = function(song, callback) {
	song = cleanSongForDatabase(song);
	if(song._id) {
		db.songs.findOne({_id: song._id}, function (err, doc) {
			if(doc) {
				db.songs.remove({_id: doc._id}, {}, function(err) {
					if(err) callback(err);
					else { 
						callback(cleanSong(song));
						
						// Remove song from playlists
						db.playlists.find({songIds: doc._id}, function (err, docs) {
							if(!err) {
								for(var i=0; i<docs.length; i++) {
									var songIds = [];
									for(var j=0; j<docs[i].songIds.length; j++) if(docs[i].songIds[j] != doc._id) songIds.push(docs[i].songIds[j]);
									docs[i].songIds = songIds;
									db.playlists.update({_id: docs[i]._id}, docs[i], {multi:false});
								}
							}
						});
						
						// Remove visuals
						db.visuals.find({songId: doc._id}, function (err, docs) {
							if(!err) for(var i=0; i<docs.length; i++) db.playlists.remove({_id: docs[i]._id}, {});
						});
					}
				});
			} else {
				callback(cleanSong(song));
			}
		});
	}
};
Database.prototype.findSongById = function(id, callback) {
	if(id) {
		db.songs.findOne({_id: id}, function (err, doc) {
			if(doc) callback(cleanSong(doc));
			else callback(null);
		});
	}
};
Database.prototype.findSongsByIds = function(ids, callback) {
	if(ids && ids.length) {
		db.songs.find({_id: {$in : ids}}, function (err, docs) {
			if(docs && docs.length) callback(cleanSongs(docs));
			else callback([]);
		});
	} else {
		callback([]);
	}
};

/////////////////////////////////
// Playlist Database Functions //
/////////////////////////////////
Database.prototype.searchPlaylists = function(name, callback) {
	var q = {};
	if(name) q.name = new RegExp(('' + album).trim(), 'i');
	db.playlists.find(q, function (err, docs) {
		if(docs && docs.length) {
			var count = docs.length;
			function complete() {
				if((--count) <= 0) {
					for(var i=0; i<docs.length; i++) docs[i] = cleanPlaylist(docs[i]);
					callback(docs);
				}
			}
			function getSongs(playlist) {
				if(playlist.songIds && playlist.songIds.length) {
					db.songs.find({_id: {$in : playlist.songIds}}, function (err, songs) {
						playlist.songs = songs;
						complete();
					});
				} else {
					complete();
				}
			}
			for(var i=0; i<docs.length; i++) getSongs(docs[i]);
		} else {
			callback([]);
		}
	});
};
Database.prototype.getPlaylist = function(id, callback) {
	var findSongsByIds = this.findSongsByIds;
	db.playlists.findOne({_id: id}, function (err, doc) {
		if(doc) {
			if(doc.songIds && doc.songIds.length) {
				db.songs.find({_id: {$in : doc.songIds}}, function (err, songs) {
					doc.songs = songs;
					callback(cleanPlaylist(doc));
				});
			} else {
				callback(cleanPlaylist(doc));
			}
		} else {
			callback(null);
		}
	});
};
Database.prototype.savePlaylist = function(playlist, callback) {
	playlist = cleanPlaylistForDatabase(playlist);
	function fillSongs(playlist) {
		if(playlist.songIds && playlist.songIds.length) {
			db.songs.find({_id: {$in : playlist.songIds}}, function (err, songs) {
				playlist.songs = songs;
				callback(cleanPlaylist(playlist));
			});
		} else {
			callback(cleanPlaylist(playlist));
		}
	}
	if(playlist._id) {
		db.playlists.update({_id: playlist._id}, playlist, {multi:false, returnUpdatedDocs:true}, function(err, count, doc) {
			if(err) callback(err);
			else if(count==0) {
				// Couln't find id
				db.playlists.insert(playlist, function (err, doc) {
					if(err) callback(err);
					else fillSongs(doc);
				})
			} else {
				fillSongs(doc);
			} 
		});
	} else {
		db.playlists.insert(playlist, function (err, doc) {
			if(err) callback(err);
			else fillSongs(doc);
		})
	}
};
Database.prototype.deletePlaylist = function(playlist, callback) {
	playlist = cleanPlaylistForDatabase(playlist);
	if(playlist._id) {
		db.playlists.findOne({_id: playlist._id}, function (err, doc) {
			if(doc) {
				db.playlists.remove({_id: doc._id}, {}, function(err) {
					if(err) callback(err);
					else callback(cleanPlaylist(playlist));
				});
			} else {
				callback(cleanPlaylist(playlist));
			}
		});
	}
};

////////////////////////////////
// Visuals Database Functions //
////////////////////////////////
Database.prototype.getVisual = function(songId, callback) {
	db.visuals.findOne({songId: songId}, function (err, doc) {
		if(doc) {
			callback(cleanVisual(doc));
		} else {
			callback(null);
		}
	});
};
Database.prototype.saveVisual = function(visual, callback) {
	visual = cleanVisualForDatabase(visual);
	db.visuals.findOne({songId: visual.songId}, function (err, doc) {
		if(doc) {
			db.visuals.update({songId: visual.songId}, visual, {multi:false, returnUpdatedDocs:true}, function(err, count, doc) {
				if(err) callback(err);
				else callback(cleanVisual(doc)); 
			});
		} else {
			db.visuals.insert(visual, function (err, doc) {
				if(err) callback(err);
				else callback(cleanVisual(doc));
			});
		}
	});
};
Database.prototype.deleteVisual = function(songId, callback) {
	if(songId) {
		db.visuals.remove({songId: songId}, {}, function(err) {
			if(err) callback(err);
			else callback(cleanVisual(playlist));
		});
	}
};

/////////////////////
// Clean Functions //
/////////////////////
Database.prototype.cleanSong = function(song) {
	return cleanSong(song);
};
Database.prototype.cleanSongs = function(songs) {
	return cleanSongs(songs);
};
Database.prototype.cleanPlaylist = function(playlist) {
	return cleanPlaylist(playlist);
};
Database.prototype.cleanVisual = function(visual) {
	return cleanVisual(visual);
};

////////////////////////////
// Export Database Object //
////////////////////////////
module.exports = new Database();
