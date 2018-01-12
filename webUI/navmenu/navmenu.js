(function () {
    var app = angular.module('App')
	app.directive('navmenu', function ($mdSidenav) {
		function link($scope, element, attrs) {	
			
			$scope.search = function(sub) {
				if(sub == 'song') { $scope.$parent.searchFilter.song = true; $scope.$parent.searchFilter.album = false; $scope.$parent.searchFilter.artist = false; }
				else if(sub == 'album') { $scope.$parent.searchFilter.song = false; $scope.$parent.searchFilter.album = true; $scope.$parent.searchFilter.artist = false; }
				else if(sub == 'artist') { $scope.$parent.searchFilter.song = false; $scope.$parent.searchFilter.album = false; $scope.$parent.searchFilter.artist = true; }
				else { $scope.$parent.searchFilter.song = true; $scope.$parent.searchFilter.album = true; $scope.$parent.searchFilter.artist = true; }
				location.hash = "#/search";
				$mdSidenav('left').close();
			};
			
			$scope.playlists = function() {
				location.hash = "#/playlists";
				$mdSidenav('left').close();
			};
			
			$scope.settings = function() {
				location.hash = "#/settings";
				$mdSidenav('left').close();
			};
		
		}
        return {
			templateUrl: 'webUI/navmenu/navmenu.html',
			scope: {},
			link: link
        };
    });
}());