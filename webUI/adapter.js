(function () {
    var app = angular.module('App')
	app.service('adapter', function() {
		
		this.cleanSong = function(song) {
			var clean = {
				id: song.id ? song.id : null,
				tag: song.tag ? song.tag : '',
				title: song.title ? song.title : '',
				artist: song.artist ? song.artist : '',
				artistImg: song.artistImg ? song.artistImg : '',
				album: song.album ? song.album : '',
				albumArt: song.albumArt ? song.albumArt : '',
				albumArtIcon: song.albumArtIcon ? song.albumArtIcon : ''
			};
			return clean;
		}
		
		this.cleanSongs = function(songs) {
			for(var i=0; i<songs.length; i++) songs[i] = this.cleanSong(songs[i]);
			return songs;
		}
		
		this.cleanAlbum = function(album) {
			var clean = {
				artist: album.artist ? album.artist : '',
				artistImg: album.artistImg ? album.artistImg : '',
				album: album.album ? album.album : '',
				albumArt: album.albumArt ? album.albumArt : '',
				songs: []
			};
			if(album.songs) {
				for(var i=0; i<album.songs.length; i++) {
					clean.songs.push(this.cleanSong(album.songs[i]));
				}
			}
			return clean;
		}
		
		this.cleanArtist = function(artist) {
			var clean = {
				artist: artist.artist ? artist.artist : '',
				artistImg: artist.artistImg ? artist.artistImg : '',
				albums: []
			};
			if(artist.albums) {
				for(var i=0; i<artist.albums.length; i++) {
					clean.albums.push(this.cleanAlbum(artist.albums[i]));
				}
			}
			return clean;
		}
		
		this.cleanPlaylist = function(playlist) {
			var clean = {
				id: playlist.id ? playlist.id : null,
				name: playlist.name ? playlist.name : '',
				songs: []
			};
			if(playlist.songs) {
				for(var i=0; i<playlist.songs.length; i++) {
					clean.songs.push(this.cleanSong(playlist.songs[i]));
				}
			}
			return clean;
		}
		
		this.cleanVisual = function(visual) {
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
		
	});
}());