(function () {
    var app = angular.module('App')
	app.service('connector', function(adapter) {
		var lastFM_key = 'add094cba77cb69f494ed93715bfe25e';
		var filter_requireMBID = false;
		var filter_requireArt = true;
		var filter_requireSongs = true;
		var filter_minListeners = 1000;
		var filter_minPlaycount = 1000;
		var filter_maxResults = 20;
		
		// Build song, album, artist objects
		function buildSong(tag, title, artist, artistImg, album, albumArt, albumArtIcon) {
			return {
				tag: tag ? tag : '',
				title: title ? title : '',
				artist: artist ? artist : '',
				artistImg: artistImg ? artistImg : '',
				album: album ? album : '',
				albumArt: albumArt ? albumArt : '',
				albumArtIcon: albumArtIcon ? albumArtIcon : ''
			};
		}
		function buildAlbum(artist, artistImg, album, albumArt, albumArtIcon, songs) {
			return {
				artist: artist ? artist : '',
				artistImg: artistImg ? artistImg : '',
				album: album ? album : '',
				albumArt: albumArt ? albumArt : '',
				albumArtIcon: albumArtIcon ? albumArtIcon : '',
				songs: songs ? songs : []
			};
		}
		function buildArtist(artist, artistImg, albums) {
			return {
				artist: artist ? artist : '',
				artistImg: artistImg ? artistImg : '',
				albums: albums ? albums : []
			};
		}
		
		// Combine two arrays of songs
		function combineItems(primary, secondary) {
			for(var s in secondary) {
				var found = false;
				for(var p in primary) {
					var titleMatch = !primary[p].title || !secondary[s].title || primary[p].title.toLowerCase()==secondary[s].title.toLowerCase();
					var albumMatch = !primary[p].album || !secondary[s].album || primary[p].album.toLowerCase()==secondary[s].album.toLowerCase();
					var artistMatch = !primary[p].artist || !secondary[s].artist || primary[p].artist.toLowerCase()==secondary[s].artist.toLowerCase();
					if(titleMatch && albumMatch && artistMatch) {
						found = true;
						if(secondary[s].id) primary[p].id = secondary[s].id;
						if(secondary[s].tag) primary[p].tag = secondary[s].tag;
						if(secondary[s].title) primary[p].title = secondary[s].title;
						if(secondary[s].artist) primary[p].artist = secondary[s].artist;
						if(secondary[s].artistImg) primary[p].artistImg = secondary[s].artistImg;
						if(secondary[s].album) primary[p].album = secondary[s].album;
						if(secondary[s].albumArt) primary[p].albumArt = secondary[s].albumArt;
						if(secondary[s].albumArtIcon) primary[p].albumArtIcon = secondary[s].albumArtIcon;
						if(secondary[s].songs) primary[p].songs = secondary[s].songs;
						if(secondary[s].albums) primary[p].albums = secondary[s].albums;
						break;
					}
				}
				if(!found) {
					primary.push(secondary[s]);
				}
			}
			return primary;
		}
		
		// Beautify error object
		function beautifyError(err) {
			if(err.errorType && err.errorType == "uniqueViolated") return "The value '" + err.key + "' was NOT unique";
			if(err.errorType && err.errorType == "alreadyTagged") return "The song Title,Artist,Album is already tagged";
			if(err.errorType && err.errorType == "doesNotExist") return "Song does NOT exist";
			if(err !== null && typeof err === 'object') {
				var s = '';
				var first = true;
				for(var i in err) {
					if(!first) s += ', ';
					s += (i + ': ' + err[i]);
					if(first) first = false;
				}
				return s;
			}
			
			return err;
		}
		
		// POST REST request
		jQuery["postJSON"] = function(url, data, callback) {
			$.ajax({url: url, type: "POST", data: JSON.stringify(data), contentType:"application/json; charset=utf-8", dataType:"json", success: callback});
		}
		
		// Add URL parameters
		function common_addURLParams(url, params) {
			var isFirst=true;
			for(var p in params) {
				if(isFirst) url += '?' + p + '=' + encodeURIComponent(params[p]);
				else url += '&' + p + '=' + encodeURIComponent(params[p]);
				isFirst = false;
			}
			return url;
		}
		
		// Build lastFM API URL
		function lastFM_buildURL(method, params) {
			var url = 'http://ws.audioscrobbler.com/2.0/?method=' + method + '&api_key=' + lastFM_key + '&format=json';
			for(var p in params) url += '&' + p + '=' + encodeURIComponent(params[p]);
			return url;
		}
		
		// Get lastFM image at desired quality
		function lastFM_getImage(images, size) {
			var sizes = ['small', 'medium', 'large', 'extralarge', 'mega'];			
			var index = sizes.indexOf(size);
			for(var i=index; i<sizes.length; i++) {
				for(var j=0; j<images.length; j++) {
					if(images[j].size == size) return images[j]['#text'];
				}
			}
			for(var i=index-1; i>=0; i--) {
				for(var j=0; j<images.length; j++) {
					if(images[j].size == size) return images[j]['#text'];
				}
			}
			return '';
		}

		//////////////////////
		// Search for songs //
		//////////////////////
		this.searchSongs = function(text, callback) {
			var database = null;
			var lastFM = null;
			function complete() {
				if(database !== null && lastFM !== null) callback(combineItems(lastFM, database));
			}
			
			$.getJSON(location.origin + '/search/songs?text=' + encodeURIComponent(text), function (data) {
				database = data;
				complete();
			});
			
			$.getJSON(lastFM_buildURL('track.search', {limit:filter_maxResults, track:text}), function (data) {
				lastFM = [];
				for(var i=0; i<data.results.trackmatches.track.length; i++) {
					var track = data.results.trackmatches.track[i];
					var art = lastFM_getImage(track.image, 'extralarge');
					if( (!filter_requireMBID || track.mbid) && (!filter_requireArt || art) && (track.listeners > filter_minListeners) ) {
						lastFM.push(buildSong(null, track.name, track.artist, art, null, null, null));
					}
				}
				complete();
			});
		}
		
		///////////////////////
		// Search for albums //
		///////////////////////
		this.searchAlbums = function(text, callback) {
			var database = null;
			var lastFM = null;
			function complete() {
				if(database !== null && lastFM !== null) callback(combineItems(lastFM, database));
			}
			
			$.getJSON(location.origin + '/search/albums?text=' + encodeURIComponent(text), function (data) {
				database = data;
				complete();
			});
			
			$.getJSON(lastFM_buildURL('album.search', {limit:filter_maxResults, album:text}), function (data) { 
				lastFM = [];
				for(var i=0; i<data.results.albummatches.album.length; i++) {
					var album = data.results.albummatches.album[i];
					var art = lastFM_getImage(album.image, 'extralarge');
					var artIcon = lastFM_getImage(album.image, 'medium');
					if( (!filter_requireMBID || album.mbid) && (!filter_requireArt || art) ) {
						lastFM.push(buildAlbum(album.artist, null, album.name, art, artIcon, null));
					}
				}
				complete();
			});
		}
		
		////////////////////////
		// Search for artists //
		////////////////////////
		this.searchArtists = function(text, callback) {
			var database = null;
			var lastFM = null;
			function complete() {
				if(database !== null && lastFM !== null) callback(combineItems(lastFM, database));
			}
			
			$.getJSON(location.origin + '/search/artists?text=' + encodeURIComponent(text), function (data) {
				database = data;
				complete();
			});
			
			$.getJSON(lastFM_buildURL('artist.search', {limit:filter_maxResults, artist:text}), function (data) { 
				lastFM = [];
				for(var i=0; i<data.results.artistmatches.artist.length; i++) {
					var artist = data.results.artistmatches.artist[i];
					var art = lastFM_getImage(artist.image, 'extralarge');
					if( (!filter_requireMBID || artist.mbid) && (!filter_requireArt || art) && (artist.listeners > filter_minListeners) ) {
						lastFM.push(buildArtist(artist.name, art, null));
					}
				}
				complete();
			});
		}
		
		//////////////////////////
		// Search for playlists //
		//////////////////////////
		this.searchPlaylists = function(text, callback) {
			var params = {};
			if(text) params.text = text;
			$.getJSON(common_addURLParams(location.origin + '/search/playlists', params), function (data) {
				callback(data);
			});
		}
		
		//////////////////////
		// Get song details //
		//////////////////////
		var songDetailsFunction = function(songs, callback) {
			if(!songs.length){
				callback([]);
			} else {
				$.postJSON(location.origin + '/details/songs', songs, function(data) {
					callback(combineItems(songs, data));
				});
			}
		}
		this.songDetails = songDetailsFunction;
		
		///////////////////////
		// Get album details //
		///////////////////////
		var albumDetailsFunction = function(album, callback, databaseAlbum) {
			var database = null;
			var lastFM = null;
			function complete() {
				if(database !== null && lastFM !== null) {
					if(database.album && lastFM.album) {
						database.songs = combineItems(lastFM.songs, database.songs);
						callback(database);	
					} else if(database.album) {
						callback(database);	
					} else if(lastFM.album) {
						callback(lastFM);
					} else {
						album.songs = [];
						callback(album);
					}
				}
			}
			
			if(databaseAlbum) {
				database = databaseAlbum;
			} else {
				$.postJSON(location.origin + '/details/albums', [album], function(data) {
					if(data.length) {
						database = data[0];
					} else {
						database = {};
					}
					complete();
				});
			}
			
			$.getJSON(lastFM_buildURL('album.getInfo', {artist:album.artist, album:album.album}), function (data) {
				if(data.album) {
					var art = lastFM_getImage(data.album.image, 'extralarge');
					var artIcon = lastFM_getImage(data.album.image, 'medium');
					var songs = [];
					for(var t in data.album.tracks.track) {
						var track = data.album.tracks.track[t];
						songs.push(buildSong(null, track.name, track.artist.name, null, album.album, art, artIcon));
					}
					songDetailsFunction(songs, function(songDetails) {
						lastFM = buildAlbum(data.album.artist, null, data.album.name, art, artIcon, songDetails);
						complete();
					});
				} else {
					lastFM = {};
					complete();
				}
			});
		}
		this.albumDetails = albumDetailsFunction;
		
		////////////////////////
		// Get artist details //
		////////////////////////
		var artistDetailsFunction = function(artist, callback) {
			var database = null;
			var lastFM = null;
			function complete() {
				if(database !== null && lastFM !== null) {
					var artist = artist;
					var albums = [];
					var databaseAlbums = [];
					if(database.artist && lastFM.artist) {
						artist = database;
						albums = combineItems(lastFM.albums, database.albums);
						databaseAlbums = database.albums;
					} else if(database.artist) {
						artist = database;
						albums = database.albums;
						databaseAlbums = database.albums;
					} else if(lastFM.artist) {
						artist = lastFM;
						albums = lastFM.albums;
					} 
					
					// Get album details
					var completeAlbums = [];
					var count = albums.length;
					function complete(albumDetails) {
						if(!filter_requireSongs || albumDetails.songs.length > 0) {
							completeAlbums.push(albumDetails);
						}
						if((--count) <= 0) {
							artist.albums = completeAlbums;
							callback(artist);
						} 
					}
					for(var a in albums) {
						var databaseAlbum = null;
						for(var d in databaseAlbums) {
							if(databaseAlbums[d].album == albums[a].album) {
								databaseAlbum = databaseAlbums[d];
								break;
							}
						}
						albumDetailsFunction(albums[a], function(albumDetails) {
							complete(albumDetails);
						}, databaseAlbum);
					}
				}
			}
			
			$.postJSON(location.origin + '/details/artists', [artist], function(data) {
				if(data.length) {
					database = data[0];
				} else {
					database = {};
				}
				complete();
			});
			
			$.getJSON(lastFM_buildURL('artist.getTopAlbums', {limit:filter_maxResults, artist:artist.artist}), function (data) {
				if(data.topalbums) {
					var albums = [];
					for(var a in data.topalbums.album) {
						var album = data.topalbums.album[a];
						var art = lastFM_getImage(album.image, 'extralarge');
						var artIcon = lastFM_getImage(album.image, 'medium');
						if( (!filter_requireMBID || album.mbid) && (!filter_requireArt || art) && (album.playcount > filter_minPlaycount) ) {
							albums.push(buildAlbum(artist.artist, artist.artistImg, album.name, art, artIcon, null));
						}
					}
					lastFM = buildArtist(artist.artist, artist.artistImg, albums);
					complete();
				} else {
					lastFM = {};
					complete();
				}
			});
		}
		this.artistDetails = artistDetailsFunction;
		
		////////////////////////
		// Get album for song //
		////////////////////////
		this.getAlbumForSong = function(title, artist, callback) {
			if(title && artist) {
				$.getJSON(lastFM_buildURL('artist.getTopAlbums', {limit:15, artist:artist}), function (data) {
					if(data.topalbums) {
						var count = data.topalbums.album.length;
						var foundAlbum = null;
						function complete(album) {
							if(album && !foundAlbum) {
								for(var t in album.tracks.track) {
									if(album.tracks.track[t].name.toLowerCase() == title.toLowerCase()) {
										foundAlbum = album;
										break;
									}
								}
							}
							if((--count) <= 0) {
								if(foundAlbum) {
									var art = lastFM_getImage(foundAlbum.image, 'extralarge');
									var artIcon = lastFM_getImage(foundAlbum.image, 'medium');
									callback(buildAlbum(foundAlbum.artist, null, foundAlbum.name, art, artIcon, null));
								} else {
									callback(null);
								}
							} 
						}
						for(var a in data.topalbums.album) {
							var album = data.topalbums.album[a];
							$.getJSON(lastFM_buildURL('album.getInfo', {album:album.name, artist:artist}), function (data) {
								complete(data.album);
							});
						}
					} else {
						callback(null);
					}
				});
			} else {
				callback(null);
			}
		}
		
		///////////////////
		// Get album art //
		///////////////////
		this.getAlbumArt = function(album, artist, callback) {
			if(album) {
				$.getJSON(lastFM_buildURL('album.getInfo', {album:album, artist:artist}), function (data) {
					if(data.album) {
						var art = lastFM_getImage(data.album.image, 'extralarge');
						var artIcon = lastFM_getImage(data.album.image, 'medium');
						callback(art, artIcon, data.album.name);
					} else {
						callback('', '');
					}
				});
			} else {
				callback('', '');
			}
		}
		
		//////////////////////
		// Get artist image //
		//////////////////////
		this.getArtistImage = function(artist, callback) {
			if(artist) {
				$.getJSON(lastFM_buildURL('artist.getInfo', {artist:artist}), function (data) {
					if(data.artist) {
						callback(lastFM_getImage(data.artist.image, 'extralarge'));
					} else {
						callback('');
					}
				});
			} else {
				callback('');
			}
		}
		
		///////////////
		// Save song //
		///////////////
		this.saveSong = function(song, callback) {
			$.postJSON(location.origin + '/song/save', adapter.cleanSong(song), function (data) {
				if(data.title !== undefined && data.artist !== undefined) {
					if(callback) callback(data);
				} else {
					if(callback) callback(null, beautifyError(data));
				}
			});
		}
		
		/////////////////
		// Delete song //
		/////////////////
		this.deleteSong = function(song, callback) {
			$.postJSON(location.origin + '/song/delete', adapter.cleanSong(song), function (data) {
				if(data.title !== undefined && data.artist !== undefined) {
					if(callback) callback(data);
				} else {
					if(callback) callback(null, beautifyError(data));
				}
			});
		}
		
		///////////////////
		// Save playlist //
		///////////////////
		this.savePlaylist = function(playlist, callback) {
			$.postJSON(location.origin + '/playlist/save', adapter.cleanPlaylist(playlist), function (data) {
				if(data.name !== undefined) {
					if(callback) callback(data);
				} else {
					if(callback) callback(null, beautifyError(data));
				}
			});
		}
		
		/////////////////////
		// Delete playlist //
		/////////////////////
		this.deletePlaylist = function(playlist, callback) {
			$.postJSON(location.origin + '/playlist/delete', adapter.cleanPlaylist(playlist), function (data) {
				if(data.name !== undefined) {
					if(callback) callback(data);
				} else {
					if(callback) callback(null, beautifyError(data));
				}
			});
		}
		
		///////////////////////////
		// Get Visuals Supported //
		///////////////////////////
		this.getVisualsSupported = function(callback) {
			$.getJSON(location.origin + '/visuals/supported', function (data) {
				callback(data);
			});
		}
		
		/////////////////
		// Get Visuals //
		/////////////////
		this.getVisuals = function(songId, callback) {
			$.getJSON(location.origin + '/visuals/get/' + songId, function (data) {
				if(data.songId) {
					callback(data);
				} else {
					callback(null, beautifyError(data));
				}
			});
		}
		
		//////////////////
		// Save Visuals //
		//////////////////
		this.saveVisuals = function(visuals, callback) {
			$.postJSON(location.origin + '/visuals/save', adapter.cleanVisual(visuals), function (data) {
				if(data.songId !== undefined) {
					if(callback) callback(data);
				} else {
					if(callback) callback(null, beautifyError(data));
				}
			});
		}
		
		////////////////////
		// Delete Visuals //
		////////////////////
		this.deleteVisuals = function(visuals, callback) {
			$.getJSON(location.origin + '/visuals/delete/' + visuals.songId, function (data) {
				if(data.songId) {
					callback(data);
				} else {
					callback(null, beautifyError(data));
				}
			});
		}
		
		/////////////////////
		// Get Art Uploads //
		/////////////////////
		this.getArtUploads = function(callback) {
			$.getJSON(location.origin + '/art/collection', function (data) {
				if(data && data.length) {
					callback(data);
				} else {
					callback([]);
				}
			});
		}
		
	});
}());