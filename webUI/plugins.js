(function () {
    var app = angular.module('App')
	app.service('plugins', function() {		
		var pluginList = [];
		var getPluginCallbacks = [];
		var pluginsLoaded = false;
		
		// Filter function
		var fetchPlugins = function(enabledOnly) {
			var plugins = [];
			for(var i=0; i<pluginList.length; i++) {
				if(!enabledOnly || pluginList[i].enabled) {
					plugins.push({
						name: pluginList[i].name,
						icon: pluginList[i].icon,
						enabled: pluginList[i].enabled,
						index: pluginList[i].index
					});
				}
			}
			return plugins;
		}
		
		// Load plugin scripts
		$.getJSON(location.origin + '/plugins/scripts/search', function (scripts) { 
			var head = document.getElementsByTagName('head')[0];
			var process = function() {
				if(scripts.length > 0) {
					var plugin = scripts.pop();
					var script = document.createElement('script');
					script.type = 'text/javascript';
					script.src = plugin.path;
					script.onload = function() {
						var data = window.PluginData || {};
						pluginList.push({
							name: plugin.name,
							icon: data.icon,
							tagKey: data.tagKey,
							search: data.search,
							decodeUrl: data.decodeUrl,
							getStream: data.getStream,
							enabled: plugin.enabled,
							index: plugin.index
						});
						process();
					};
					head.appendChild(script);
				} else {
					pluginList.sort(function(a, b) {
						return a.index - b.index;
					});
			
					pluginsLoaded = true;
					for(var i=0; i<getPluginCallbacks.length; i++) getPluginCallbacks[i].callback(fetchPlugins(getPluginCallbacks[i].enabledOnly));
					getPluginCallbacks = [];
				}
			}
			process();
		});

		// Get the plugin objects
		this.getPlugins = function(callback, enabledOnly) {
			if(pluginsLoaded) {
				callback(fetchPlugins(enabledOnly));
			} else {
				getPluginCallbacks.push({
					callback: callback, 
					enabledOnly: enabledOnly
				});
			}
		}
		
		// Seach a plugin for song streams
		this.search = function(name, song, callback) {
			var plugin = null;
			for(var i=0; i<pluginList.length; i++) {
				if(pluginList[i].name == name) {
					plugin = pluginList[i];
					break;
				}
			}
			if(plugin) {
				plugin.search(song, function(streams) {
					if(!streams) streams = [];
					if(song.tag && song.tag.indexOf(plugin.tagKey) == 0) {
						var included = false;
						for(var i=0; i<streams.length; i++) {
							if(streams[i].tag == song.tag) {
								included = true;
								break;
							}
						}
						if(!included) {
							plugin.getStream(song.tag, function(stream) {
								if(stream) streams.unshift(stream);
								callback(streams);
							});
						} else callback(streams);
					} else callback(streams);
				});
			} else callback([]);
		};
		
		// Verify a url and get stream data
		this.verify = function(name, url, callback) {
			var plugin = null;
			for(var i=0; i<pluginList.length; i++) {
				if(pluginList[i].name == name) {
					plugin = pluginList[i];
					break;
				}
			}
			if(plugin) {
				plugin.decodeUrl(url, function(tag){
					if(tag) {
						plugin.getStream(tag, function(stream){
							if(stream) callback(stream);
							else callback(null);
						});
					} else callback(null);
				});
			} else callback(null);
		};
		
		// Verify a url and get stream data
		this.updatePlugins = function(plugins) {
			for(var i=0; i<plugins.length; i++) {
				var plugin = null;
				for(var j=0; j<pluginList.length; j++) {
					if(pluginList[j].name == plugins[i].name) {
						plugin = pluginList[j];
						break;
					}
				}
				if(plugin) {
					plugin.enabled = plugins[i].enabled;
					plugin.index = plugins[i].index;
				}
			}
			pluginList.sort(function(a, b) {
				return a.index - b.index;
			});
		}
		
	});
}());