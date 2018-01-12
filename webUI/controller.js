var app = angular.module('App', ['ngMaterial', "ngRoute"]);
app.config(function($routeProvider) {
	$routeProvider
	.when("/search", {
        template: '<pagesearch/>'
	})
	.when("/playlists", {
        template: '<pageplaylists/>'
	})
	.when("/settings", {
        template: '<pagesettings/>'
	})
	.otherwise({
        redirectTo: '/search'
    });
});
app.controller('AppCtrl', function($scope, $mdSidenav, resize) {	
	$scope.toolbarText = "Menu";
	$scope.searchFilter = {
		text: "",
		song: true,
		album: true,
		artist: true
	}
	
	// SideBar
	var leftWidth = document.getElementById('leftSide').style.width;
	var rightWidth = document.getElementById('rightSide').style.width;
	$scope.isDesktop = resize.isDesktop();
	if($scope.isDesktop) {
		$scope.leftSide = leftWidth;
		$scope.rightSide = rightWidth;
	} else {
		$scope.leftSide = '0px';
		$scope.rightSide = '0px';
	}
	resize.onModeChange(function(isDesktop) {
		$scope.isDesktop = isDesktop;
		if(isDesktop) {
			$scope.leftSide = leftWidth;
			$scope.rightSide = rightWidth;
			$mdSidenav('left').close();
			$mdSidenav('right').close();
		} else {
			$scope.leftSide = '0px';
			$scope.rightSide = '0px';
		}
		$scope.$apply();
	});
	$scope.toggleLeft = buildToggler('left');
	$scope.toggleRight = buildToggler('right');
    function buildToggler(navID) {
      return function() {
        $mdSidenav(navID).toggle();
      }
    }
});
