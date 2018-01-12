////////////////////////////////////////
// Plugin Player Global Functionality //
////////////////////////////////////////
PluginPlayer = (function () {
	var PluginPlayer = function () {};
	
	var changingURL = false;
	var mainPlugin = null;
	var mainPluginInterval = null;
	var plugins = [];

	///////////////////////////////
	// Updates the playing state //
	///////////////////////////////
	PluginPlayer.prototype.updatePlayingState = function(state) {
		if(!changingURL) {
			var payload = JSON.stringify(state);
			chrome.extension.sendMessage({type:'ChromeLink_Publish', key:"PlayingUpdate", payload:payload, length:payload.length});
		}
	}
	
	//////////////////////
	// Sends video data //
	//////////////////////
	PluginPlayer.prototype.sendVideoData = function(data) {
		chrome.extension.sendMessage({type:'ChromeLink_Publish', key:"VideoData", payload:data, length:data.length});
	}
	
	///////////////////////////////
	// Navigate to the given url //
	///////////////////////////////
	PluginPlayer.prototype.goToURL = function(url, tag) {
		if(mainPluginInterval !== null) clearInterval(mainPluginInterval);
		mainPluginInterval = null;
		
		this.updatePlayingState({
			tag: tag,
			timePercent: 0,
			timeText: '--:--',
			durationText: '--:--',
			state: 'processing',
			errorText: ''
		});
								
		chrome.extension.sendMessage({type:'ChromeLink_Goto', url:url});
		changingURL = true;
	}
	
	///////////////////////////////
	// Navigate to the Home Page //
	///////////////////////////////
	PluginPlayer.prototype.goHome = function() {
		if(mainPluginInterval !== null) clearInterval(mainPluginInterval);
		mainPluginInterval = null;
		
		this.updatePlayingState({
			tag: tag,
			timePercent: 0,
			timeText: '--:--',
			durationText: '--:--',
			state: 'processing',
			errorText: ''
		});						
						
		var home = "http://localhost/lite.html";
		chrome.extension.sendMessage({type:'ChromeLink_Goto', url:home});
		changingURL = true;
	}
	
	////////////////////////
	// Registers a plugin //
	////////////////////////
	PluginPlayer.prototype.register = function(plugin) {	
		var updatePlayingState = this.updatePlayingState;	
		if(plugin && plugin.tagKey && plugin.domain) {	
			plugins.push(plugin);
			
			// check if plugin is for current domian 
			if(document.URL.indexOf(plugin.domain) > -1) {
				mainPlugin = plugin;
				if(plugin.onLoad) plugin.onLoad();
				if(plugin.getState) {
					mainPluginInterval = setInterval(function() {
						var state = plugin.getState();
						if(state) updatePlayingState(state);
					}, 1000);
				}
			}
			
			// register dom management
			chrome.storage.sync.get('ChromeLink_DOMManagement', function(val) {
				if(val && val['ChromeLink_DOMManagement']) val = val['ChromeLink_DOMManagement'];
				else val = {};
				for(var p in plugins) val[plugins[p].domain] = {domDelete:plugins[p].domDelete, domHide:plugins[p].domHide};
				chrome.storage.sync.set({'ChromeLink_DOMManagement': val});
			});
			
			// register web request management
			chrome.extension.sendMessage({type:'ChromeLink_ManageWebRequests', domain:plugin.domain, webOnly:plugin.webOnly, wedExclude:plugin.wedExclude});
		}
	}
	
	// Manage message subscriptions
	var subscribe = function(key, callback, format) {
		chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
			if (message.type == 'ChromeLink_Subscribe' && message.key == key) {
				if(format == 'string') {
					var string = "";
					for(var i=0; i<message.payload.length; i++) string += String.fromCharCode(message.payload[i]);
					callback(string);
				} else if(format == 'json') {
					var json = ""; 
					for(var i=0; i<message.payload.length; i++) json += String.fromCharCode(message.payload[i]);
					callback(JSON.parse(json));
				} else {
					callback(message.payload);
				}
			}
		});
	}
	subscribe("Play", function(tag) {
		if(tag) {
			for(var i=0; i<plugins.length; i++) {
				if(tag.indexOf(plugins[i].tagKey) == 0) {
					if(plugins[i].onPlay) plugins[i].onPlay(tag);
					break;
				}
			}
		} else {
			if(mainPlugin && mainPlugin.onPlay) mainPlugin.onPlay();
		}
	}, 'string');
	subscribe("Pause", function() {
		if(mainPlugin && mainPlugin.onPause) mainPlugin.onPause();
	});
	subscribe("Seek", function(s) {
		if(mainPlugin && mainPlugin.onSeek) mainPlugin.onSeek(s);
	}, 'json');
	subscribe("Stop", function() {
		this.goHome();
	});
	
	
	return new PluginPlayer();
}());


///////////////////////
// Page editor tools //
///////////////////////
PageEditor = (function () {
	var PageEditor = function () {};
	var deleteSelector = "";
	var hideSelector = "";
	
	function doDelete(nodes) {
		[].forEach.call(nodes, function(node) { node.remove() });
	}
	function doHide(nodes) {
		[].forEach.call(nodes, function(node) { node.style.width="0px"; node.style.minWidth="0px"; node.style.height="0px"; node.style.minHeight="0px"; node.style.margin="0px"; node.style.padding="0px"; node.style.overflow="hidden" });
	}
	function process(mutations) {
		for (var i = 0; i < mutations.length; i++) {
			var nodes = mutations[i].addedNodes;
			for (var j = 0; j < nodes.length; j++) {
				var n = nodes[j];
				if (n.nodeType != 1) continue;
				
				if(deleteSelector) doDelete(n.matches(deleteSelector) ? [n] : n.querySelectorAll(deleteSelector));
				if(hideSelector) doHide(n.matches(hideSelector) ? [n] : n.querySelectorAll(hideSelector));
			}
		}
	}
	var mo = new MutationObserver(process);
	mo.observe(document, {subtree:true, childList:true});
	document.addEventListener('DOMContentLoaded', function() { mo.disconnect() });

	
	///////////////////////////////////////////////////////////////
	// Deletes elements on the DOM that match the given selector //
	///////////////////////////////////////////////////////////////
	PageEditor.prototype.deleteElements = function(selector) {
		deleteSelector = selector;
		doDelete(document.querySelectorAll(selector));
	}
	
	/////////////////////////////////////////////////////////////
	// Hides elements on the DOM that match the given selector //
	/////////////////////////////////////////////////////////////
	PageEditor.prototype.hideElements = function(selector) {
		hideSelector = selector;
		doHide(document.querySelectorAll(selector));
	}
	
	////////////////////////////////
	// Adds an element to the DOM //
	////////////////////////////////
	PageEditor.prototype.addElement = function(type, attributes, style) {
		var element = document.createElement(type);
		if(attributes) for(var a in attributes) element[a] = attributes[a];
		if(style) for(var s in style) element.style[s] = style[s];
		document.body.appendChild(element);
		return element;
	}
	
	////////////////////////////////
	// Gets elements from the DOM //
	////////////////////////////////
	PageEditor.prototype.getElementsByClassName = function(className, callback) {
		var numTries = 10;
		function check() {
			if(numTries > 0) {
				var elements = document.getElementsByClassName(className);
				if(elements.length > 0) callback(elements);
				else setTimeout(check, 500);
			} else {
				callback([]);
			}
			numTries--;
		}
		check();
	}
	
	///////////////////////////////////////////
	// Loads the given script to the content //
	///////////////////////////////////////////
	PageEditor.prototype.loadScript = function(url) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, false);
		var script = xhr.send(null);
		eval(xhr.responseText);
	}
	
	return new PageEditor();
}());


//////////////////////
// Plugin Utilities //
//////////////////////
PluginUtil = (function () {
	var PluginUtil = function () {};
	
	////////////////////////////////////////
	// Gets time as a string from seconds //
	////////////////////////////////////////
	PluginUtil.prototype.getTimeString = function(seconds) {
		var m = Math.floor(seconds/60);
		var s = Math.floor(seconds-(m*60));
		if(m < 10) m = '0' + m;
		if(s < 10) s = '0' + s;
		return m + ':' + s;
	}
	
	return new PluginUtil();
}());


////////////////////////////////
// Load Plugin Player Scripts //
////////////////////////////////
console.log('ChromeLink: Starting Player Scripts...');
chrome.extension.sendMessage({type:'ChromeLink_LoadScripts'});


//////////////////////
// DOM Modification //
//////////////////////
chrome.storage.sync.get('ChromeLink_DOMManagement', function(val) {
	if(val && val['ChromeLink_DOMManagement']) {
		for(var d in val['ChromeLink_DOMManagement']) {
			if(document.URL.indexOf(d) > -1) {
				if(val['ChromeLink_DOMManagement'][d].domDelete) PageEditor.deleteElements(val['ChromeLink_DOMManagement'][d].domDelete);
				if(val['ChromeLink_DOMManagement'][d].domHide) PageEditor.hideElements(val['ChromeLink_DOMManagement'][d].domHide);
				break;
			}
		}
	}
});
