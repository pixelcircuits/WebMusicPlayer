(function () {
    var app = angular.module('App')
	app.service('selectplaylist', function($mdPanel, notification, connector) {
		
		this.open = function(options) {
			var selectText = "Select a Playlist";
			var createText = "Create New Playlist";
			var editText = "Edit Playlist Name";
			
			var isCreateMode = false;
			var isEditMode = false;
			var playlist = null;
			if(options.playlist !== undefined) playlist = options.playlist;
			if(options.isCreateMode !== undefined) isCreateMode = options.isCreateMode;
			if(options.isEditMode !== undefined) isEditMode = options.isEditMode;
		
			var playlistName = '';
			if(playlist) playlistName = playlist.name;
			if(isEditMode) isCreateMode = true;
			
			var controller = function(mdPanelRef, $scope) { 
				$scope.playlistName = playlistName;
				$scope.isCreateMode = isCreateMode;
				if(isEditMode) $scope.windowTitle = editText;
				else if(isCreateMode) $scope.windowTitle = createText;
				else $scope.windowTitle = selectText;
				if(isEditMode) $scope.actionText = "Save";
				else $scope.actionText = "Create";
				
				$scope.setCreateMode = function() {
					$scope.windowTitle = createText;
					$scope.isCreateMode = true;
					
					var playlistNameInput = document.getElementById('playlistNameInput');
					if(playlistNameInput) {
						window.setTimeout(function(){playlistNameInput.focus();}, 0);
					}
				}
				
				$scope.selectPlaylist = function(playlist) {
					mdPanelRef.close();
					var playlistCopy = JSON.parse(JSON.stringify(playlist));
					if(options.onSelectPlaylist) options.onSelectPlaylist(playlistCopy);
				};
				
				$scope.persistingPlaylist = false;
				$scope.savePlaylist = function() {
					if($scope.playlistName) {
						var newPlaylist = {};
						if(isEditMode) newPlaylist = playlist;
						newPlaylist.name = $scope.playlistName;
						
						$scope.persistingPlaylist = true;
						connector.savePlaylist(newPlaylist, function(playlist, err) {
							$scope.persistingPlaylist = false;
							if(err) {
								notification.error("Error Creating Playlist", err);
							} else {
								mdPanelRef.close();
								var playlistCopy = JSON.parse(JSON.stringify(playlist));
								if(options.onSelectPlaylist) options.onSelectPlaylist(playlistCopy);
							}
						});
					}
				};
				
				$scope.playlists = [];
				$scope.playlistsSearching = true;
				connector.searchPlaylists(null, function(playlists) {
					$scope.playlistsSearching = false;
					$scope.playlists = playlists;
				});
				
				$scope.close = function() {
					mdPanelRef.close();
				};
			};
			
			var config = {
				templateUrl: 'webUI/selectplaylist/selectplaylist.html',
				panelClass: 'selectplaylistPanel',
				animation: $mdPanel.newPanelAnimation().withAnimation($mdPanel.animation.FADE),
				hasBackdrop: true,
				position: $mdPanel.newPanelPosition().absolute().center(),
				zIndex: 150,
				clickOutsideToClose: true,
				controller: controller
			};
			if(options.parent) {
				config.attachTo = options.parent;
			}
			$mdPanel.open(config);
		}
		
	});
}());