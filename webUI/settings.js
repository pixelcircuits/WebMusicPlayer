(function () {
    var app = angular.module('App')
	app.service('settings', function(websockets) {
		
		// POST REST request
		jQuery["postJSON"] = function(url, data, callback) {
			$.ajax({url: url, type: "POST", data: JSON.stringify(data), contentType:"application/json; charset=utf-8", dataType:"json", success: callback});
		}
		
		//////////////
		// Shutdown //
		//////////////
		this.shutdown = function() {
			$.getJSON(location.origin + '/settings/shutdown');
		}
		
		//////////////
		// Settings //
		//////////////
		this.getSettings = function(callback) {
			$.getJSON(location.origin + '/settings/get', callback);
		}
		this.setSettings = function(settings) {
			$.postJSON(location.origin + '/settings/set', settings);
		}
		this.setVolumeSetting = function(volume) {
			var settings = {
				audioVolume: volume
			}
			$.postJSON(location.origin + '/settings/set', settings);
		}

		///////////////
		// Bluetooth //
		///////////////
		var bluetoothIsScanning = false;
		var bluetoothDevices = [];
		var bluetoothStatus = {};
		websockets.subscribe("BluetoothEndScan", function(data) {
			bluetoothIsScanning = false;
		});
		websockets.subscribe("BluetoothDevices", function(data) {
			bluetoothDevices = data;
		});
		websockets.subscribe("BluetoothStatus", function(data) {
			bluetoothStatus = data;
		});
		
		this.bluetoothScan = function() {
			bluetoothIsScanning = true;
			$.getJSON(location.origin + '/bluetooth/scan');
		}
		this.bluetoothGetIsScanning = function() {
			return bluetoothIsScanning;
		}
		this.bluetoothGetDevices = function() {
			return bluetoothDevices;
		}
		this.bluetoothGetStatus = function(callback, refresh) {
			if(refresh) {
				$.getJSON(location.origin + '/bluetooth/status', function(data){
					bluetoothStatus = data
					callback(data);
				});
			} else {
				callback(bluetoothStatus);
			}
		}
		
	});
}());