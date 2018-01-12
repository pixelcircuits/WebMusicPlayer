//////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Websocket [Players/Clients] //////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
var WebSocketServer = require('ws').Server;
var http = require('http');

var websocketPort = 1234;
var ws_p = null; 
var ws_cmain = null;
var ws_c = {};

// Helper functions
function convertString(data) {
	var str = "";
	for(var i=0; i<data.length; i++) str += String.fromCharCode(data[i]);
	return str;
}
function convertJSON(data) {
	var json = convertString(data);
	return JSON.parse(json);
}

// Websocket publish and subscribe [Players]
function publish_p(key, payload) {
	if(ws_p) {
		if(payload===null) payload = "";
		var message = new Uint8Array(key.length + payload.length + 1);
		for(var i=0; i<key.length; i++) message[i] = key.charCodeAt(i);
		message[key.length] = 0;
		if((typeof payload) == 'string') for(var i=0; i<payload.length; i++) message[key.length+i+1] = payload.charCodeAt(i);	
		else for(var i=0; i<payload.length; i++) message[key.length+i+1] = payload[i];

		ws_p.send(message);
		return true;
	}
	return false;
}
var subscriptions_p = [];
function subscribe_p(key, callback, format) {
	subscriptions_p.push({
		key: key,
		callback: callback,
		format: format
	});
}
function messageReceive_p(data, flags) {
	if (flags.binary) {
		var i = 0; 
		var key = '';
		for(; data[i]; i++) key += String.fromCharCode(data[i]);
		var payload = [];
		for(i++; i<data.length; i++) payload.push(data[i]);
		
		for(var j=0; j<subscriptions_p.length; j++) {
			if(subscriptions_p[j].key == key) {
				if(subscriptions_p[j].format == 'string') subscriptions_p[j].callback(convertString(payload));
				else if(subscriptions_p[j].format == 'json') subscriptions_p[j].callback(convertJSON(payload));
				else subscriptions_p[j].callback(payload);
			}
		}
	}
}

// Websocket publish and subscribe [Clients]
function publish_c(key, payload, mainOnly) {
	if(payload===null) payload = "";
	var message = new Uint8Array(key.length + payload.length + 1);
	for(var i=0; i<key.length; i++) message[i] = key.charCodeAt(i);	
	message[key.length] = 0;
	if((typeof payload) == 'string') for(var i=0; i<payload.length; i++) message[key.length+i+1] = payload.charCodeAt(i);	
	else for(var i=0; i<payload.length; i++) message[key.length+i+1] = payload[i];
		
	if(ws_cmain) {
		ws_cmain.send(message);
	}
	if(!mainOnly) {
		for( var id in ws_c) {
			ws_c[id].send(message);
		}
	}
}
var subscriptions_c = [];
function subscribe_c(key, callback, mainOnly, format) {
	subscriptions_c.push({
		key: key,
		callback: callback,
		mainOnly: mainOnly,
		format: format
	});
}
function messageReceive_c(data, flags, main) {
	if (flags.binary) {
		var i = 0; 
		var key = '';
		for(; data[i]; i++) key += String.fromCharCode(data[i]);
		var payload = [];
		for(i++; i<data.length; i++) payload.push(data[i]);
		
		for(var j=0; j<subscriptions_c.length; j++) {
			var mainRequirement = !subscriptions_c[j].mainOnly || (subscriptions_c[j].mainOnly && main);
			if(subscriptions_c[j].key == key && mainRequirement) {
				if(subscriptions_c[j].format == 'string') subscriptions_c[j].callback(convertString(payload));
				else if(subscriptions_c[j].format == 'json') subscriptions_c[j].callback(convertJSON(payload));
				else subscriptions_c[j].callback(payload);
			}
		}
	}
}

// Maintain websocket connection
var server = http.createServer();
var wss_p = new WebSocketServer({server: server, path: '/player'});
var wss_cmain = new WebSocketServer({server: server, path: '/client/main'});
var wss_c = new WebSocketServer({server: server, path: '/client'});
wss_p.on('connection', function(websocket) {
	ws_p = websocket;
    websocket.on('message', messageReceive_p);
    websocket.on('close', function() {
		ws_p = null;
		console.log('Player Websocket Closed.');
		for(var j=0; j<subscriptions_p.length; j++) if(subscriptions_p[j].key == 'Closed') subscriptions_p[j].callback("");
    });
    websocket.on('error', function(e) {
    });
    console.log('Player Websocket Connected.');
	for(var j=0; j<subscriptions_p.length; j++) if(subscriptions_p[j].key == 'Connected') subscriptions_p[j].callback("");
});
wss_cmain.on('connection', function(websocket) {
    console.log('Client Websocket Connected [Main]');
	ws_cmain = websocket;
    websocket.on('message', function(data, flags) { messageReceive_c(data, flags, true) });
    websocket.on('close', function() {
      console.log('Client Websocket Closed [Main]');
	  ws_cmain = null;
    });
    websocket.on('error', function(e) {
    });
});
wss_c.on('connection', function(websocket) {
	var clientId = (new Date()).getTime();
    console.log('Client Websocket Connected [' + clientId + ']');
	ws_c[clientId] = websocket;
    websocket.on('message', messageReceive_c);
    websocket.on('close', function() {
      console.log('Client Websocket Closed [' + clientId + ']');
	  delete ws_c[clientId];
    });
    websocket.on('error', function(e) {
    });
});
server.listen(websocketPort, function() {
    console.log('Websocket Server is listening on port ' + websocketPort);
});

// Return WebsocketConnection
var WebsocketConnection = function () {};
WebsocketConnection.prototype.publish_p = function(key, payload) {
	return publish_p(key, payload);
};
WebsocketConnection.prototype.subscribe_p = function(key, callback, format) {
	return subscribe_p(key, callback, format);
}
WebsocketConnection.prototype.publish_c = function(key, payload, mainOnly) {
	return publish_c(key, payload, mainOnly);
}
WebsocketConnection.prototype.subscribe_c = function(key, callback, mainOnly, format) {
	return subscribe_c(key, callback, mainOnly, format);
}
WebsocketConnection.prototype.isMainClientConnected = function() {
	if(ws_cmain) return true;
	return false;
}
module.exports = new WebsocketConnection();
