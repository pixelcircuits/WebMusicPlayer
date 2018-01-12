(function () {
    var app = angular.module('App')
	app.service('editdetails', function($mdPanel, $mdDialog, plugins, notification, connector) {
		
		// Check if visuals are supported
		var visualsSupported = false;
		connector.getVisualsSupported(function(supported) {
			visualsSupported = supported;
		});
		
		// Wrapper function for quick selecting a song stream
		this.selectStreamTemplate = function(parent, action, song, editCallback) {
			var options = {
				selectedTab: 1,
				infoDisabled: true,
				actionButtonText: action,
				actionButtonDisabled: true,
				onStreamSelect: function(song, visuals, panel) {
					if(!song.title || !song.artist || !song.tag) {
						var items = [];
						if(!song.title) items.push('Title');
						if(!song.artist) items.push('Artist');
						if(!song.tag) items.push('Stream');
						notification.info('The following items need values...', items.join(', '), panel._panelEl[0]);
					} else {
						connector.saveSong(song, function(song, err) {
							if(err) {
								notification.error('Error Saving Song', err);
							} else {
								visuals.songId = song.id;
								connector.saveVisuals(visuals, function(visuals, err) {
									if(err) notification.error('Error Saving Song Visuals', err);
								});
								editCallback(song);
							}
						});
						panel.close();
					}
				}
			};
			if(parent) options.parent = parent;
			this.open(song, options);
		};
		
		// Wrapper function for quick editing a song
		this.editSongTemplate = function(parent, song, editCallback) {
			var options = {
				selectedTab: 0,
				actionButtonText: 'Save',
				onActionButtonClick: function(song, visuals, panel) {
					if(!song.title || !song.artist || !song.tag) {
						var items = [];
						if(!song.title) items.push('Title');
						if(!song.artist) items.push('Artist');
						if(!song.tag) items.push('Stream');
						notification.info('The following items need values...', items.join(', '), panel._panelEl[0]);
					} else {
						connector.saveSong(song, function(song, err) {
							if(err) {
								notification.error('Error Saving Song', err);
							} else {
								visuals.songId = song.id;
								connector.saveVisuals(visuals, function(visuals, err) {
									if(err) notification.error('Error Saving Song Visuals', err);
								});
								editCallback(song);
							}
						});
						panel.close();
					}
				}
			};
			if(parent) options.parent = parent;
			this.open(song, options);
		};
		
		// Wrapper function for quick adding a song
		this.addSongTemplate = function(parent, addCallback) {
			var options = {
				selectedTab: 0,
				actionButtonText: 'Add',
				onActionButtonClick: function(song, visuals, panel) {
					if(!song.title || !song.artist || !song.tag) {
						var items = [];
						if(!song.title) items.push('Title');
						if(!song.artist) items.push('Artist');
						if(!song.tag) items.push('Stream');
						notification.info('The following items need values...', items.join(', '), panel._panelEl[0]);
					} else {
						connector.saveSong(song, function(song, err) {
							if(err) {
								notification.error('Error Saving Song', err);
							} else {
								visuals.songId = song.id;
								connector.saveVisuals(visuals, function(visuals, err) {
									if(err) notification.error('Error Saving Song Visuals', err);
								});
								addCallback(song);
							}
						});
						panel.close();
					}
				}
			};
			if(parent) options.parent = parent;
			this.open(null, options);
		};
		
		// Main function for opening the editdetails window
		this.open = function(song, options) {
			if(!song) song = {};
			else song = JSON.parse(JSON.stringify(song));
			
			var selectedTab = 0;
			var infoDisabled = false;
			var actionButtonText = 'Action';
			var actionButtonDisabled = false;
			if(options.selectedTab !== undefined) selectedTab = options.selectedTab;
			if(options.infoDisabled !== undefined) infoDisabled = options.infoDisabled;
			if(options.actionButtonText !== undefined) actionButtonText = options.actionButtonText;
			if(options.actionButtonDisabled !== undefined) actionButtonDisabled = options.actionButtonDisabled;
			
			var globalScope = null;
			var controller = function(mdPanelRef, $scope){
				globalScope = $scope;
				$scope.visualsSupported = visualsSupported;
				$scope.visuals = {
					background: "Video",
					foreground: "Wave",
					colorIndex: 0,
					colors: [{ 
						color1:[237,15,15], color2:[9,142,142], color3:[152,221,14]
					},{
						color1:[237,163,15], color2:[60,28,163], color3:[9,142,142]
					},{
						color1:[195,229,15], color2:[210,13,76], color3:[81,23,161]
					},{
						color1:[12,184,33], color2:[237,119,15], color3:[193,12,108]
					},{
						color1:[26,66,159], color2:[237,199,15], color3:[237,116,15]
					},{
						color1:[102,19,159], color2:[160,223,14], color3:[237,195,15]
					}]
				};
				$scope.getFiltersForColor = function(rgb) {
					function equal(color) {
						return (rgb[0] == color[0] && rgb[1] == color[1] && rgb[2] == color[2]);
					}
					var filter = "";
					
					//red
					if(equal($scope.visuals.colors[0].color1)) filter =  "hue-rotate(0deg) brightness(1.0)";
					else if(equal($scope.visuals.colors[0].color2)) filter =  "hue-rotate(177deg) brightness(1.4)";
					else if(equal($scope.visuals.colors[0].color3)) filter =  "hue-rotate(80deg) brightness(2.5)";
					
					//orange
					else if(equal($scope.visuals.colors[1].color1)) filter =  "hue-rotate(55deg) brightness(2.5)";
					else if(equal($scope.visuals.colors[1].color2)) filter =  "hue-rotate(257.222deg) brightness(1.3)";
					else if(equal($scope.visuals.colors[1].color3)) filter =  "hue-rotate(180deg) brightness(2.5)";
					 
					//yellow
					else if(equal($scope.visuals.colors[2].color1)) filter =  " hue-rotate(70.5327deg) brightness(2.8)";
					else if(equal($scope.visuals.colors[2].color2)) filter =  "hue-rotate(340.812deg) brightness(1.3)";
					else if(equal($scope.visuals.colors[2].color3)) filter =  "hue-rotate(265.217deg) brightness(2.5)";
					 
					//green
					else if(equal($scope.visuals.colors[3].color1)) filter =  "hue-rotate(127.326deg) brightness(1.5)";
					else if(equal($scope.visuals.colors[3].color2)) filter =  "hue-rotate(28.1081deg) brightness(2.5)";
					else if(equal($scope.visuals.colors[3].color3)) filter =  "hue-rotate(328.177deg) brightness(2.5)";
					
					//blue
					else if(equal($scope.visuals.colors[4].color1)) filter =  "hue-rotate(206.955deg) brightness(0.8)";
					else if(equal($scope.visuals.colors[4].color2)) filter =  "hue-rotate(65.7297deg) brightness(2.5)";
					else if(equal($scope.visuals.colors[4].color3)) filter =  "hue-rotate(27.2973deg) brightness(2.5)";
					
					//violet
					else if(equal($scope.visuals.colors[5].color1)) filter =  "hue-rotate(275.571deg) brightness(1.1)";
					else if(equal($scope.visuals.colors[5].color2)) filter =  "hue-rotate(74.0861deg) brightness(2.5)";
					else if(equal($scope.visuals.colors[5].color3)) filter =  "hue-rotate(48.6486deg) brightness(2.5)";
					     
					return {
						'filter': filter,
						'-webkit-filter': filter,
						'-moz-filter': filter,
						'-o-filter': filter,
						'-ms-filter': filter
					}
				};
				$scope.getVisuals = function() {
					var visuals = {};
					if(song && song.id) visuals.songId = song.id;

					if($scope.visuals.background == "None") visuals.background = 0;
					if($scope.visuals.background == "Video") visuals.background = 1;
					if($scope.visuals.background == "Album Art") visuals.background = 2;
					if($scope.visuals.background == "Gradient") visuals.background = 3;
					
					if($scope.visuals.foreground == "None") visuals.foreground = 0;
					if($scope.visuals.foreground == "Wave") visuals.foreground = 1;
					if($scope.visuals.foreground == "Wave (Stereo)") visuals.foreground = 2;
					if($scope.visuals.foreground == "Spectrum") visuals.foreground = 3;
					if($scope.visuals.foreground == "Spectrum (Stereo)") visuals.foreground = 4;
					
					visuals.color0 = $scope.visuals.colors[$scope.visuals.colorIndex].color1;
					visuals.color1 = $scope.visuals.colors[$scope.visuals.colorIndex].color2;
					visuals.color2 = $scope.visuals.colors[$scope.visuals.colorIndex].color3;
					
					return visuals;
				}
				if(song.id) {
					connector.getVisuals(song.id, function(visuals) {
						if(visuals.background == 0) $scope.visuals.background = "None";
						if(visuals.background == 1) $scope.visuals.background = "Video";
						if(visuals.background == 2) $scope.visuals.background = "Album Art";
						if(visuals.background == 3) $scope.visuals.background = "Gradient";
						
						if(visuals.foreground == 0) $scope.visuals.foreground = "None";
						if(visuals.foreground == 1) $scope.visuals.foreground = "Wave";
						if(visuals.foreground == 2) $scope.visuals.foreground = "Wave (Stereo)";
						if(visuals.foreground == 3) $scope.visuals.foreground = "Spectrum";
						if(visuals.foreground == 4) $scope.visuals.foreground = "Spectrum (Stereo)";
						
						for(var i=0; i<$scope.visuals.colors.length; i++) {
							var match = true;
							for(var j=0; j<3; j++) match &= ($scope.visuals.colors[i].color1[j] == visuals.color0[j]);
							for(var j=0; j<3; j++) match &= ($scope.visuals.colors[i].color2[j] == visuals.color1[j]);
							for(var j=0; j<3; j++) match &= ($scope.visuals.colors[i].color3[j] == visuals.color2[j]);
							if(match) {
								$scope.visuals.colorIndex = i;
								break;
							}
						}
					});
				}
				
				plugins.getPlugins(function(pluginList) {
					$scope.plugins = pluginList;
				}, true);
				$scope.selectedTab = selectedTab;
				$scope.infoDisabled = infoDisabled;
				$scope.actionButtonText = actionButtonText;
				$scope.actionButtonDisabled = actionButtonDisabled;
				if(song.title) $scope.windowTitle = song.title;
				else $scope.windowTitle = "Add Song";
				$scope.song = song;
				
				$scope.close = function() {
					mdPanelRef.close();
				};
				
				$scope.searchingAlbum = false;
				$scope.autoFillAlbum = function(keepText) {
					var albumDone = true;
					var artistDone = true;
					function complete() {
						if(albumDone && artistDone) {
							$scope.searchingAlbum = false;
						}
					}
					if(!song.album) {
						$scope.searchingAlbum = true;
						albumDone = false;
						connector.getAlbumForSong(song.title, song.artist, function(album) {
							albumDone = true;
							if(album) {
								song.album = album.album;
								song.albumArt = album.albumArt;
								song.albumArtIcon = album.albumArtIcon;
							}
							complete();
						});
					} else {
						$scope.searchingAlbum = true;
						albumDone = false;
						connector.getAlbumArt(song.album, song.artist, function(art, artIcon, album) {
							albumDone = true;
							if(art) {
								if(!keepText) song.album = album;
								song.albumArt = art;
								song.albumArtIcon = artIcon;
							} else if(!keepText) {
								song.albumArt = '';
								song.albumArtIcon = artIcon;
							}
							complete();
						});
					}
					if(!song.artistImg) {
						$scope.searchingAlbum = true;
						artistDone = false;
						connector.getArtistImage(song.artist, function(img) {
							artistDone = true;
							song.artistImg = img;
							complete();
						});
					}
				};
				if(!song.album || !song.albumArt || !song.artistImg) {
					$scope.autoFillAlbum(true);
				}
				$scope.clearArt = function() {
					song.albumArt = "";
					song.albumArtIcon = "";
				}
				$scope.selectArt = function() {
					connector.getArtUploads(function(files) {
						if(files && files.length) {
							$mdDialog.show({
								controller: function($scope, $mdDialog) {
									$scope.files = files;
									$scope.onSelect = function(file) {
										song.albumArt = file;
										song.albumArtIcon = file;
										$mdDialog.hide();
									};
								},
								templateUrl: 'image-select.html',
								parent: mdPanelRef._panelEl[0],
								clickOutsideToClose: true,
								hasBackdrop: false
							});
						}
					});
				}
				$scope.uploadArt = function() {
					var file = document.getElementById("uploadfile").files[0];
					function upload() {
						var formData = new FormData();
						formData.append("upload", file);
						var xhr = new XMLHttpRequest();
						xhr.open("post", "/art/upload", true);
						xhr.onload = function () {
							if(xhr.status == 200) {
								var art = xhr.response;
								song.albumArt = art;
								song.albumArtIcon = art;
							} else {
								notification.error('Error Uplaoding Art', xhr.response);
							}
						};
						xhr.send(formData);
					}
					if(file) {
						connector.getArtUploads(function(files) {
							var path = "";
							for(var i=0; i<files.length; i++) {
								var p = 'server/data/imgs/' + file.name;
								if(files[i] == p) {
									path = p;
									break;
								}
							}
							if(path) {
								notification.prompt("File already exists", "Overwrite", "Use Existing", function() {
									upload();
								}, function() {
									song.albumArt = path;
									song.albumArtIcon = path;
								}, mdPanelRef._panelEl[0]);
							} else {
								upload();
							}
						});
					}
					uploadfile.value = "";
				}
				
				$scope.onStreamSelect = function(stream) {
					song.tag = stream.tag;
					if(options.onStreamSelect !== undefined) options.onStreamSelect(song, $scope.getVisuals(), mdPanelRef);
				};
				
				$scope.onActionButtonClick = function() {
					if(options.onActionButtonClick !== undefined) options.onActionButtonClick(song, $scope.getVisuals(), mdPanelRef);
				};
				
				$scope.manualStream = {
					url: '',
					tag: '',
					bad: false,
					processing: false,
					description: 'Manually enter a URL to stream',
				};
				$scope.onManualStreamSelect = function() {
					$scope.manualStream.description = 'Validating...';
					$scope.manualStream.processing = true;
					plugins.verify($scope.plugins[$scope.selectedSource].name, $scope.manualStream.url, function(stream) {
						if(stream && stream.tag) {
							song.tag = stream.tag;
							if(options.onStreamSelect !== undefined) options.onStreamSelect(song, $scope.getVisuals(), mdPanelRef);
							$scope.manualStream.tag = stream.tag;
							$scope.manualStream.description = stream.text;
							$scope.manualStream.bad = false;
						} else {
							$scope.manualStream.description = 'Invalid URL!';
							$scope.manualStream.bad = true;
						}
						$scope.manualStream.processing = false;
					});
				}
				
				$scope.selectedSource = 0;
				$scope.streamsLoading = true;
				$scope.streams = [];
				$scope.onSourceSelect = function() {
					$scope.streamsLoading = true;
					$scope.streams = [];
					if($scope.plugins.length > 0) {
						plugins.search($scope.plugins[$scope.selectedSource].name, $scope.song, function(streams) {
							$scope.streamsLoading = false;
							$scope.streams = streams;
						});
					} else {
						$scope.noPlugins = true;
					}
				};
			};
			
			var config = {
				templateUrl: 'webUI/editdetails/editdetails.html',
				panelClass: 'editdetailsPanel',
				animation: $mdPanel.newPanelAnimation().withAnimation($mdPanel.animation.FADE),
				hasBackdrop: true,
				position: $mdPanel.newPanelPosition().absolute().center(),
				zIndex: 502,
				clickOutsideToClose: true,
				controller: controller,
				onDomRemoved: function() {
					globalScope.streams = [];
					globalScope = null;
				}
			};
			if(options.parent) {
				config.attachTo = options.parent;
				config.zIndex = 150;
			}
			$mdPanel.open(config);
		}
		
	});
}());