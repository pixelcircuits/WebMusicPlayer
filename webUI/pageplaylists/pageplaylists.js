(function () {
    var app = angular.module('App')
	app.directive('pageplaylists', function ($mdBottomSheet, editdetails, selectplaylist, resize, notification, playcontrols, connector) {	
		function getImagesForPlaylist(playlist) {
			var images = [];
			for(var s in playlist.songs) {
				var art = playlist.songs[s].albumArtIcon;
				if(art && images.indexOf(art)<0) {
					images.push(art);
					if(images.length >= 4) break;
				}
			}
			if(images.length == 0) {
				images.push('webUI/alt.png');
			}
			return images;
		}
	
		function link($scope, element, attrs) {	
			$scope.$parent.toolbarText = "Manage Playlists";
			$scope.isDesktop = resize.isDesktop();
			resize.onModeChange(function(isDesktop) {
				$scope.isDesktop = isDesktop;
				$scope.$apply();
			}, $scope);
			
			$scope.playlist = {};
			$scope.playlists = [];
			$scope.playlistsSearching = true;
			connector.searchPlaylists(null, function(playlists) {
				$scope.playlistsSearching = false;
				for(var p in playlists) playlists[p].imgs = getImagesForPlaylist(playlists[p]);
				$scope.playlists = playlists.sort(function(a, b) {
					return a.name.trim().toLowerCase().localeCompare(b.name.trim().toLowerCase());
				});;
			});
			
			$scope.newPlaylist = function() {
				selectplaylist.open({
					parent: element[0].getElementsByClassName('pageplaylistsMain')[0],
					isCreateMode: true,
					onSelectPlaylist: function(playlist) {
						var playlists = [];
						for(var p in $scope.playlists) playlists.push($scope.playlists[p]);
						playlists.push(playlist);
						
						$scope.playlists = playlists.sort(function(a, b) {
							return a.name.trim().toLowerCase().localeCompare(b.name.trim().toLowerCase());
						});
					}
				});
			}
			
			$scope.editPlaylist = function(index) {
				var playlist = $scope.playlists[index];
				selectplaylist.open({
					parent: element[0].getElementsByClassName('pageplaylistsMain')[0],
					isEditMode: true,
					playlist: playlist,
					onSelectPlaylist: function(playlist) {
						$scope.playlists[index] = playlist;
						$scope.playlists.sort(function(a, b) {
							return a.name.trim().toLowerCase().localeCompare(b.name.trim().toLowerCase());
						});
					}
				});
			}
			
			$scope.deletePlaylist = function(index) {
				notification.confirm('Delete playlist?', 'Delete', function() {
					connector.deletePlaylist($scope.playlists[index], function(playlist, err) {
						if(err) {
							notification.error('Error Saving Playlist', err);
						} else {
							$scope.playlists.splice(index, 1);
						}
					});
				});
			}
			
			$scope.playPlaylist = function(index) {
				var playlist = $scope.playlists[index];
				if(playlist.songs && playlist.songs.length) {
					playcontrols.queueSet(playlist.songs);
					playcontrols.playSong(playlist.songs[0]);
				}
			}
			
			$scope.addToPlaylist = function(playlist) {
				editdetails.addSongTemplate(element[0].getElementsByClassName('pageplaylistsMain')[0], function(song) {
					playlist.songs.push(song);
					playlist.imgs = getImagesForPlaylist(playlist);
					connector.savePlaylist(playlist, function(playlist, err) {
						if(err) notification.error('Error Saving Playlist', err);
					});
				});
			}
			
			$scope.removeFromPlaylist = function(playlist, index) {
				notification.confirm('Remove song from playlist?', 'Remove', function() {
					playlist.songs.splice(index, 1);
					playlist.imgs = getImagesForPlaylist(playlist);
					connector.savePlaylist(playlist, function(playlist, err) {
						if(err) notification.error('Error Saving Playlist', err);
					});
				});
			}
			
			$scope.addToQueue = function(item) {
				playcontrols.queueAdd(item);
			}
			
			$scope.playSong = function(item) {
				playcontrols.playSong(item);
			}
			
			$scope.editSong = function(item) {
				editdetails.editSongTemplate(element[0].getElementsByClassName('pageplaylistsMain')[0], item, function(song) {
					for(var i in song) item[i] = song[i];
					$scope.playlist.imgs = getImagesForPlaylist($scope.playlist);
				});
			}
			
			$scope.selectedIndex = -1;
			$scope.selectPlaylist = function(index) {
				var playlist = $scope.playlists[index];
				$scope.selectedIndex = index;
				$scope.playlist = playlist;	
				
				if(!$scope.isDesktop) {
					var removeFromPlaylist = $scope.removeFromPlaylist;
					var addToPlaylist = $scope.addToPlaylist;
					var addToQueue = $scope.addToQueue;
					var playSong = $scope.playSong;
					var editSong = $scope.editSong;
					$mdBottomSheet.show({
						templateUrl: 'bottom-sheet-playlist.html',
						parent: element[0].getElementsByClassName('pageplaylistsMain'),
						controller: function($scope){
							$scope.removeFromPlaylist = removeFromPlaylist;
							$scope.addToPlaylist = addToPlaylist;
							$scope.addToQueue = addToQueue;
							$scope.playSong = playSong;
							$scope.editSong = editSong;
							$scope.playlist = playlist;
							$scope.close = function() {
								$mdBottomSheet.hide();
							}
						}
					});
				}
			}
		}
        return {
			templateUrl: 'webUI/pageplaylists/pageplaylists.html',
			link: link
        };
    });
}());