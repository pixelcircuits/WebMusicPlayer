///////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////// Settings //////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
var Settings = function () {};

// Modules
var Datastore = require('nedb');
var fs = require('fs');
var ws = require('./websockets.js');

// Data Store
var dir = __dirname + '/data/';
if(/^win/.test(process.platform)) dir = __dirname + '\\data\\';
var db = {};
db.settings = new Datastore({ filename: dir + 'settings.db', autoload: true });

// Settings
var settingsData = null;
var settingName_audioVolume = "audioVolume";
var settingDefault_audioVolume = 75;
var settingName_audioOutput = "audioOutput";
var settingDefault_audioOutput = "aux";
var settingName_selectedBluetooth = "selectedBluetooth";
var settingDefault_selectedBluetooth = { name: "", mac: null };
var settingName_pluginConfiguration = "pluginConfiguration";
var settingDefault_pluginConfiguration = [];

// Functions
var setSettings = function(settings) {
	var docs = [];
	for(var i in settings) {
		if(i == settingName_audioVolume || i == settingName_audioOutput || i == settingName_selectedBluetooth || i == settingName_pluginConfiguration) {
			if(i == settingName_audioVolume) settings[i] = parseInt(settings[i]);
			
			docs.push({
				name: i,
				data: settings[i]
			});
		}
	}
	
	for(var d in docs) {
		db.settings.findOne({name: docs[d].name}, function (err, doc) {
			if(doc) db.settings.update({_id: doc._id}, docs[d], {multi:false}, function(err, count) { });
			else db.settings.insert(docs[d], function (err, doc) { });
		});
	}
	
	if(settingsData != null) {
		for(var d in docs) settingsData[docs[d].name] = docs[d].data;
		ws.publish_c("SettingsData", JSON.stringify(settingsData), true);
	}
}
var getSettings = function(callback) {
	var filter = {};
	db.settings.find(filter, function (err, docs) {
		if(err) callback([]);
		else {
			var settings = {};
			for(var i=0; i<docs.length; i++) settings[docs[i].name] = docs[i].data;
			
			if(settings[settingName_audioVolume] === undefined) settings[settingName_audioVolume] = settingDefault_audioVolume;
			if(settings[settingName_audioOutput] === undefined) settings[settingName_audioOutput] = settingDefault_audioOutput;
			if(settings[settingName_selectedBluetooth] === undefined) settings[settingName_selectedBluetooth] = settingDefault_selectedBluetooth;
			if(settings[settingName_pluginConfiguration] === undefined) settings[ settingName_pluginConfiguration]  = settingDefault_pluginConfiguration;
			callback(settings);
		}
	});
}

// Get settings in memory
getSettings(function(settings) {
	settingsData = settings;
});

// Update plugin configuration data
fs.readdir(__dirname + '/../plugins', function(err, files) {
	db.settings.find({name: settingName_pluginConfiguration}, function (err2, docs) {
		var pluginConfiguration = [];
		
		if(!err) {
			for(var i=0; i<files.length; i++) {
				var existing = null;
				if(!err2 && docs.length && docs[0].data) {
					for(var j=0; j<docs[0].data.length; j++) {
						if(docs[0].data[j].name == files[i]) {
							existing = docs[0].data[j];
							break;
						}
					}
				}
				
				if(existing) {
					pluginConfiguration.push({
						name: files[i],
						enabled: existing.enabled,
						index: existing.index
					});
				} else {
					pluginConfiguration.push({
						name: files[i],
						enabled: true,
						index: 0
					});
				}
			}
		}
		
		var settings = {};
		settings[settingName_pluginConfiguration] = pluginConfiguration;
		setSettings(settings);
	});
});

// Settings websocket messages
ws.subscribe_c("SettingsRequest", function() {
	var waitForData = function() {
		if(settingsData == null) setTimeout(waitForData, 250);
		else ws.publish_c("SettingsData", JSON.stringify(settingsData), true);
	}
	waitForData();
}, true);

// Basic controls
Settings.prototype.setSettings = function(settings) {
	setSettings(settings);
}
Settings.prototype.getSetting = function(name, callback) {
	var waitForData = function() {
		if(settingsData == null) setTimeout(waitForData, 250);
		else callback(settingsData[name]);
	}
	waitForData();
}
Settings.prototype.getAllSettings = function(callback) {
	var waitForData = function() {
		if(settingsData == null) setTimeout(waitForData, 250);
		else callback(settingsData);
	}
	waitForData();
}

////////////////////////////
// Export Settings Object //
////////////////////////////
module.exports = new Settings();
