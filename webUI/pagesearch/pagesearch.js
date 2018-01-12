(function () {
    var app = angular.module('App')
	app.directive('pagesearch', function ($mdBottomSheet, editdetails, selectplaylist, notification, playcontrols, connector) {					
		function link($scope, element, attrs) {	
			$scope.$parent.toolbarText = "Search for Music";
			$scope.searchFilter = $scope.$parent.searchFilter;
			$scope.searchText = '';
			$scope.songsSearching = false;
			$scope.albumsSearching = false;
			$scope.artistsSearching = false;
			$scope.songs = [];
			$scope.albums = [];
			$scope.artists = [];
			
			// New Search
			$scope.onSearch = function(ev) {
				$scope.searchText = $scope.searchFilter.text;
				if(ev) {
					var inputs = ev.srcElement.getElementsByTagName('input');
					for(var i=0; i<inputs.length; i++) {
						inputs[i].blur();
					}
				}
				
				$scope.songs = [];
				if($scope.searchFilter.text) {
					$scope.songsSearching = true;
					connector.searchSongs($scope.searchFilter.text, function(songs) {
						if(songs && songs.length > 0) {
							connector.songDetails(songs, function(songDetails) {
								$scope.songsSearching = false;
								$scope.songs = songDetails;
							});
						} else {
							$scope.songsSearching = false;
							$scope.songs = songs;
						}
					});
				}
				
				$scope.albums = [];
				if($scope.searchFilter.text) {
					$scope.albumsSearching = true;
					connector.searchAlbums($scope.searchFilter.text, function(albums) {
						$scope.albumsSearching = false;
						$scope.albums = albums;
					});
				}
				
				$scope.artists = [];
				if($scope.searchFilter.text) {
					$scope.artistsSearching = true;
					connector.searchArtists($scope.searchFilter.text, function(artists) {
						$scope.artistsSearching = false;
						$scope.artists = artists;
					});
				}
			}
			$scope.onSearch();
			
			// Play song
			$scope.playSong = function(item) {
				if(item.tag) {
					playcontrols.playSong(item);
				} else {
					editdetails.selectStreamTemplate(element[0].getElementsByClassName('pagesearchMain')[0], 'Select a stream to play', item, function(song) {
						for(var i in song) item[i] = song[i];
						playcontrols.playSong(song);
					});
				}
			};
			
			// Edit song
			$scope.editSong = function(item) {
				editdetails.editSongTemplate(element[0].getElementsByClassName('pagesearchMain')[0], item, function(song) {
					for(var i in song) item[i] = song[i];
				});
			};
			
			// Clear song
			$scope.clearSong = function(item) {
				notification.confirm('Clear song details?', 'Clear', function() {
					connector.deleteSong(item, function(song, err) {
						if(err) {
							notification.error('Error Clearing Song', err);
						}else {
							item.tag = '';
							item.id = '';
						}
					});
				});
			};
			
			// Add to Playlist
			$scope.addToPlaylist = function(item) {
				selectplaylist.open({
					parent: element[0].getElementsByClassName('pagesearchMain')[0],
					onSelectPlaylist: function(playlist) {
						if(item.tag) {
							playlist.songs.push(item);
							connector.savePlaylist(playlist, function(playlist, err) {
								if(err) notification.error('Error Saving Playlist', err);
							});
						} else {
							editdetails.selectStreamTemplate(element[0].getElementsByClassName('pagesearchMain')[0], 'Select a stream', item, function(song) {
								for(var i in song) item[i] = song[i];
								playlist.songs.push(song);
								connector.savePlaylist(playlist, function(playlist, err) {
									if(err) notification.error('Error Saving Playlist', err);
								});
							});
						}
					}
				});
			}
			
			// Add to Queue
			$scope.addToQueue = function(item) {
				if(item.tag) {
					playcontrols.queueAdd(item);
				} else {
					editdetails.selectStreamTemplate(element[0].getElementsByClassName('pagesearchMain')[0], 'Select a stream', item, function(song) {
						for(var i in song) item[i] = song[i];
						playcontrols.queueAdd(item);
					});
				}
			}
			
			// LastFM link
			$scope.lastFM = function(item) {
				if(item && item.artist && item.album) {
					window.open("http://www.last.fm/music/" + item.artist + "/" + item.album);
				} else if(item && item.artist) {
					window.open("http://www.last.fm/music/" + item.artist);
				} else {
					window.open("http://www.last.fm");
				}
			}
			
			// Show artist details bottom sheet
			$scope.showArtistBottomSheet = function(artist) {
				var playSong = $scope.playSong;
				var editSong = $scope.editSong;
				var clearSong = $scope.clearSong;
				var addToPlaylist = $scope.addToPlaylist;
				var addToQueue = $scope.addToQueue;
				var lastFM = $scope.lastFM;
				$mdBottomSheet.show({
					templateUrl: 'bottom-sheet-artist.html',
					parent: element[0].getElementsByClassName('pagesearchMain'),
					controller: function($scope){
						$scope.artist = artist;
						$scope.playSong = playSong;
						$scope.editSong = editSong;
						$scope.clearSong = clearSong;
						$scope.addToPlaylist = addToPlaylist;
						$scope.addToQueue = addToQueue;
						$scope.lastFM = lastFM;
						$scope.close = function() {
							$mdBottomSheet.hide();
						}
						
						$scope.albumsSearching = true;
						connector.artistDetails(artist, function(artistDetails) {
							$scope.albumsSearching = false;
							$scope.artist.albums = artistDetails.albums;
						});
					}
				});
			};
			
			// Show album details bottom sheet
			$scope.showAlbumBottomSheet = function(album) {
				var playSong = $scope.playSong;
				var editSong = $scope.editSong;
				var clearSong = $scope.clearSong;
				var addToPlaylist = $scope.addToPlaylist;
				var addToQueue = $scope.addToQueue;
				var lastFM = $scope.lastFM;
				$mdBottomSheet.show({
					templateUrl: 'bottom-sheet-album.html',
					parent: element[0].getElementsByClassName('pagesearchMain'),
					controller: function($scope){
						$scope.album = album;
						$scope.playSong = playSong;
						$scope.editSong = editSong;
						$scope.clearSong = clearSong;
						$scope.addToPlaylist = addToPlaylist;
						$scope.addToQueue = addToQueue;
						$scope.lastFM = lastFM;
						$scope.close = function() {
							$mdBottomSheet.hide();
						}
						
						$scope.songsSearching = true;
						connector.albumDetails(album, function(albumDetails) {
							$scope.songsSearching = false;
							$scope.album.songs = albumDetails.songs;
						});
					}
				});
			};
		}
        return {
			templateUrl: 'webUI/pagesearch/pagesearch.html',
			link: link
        };
    });
}());