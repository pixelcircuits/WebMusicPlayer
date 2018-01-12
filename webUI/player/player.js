(function () {
    var app = angular.module('App')
	app.directive('player', function (resize, editdetails, playcontrols) {
		function link($scope, element, attrs) {	
			$scope.isDesktop = resize.isDesktop();
			resize.onModeChange(function(isDesktop) {
				$scope.isDesktop = isDesktop;
				$scope.$apply();
			});
		
			$scope.playing = playcontrols.getPlaying();
			playcontrols.onPlayingUpdate(function(playing) {
				$scope.playing = playing;
				$scope.$apply();
			}, $scope);
			
			$scope.play = function() {
				playcontrols.playSong();
			};
			$scope.pause = function() {
				playcontrols.pauseSong();
			};
			$scope.stop = function() {
				playcontrols.stopSong();
			};
			$scope.seek = function(ev) {
				var x = ev.layerX;
				if(x < 0) x = (ev.target.offsetWidth + x);
				var s = (x/ev.target.offsetWidth)*100;
				playcontrols.seekSong(s);
			};	
			$scope.next = function() {
				playcontrols.queueNext();
			};	
			$scope.back = function() {
				playcontrols.queueBack();
			};
			$scope.editSong = function() {
				editdetails.editSongTemplate(null, $scope.playing, function(song) {
					for(var i in song) $scope.playing[i] = song[i];
					if($scope.playing.state == 'playing') playcontrols.playSong($scope.playing);
				});
			};
		}
        return {
			templateUrl: 'webUI/player/player.html',
			scope: {},
			link: link
        };
    });
}());