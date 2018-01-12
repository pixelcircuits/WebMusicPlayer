(function () {
    var app = angular.module('App')
	app.service('websockets', function($timeout) {
		var ws = null;
		var subscriptions = [];

		// Websocket publish and subscribe
		this.publish = function(key, payload) {
			if(ws && ws.readyState == 1) {
				var message = new Uint8Array(key.length + payload.length + 1);
				for(var i=0; i<key.length; i++) message[i] = key.charCodeAt(i);
				message[key.length] = 0;
				for(var i=0; i<payload.length; i++) message[key.length+i+1] = payload[i];
				
				ws.send(message);
			}
		}
		this.subscribe = function(key, callback) {
			subscriptions.push({
				key: key,
				callback: callback
			});
		}
		
		// Maintain websocket connection
		function maintainConnection() {
			if(ws) {
				if(ws.readyState == 3) {
					delete ws;
					ws = null;
				}
			} else {
				ws = new WebSocket('ws://' + location.hostname + ':1234/client');
				ws.addEventListener("message", function(message) {
					var fileReader = new FileReader();
					fileReader.onload = function() {
						message = new Uint8Array(this.result);
						var i = 0; 
						var key = '';
						for(; message[i]; i++) key += String.fromCharCode(message[i]);
						var json = "";
						for(i++; i<message.length; i++) json += String.fromCharCode(message[i]);
						var payload = JSON.parse(json);
							
						for(var j=0; j<subscriptions.length; j++) {
							if(subscriptions[j].key == key) subscriptions[j].callback(payload);
						}
					};
					fileReader.readAsArrayBuffer(message.data);
				});
			}
			$timeout(maintainConnection, 1000);
		}
		maintainConnection();
		
	});
}());