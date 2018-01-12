(function () {
    var app = angular.module('App')
	app.service('resize', function($window) {
		var desktopWidth = 1280;
		
		var isDesktop = ($window.innerWidth >= desktopWidth);
		this.isDesktop = function() {
			return isDesktop;
		}
		
		var onResizeFunctions = [];
		this.onResize = function(onResizeFunction, scope) {
			var scopeId = undefined;
			if(scope) {
				scopeId = scope.$id;
				scope.$on('$destroy', cleanSubscriptions);
			}
			onResizeFunctions.push({func:onResizeFunction, scopeId:scopeId});
		}
		
		var onModeChangeFunctions = [];
		this.onModeChange = function(onModeChangeFunction, scope) {
			var scopeId = undefined;
			if(scope) {
				scopeId = scope.$id
				scope.$on('$destroy', cleanSubscriptions);
			}
			onModeChangeFunctions.push({func:onModeChangeFunction, scopeId:scopeId});
		}
		
		function cleanSubscriptions(ev) {
			for(var i=0; i<onResizeFunctions.length;) {
				if(onResizeFunctions[i].scopeId === ev.currentScope.$id) onResizeFunctions.splice(i,1);
				else i++;
			}
			for(var i=0; i<onModeChangeFunctions.length;) {
				if(onModeChangeFunctions[i].scopeId === ev.currentScope.$id) onModeChangeFunctions.splice(i,1);
				else i++;
			}
		}
		
		angular.element($window).on('resize', function() {
			var width = $window.innerWidth;
			for(var i in onResizeFunctions) onResizeFunctions[i].func(width);
			
			var oldIsDesktop = isDesktop;
			isDesktop = (width >= desktopWidth);
			if(oldIsDesktop != isDesktop) {
				for(var i in onModeChangeFunctions) onModeChangeFunctions[i].func(isDesktop);
			}
		});
	});
}());