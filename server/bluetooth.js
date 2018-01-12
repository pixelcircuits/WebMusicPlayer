///////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////// Bluetooth /////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
var Bluetooth = function () {};
//https://www.npmjs.com/package/bluetoothctl

// Modules
var ws = require('./websockets.js');
var settings = require('./settings.js');

// Constants
var bluetoothStatus_notconnected = "not connected";
var bluetoothStatus_connecting = "connecting...";
var bluetoothStatus_connected = "connected";

// Bluetooth template
var selectedDevice = {};
var selectStatus = bluetoothStatus_notconnected;
var startScan = function() { }
var pairDevice = function(device) { }
var forgetDevice = function() { }

// Linux implementation
if(process.platform == "linux") {
	var blue = require("bluetoothctl");
	blue.Bluetooth();
	if(blue.checkBluetoothController()) {
		var pairInterval = null;
		var oldStatus = null;
		var isScanning = false;
		var devices = [];
		var getDeviceStatus = function(mac) {
			var stat = { paired: false, trusted: false, connected: false };
			for(var i=0; i<blue.devices.length; i++) {
				if(blue.devices[i].mac == mac) {
					if(blue.devices[i].paired && blue.devices[i].paired === 'yes') stat.paired = true; 
					if(stat.paired && blue.devices[i].trusted && blue.devices[i].trusted === 'yes') stat.trusted = true; 
					if(stat.trusted && blue.devices[i].connected && blue.devices[i].connected === 'yes') stat.connected = true; 
					break;
				}
			}
			return stat;
		}
		var publishStatus = function(bluetoothStatus) {
			selectStatus = bluetoothStatus;
			ws.publish_c("BluetoothStatus", JSON.stringify({	
				name: selectedDevice.name,
				mac: selectedDevice.mac,
				status: selectStatus
			}));
		}
		
		blue.on(blue.bluetoothEvents.Device, function(d) {
			var deviceList = [];
			for(var i=0; i<blue.devices.length; i++) {
				deviceList.push({
					name: blue.devices[i].name,
					mac: blue.devices[i].mac
				})
			}
			devices = deviceList;
		});
		
		startScan = function() {
			if(!isScanning) {
				isScanning = true;
				blue.scan(true);
				
				var time = 10000;
				var interval = 500;
				var sendDevices = function() {
					ws.publish_c("BluetoothDevices", JSON.stringify(devices)); 
					time-=interval;
					if(time <= 0) {
						isScanning = false;
						blue.scan(false);
						ws.publish_c("BluetoothEndScan", JSON.stringify({}));
					}
					else setTimeout(sendDevices, interval);
				}
				sendDevices();
			}
		}
		
		pairDevice = function(device) {
			if(pairInterval !== null) clearInterval(pairInterval);
			selectedDevice = device;
			publishStatus(bluetoothStatus_connecting);
			
			oldStatus = { paired: false, trusted: false, connected: false };
			pairInterval = setInterval(function() {
				var stat = getDeviceStatus(device.mac);
		
				if(!stat.paired) blue.pair(device.mac);
				else if(!stat.trusted) blue.trust(device.mac);
				else if(!stat.connected) blue.connect(device.mac);
								
				if(oldStatus) {
					if(!oldStatus.connected && stat.connected) publishStatus(bluetoothStatus_connected);
					if(oldStatus.connected && !stat.connected) publishStatus(bluetoothStatus_connecting);
				}
				oldStatus = stat;	
			}, 1000);
		}
		
		forgetDevice = function() {
			if(selectedDevice.name && selectedDevice.mac) {
				var mac = selectedDevice.mac;
				if(pairInterval !== null) clearInterval(pairInterval);
				blue.remove(selectedDevice.mac);
				
				selectedDevice = { name: "", mac: null };
				publishStatus(bluetoothStatus_notconnected);
				
				for(var i=0; i<devices.length; i++) {
					if(devices[i].mac == mac) {
						devices.splice(i,1);
						break;
					}
				}
				ws.publish_c("BluetoothDevices", JSON.stringify(devices)); 
			}
		}
	}
}

// Get the current selected bluetooth device and start process to attempt pairing
settings.getSetting("selectedBluetooth", function(device) {
	if(device.name && device.mac) {
		pairDevice(device);
	}
});

// Bluetooth websocket messages
ws.subscribe_p("BluetoothScan", function(data) {
	startScan();
});
ws.subscribe_p("BluetoothStatusRequest", function(data) {
	ws.publish_c("BluetoothStatus", JSON.stringify({	
		name: device.name,
		mac: device.mac,
		status: selectStatus
	}));
});

// Basic controls
Bluetooth.prototype.scan = function() {
	startScan();
}
Bluetooth.prototype.getStatus = function() {
	return {	
		name: selectedDevice.name,
		mac: selectedDevice.mac,
		status: selectStatus
	};
}
Bluetooth.prototype.pair = function(device) {
	if(device.name && device.mac) pairDevice(device);
	else forgetDevice();
}

/////////////////////////////
// Export Bluetooth Object //
/////////////////////////////
module.exports = new Bluetooth();
