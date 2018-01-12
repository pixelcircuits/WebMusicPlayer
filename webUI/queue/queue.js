(function () {
    var app = angular.module('App')
	app.directive('queue', function (editdetails, playcontrols) {
		function link($scope, element, attrs) {
			$scope.repeat = playcontrols.getQueueRepeat();
			$scope.playing = playcontrols.getPlaying();
			$scope.queue = playcontrols.getQueue();
			playcontrols.onPlayingUpdate(function(playing) {
				$scope.playing = playing;
				$scope.$apply();
			}, $scope);
			playcontrols.onQueueUpdate(function(queue, repeat) {
				if(queue) $scope.queue = queue;
				$scope.repeat = repeat;
				$scope.$apply();
			}, $scope);
			
			$scope.shuffle = function() {
				playcontrols.queueShuffle();
			}
			$scope.queueRepeat = function(repeat) {
				playcontrols.queueRepeat(repeat);
			}
			$scope.play = function(item) {
				playcontrols.playSong(item);
			};
			$scope.remove = function(item) {
				playcontrols.queueRemove(item);
			}
			$scope.clear = function() {
				playcontrols.queueClear();
			}
			$scope.editSong = function(item) {
				editdetails.editSongTemplate(null, item, function(song) {
					for(var i in song) item[i] = song[i];
				});
			};
		}
        return {
			templateUrl: 'webUI/queue/queue.html',
			scope: { },
			link: link
        };
    });
}());