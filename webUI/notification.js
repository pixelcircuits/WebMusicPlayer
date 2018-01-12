(function () {
    var app = angular.module('App')
	app.service('notification', function($mdToast, $mdDialog) {
		
		this.error = function(text, subtext, parent) {
			if(!parent) parent = document.getElementById("mainView");
			$mdToast.show({
				parent: parent,
				template: '<md-toast class="md-toast toastError"><div layout="column"><div layout="row"><b>' + text + '</b></div><div layout="row">' + subtext + '</div></div></md-toast>',
				hideDelay: 6000,
				position: 'top right'
			});
		}
		
		this.info = function(text, subtext, parent) {
			if(!parent) parent = document.getElementById("mainView");
			$mdToast.show({
				parent: parent,
				template: '<md-toast class="md-toast toastNotification"><div layout="column"><div layout="row"><b>' + text + '</b></div>' + subtext + '</div></md-toast>',
				hideDelay: 4000,
				position: 'top right'
			});
		}
		
		this.confirm = function(description, action, onAction, onCancel, parent) {
			if(!parent) parent = document.getElementById("mainView");
			var confirm = $mdDialog.confirm()
				.parent(parent)
				.title(description)
				.ok(action)
				.cancel('Cancel');
			$mdDialog.show(confirm).then(onAction, onCancel);
		}
		
		this.prompt = function(description, option1, option2, onOption1, onOption2, parent) {
			if(!parent) parent = document.getElementById("mainView");
			var confirm = $mdDialog.confirm()
				.parent(parent)
				.title(description)
				.ok(option1)
				.cancel(option2)
				.hasBackdrop(false);
			$mdDialog.show(confirm).then(onOption1, onOption2);
		}
		
	});
}());