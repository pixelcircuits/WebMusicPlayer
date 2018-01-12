///////////////////////////////
// Get Plugin Player Scripts //
///////////////////////////////
var plugin_scripts = [];
function getPluginPlayerScripts(cb) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", 'http://localhost/plugins/scripts/player', true);
	xhr.onload = function (e) {
		if (xhr.readyState === 4 && xhr.status === 200) {
			var scripts = JSON.parse(xhr.responseText);
			if(scripts && scripts.length) {		
				function complete() {
					if(cb && plugin_scripts.length == scripts.length) cb();
				}
				function fetchScript(url) {
					var scriptxhr = new XMLHttpRequest();
					scriptxhr.open('GET', url);
					scriptxhr.onload = function() {
						plugin_scripts.push(scriptxhr.responseText);
						complete();
					}
					scriptxhr.send();
				}
				for(var i=0; i<scripts.length; i++) fetchScript('http://localhost/'+scripts[i].path);
			}
		}
	};
	xhr.send(null);
}


/////////////////////////
// Websocket Subscribe //
/////////////////////////
function messageSubscribe(message) {
	var fileReader = new FileReader();
	fileReader.onload = function() {
		message = new Uint8Array(this.result);
		var i = 0; 
		var key = '';
		for(; message[i]; i++) key += String.fromCharCode(message[i]);
		var payload = [];
		for(i++; i<message.length; i++) payload.push(message[i]);
		
		// send message to all active tabs
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
			for(var i=0; i<tabs.length; i++) chrome.tabs.sendMessage(tabs[i].id, {type:"ChromeLink_Subscribe", key:key, payload:payload});  
		});
	};
	fileReader.readAsArrayBuffer(message.data);
}


///////////////////////
// Websocket Publish //
///////////////////////
chrome.extension.onMessage.addListener(
    function(message, sender, sendResponse) {
        if(message.type == 'ChromeLink_Publish') {
			var key = message.key;
			var payload = message.payload || "";
			var length = message.length;
				
			if(websocket && websocket.readyState == 1) {
				var message = new Uint8Array(key.length + length + 1);
				for(var i=0; i<key.length; i++) message[i] = key.charCodeAt(i);
				message[key.length] = 0;
				if((typeof payload) == 'string') for(var i=0; i<length; i++) message[key.length+i+1] = payload.charCodeAt(i);	
				else for(var i=0; i<length; i++) message[key.length+i+1] = payload[i];
				
				websocket.send(message);
			}
        }
    }
);


///////////////////////////////////
// Maintain Websocket Connection //
///////////////////////////////////
var websocket = null;
var websocketSubscriptions = [];
function maintainConnection() {
	if(websocket) {
		if(websocket.readyState == 3) {
			delete websocket;
			websocket = null;
		}
	} else {
		websocket = new WebSocket('ws://localhost:1234/player', 'echo-protocol');
		websocket.onopen = function (event) {
			getPluginPlayerScripts(function(){
				chrome.tabs.query({active:true}, function(results){
					if(results && results[0] && results[0].id) chrome.tabs.update(results[0].id, {url:"http://localhost/lite.html"});
				});
			});
		};
		websocket.addEventListener("message", messageSubscribe);
		
	}
	setTimeout(maintainConnection, 1000);
}
maintainConnection();


////////////////////////////////
// Load Plugin Player Scripts //
////////////////////////////////
chrome.extension.onMessage.addListener(
    function(message, sender, sendResponse) {
        if(message.type == 'ChromeLink_LoadScripts') {
			for(var i=0; i<plugin_scripts.length; i++) {
				chrome.tabs.executeScript(sender.tab.id, {code: plugin_scripts[i]});
			}
		}
    }
);


////////////////
// Change URL //
////////////////
chrome.extension.onMessage.addListener(
    function(message, sender, sendResponse) {
        if(message.type == 'ChromeLink_Goto') {
			chrome.tabs.update(sender.tab.id, {url:message.url});
		}
	}
);


/////////////////////////
// Manage Web Requests //
/////////////////////////
var webReguest_management = {};
chrome.extension.onMessage.addListener(
    function(message, sender, sendResponse) {
        if(message.type == 'ChromeLink_ManageWebRequests') {
			webReguest_management[message.domain] = {webOnly:message.webOnly, wedExclude:message.wedExclude};
		}
	}
);
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
		for(var d in webReguest_management) {
			if(details.url.indexOf(d) > -1) {
				if(webReguest_management[d].webOnly) {
					for(var i=0; i<webReguest_management[d].webOnly.length; i++) if(details.url.indexOf(webReguest_management[d].webOnly[i]) > -1) return {cancel: false};
					return {cancel: true};
				} else if(webReguest_management[d].wedExclude) {
					for(var i=0; i<webReguest_management[d].wedExclude.length; i++) if(details.url.indexOf(webReguest_management[d].wedExclude[i]) > -1) return {cancel: true};
					return {cancel: false};
				}
				return {cancel: false};
			}
		}
    },
    {urls: ["http://*/*", "https://*/*"]},
    ['blocking']
);
