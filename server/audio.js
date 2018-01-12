///////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////// Audio /////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////
var Audio = function () {};

// Modules
var settings = require('./settings.js');
var spawn = require('child_process').spawn;

// Constants
var output_usb = 'usb';
var output_bluetooth = 'bluetooth';
var output_hdmi = 'hdmi';
var output_analog = 'aux';

// Audio template
var outputValue = null;
var volumeValue = null;
var setOutput = function(output) { outputValue = output }
var setVolume = function(volume) { volumeValue = volume }

// Locked template wrappers

// Linux implementation
if(process.platform == "linux") {
	spawn('sh', ['-c', 'modprobe snd-aloop']);

	var volume_curve = [0, 3, 5, 6, 8, 10, 11, 13, 15, 16, 18, 20, 21, 23, 24, 26, 27, 29, 30, 32, 33, 35, 36, 38, 39, 41, 42, 43, 45, 46, 47, 49, 50, 51, 53, 54, 55, 56, 57, 59, 60, 61, 62, 63, 64, 65, 66, 67, 69, 70, 71, 72, 73, 73, 74, 75, 76, 77, 78, 79, 80, 81, 81, 82, 83, 84, 84, 85, 86, 87, 87, 88, 89, 89, 90, 90, 91, 92, 92, 93, 93, 94, 94, 95, 95, 95, 96, 96, 97, 97, 97, 98, 98, 98, 98, 99, 99, 99, 99, 99, 100];
	var volume_usb_card = "amixer -c 1 sset 'PCM' <value>%";
	var volume_usb_speakers = "amixer -c 1 sset 'Speaker' <value>%";
	var volume_bluetooth = "amixer -D bluealsa sset <device> <value>%";
	var volume_bluetooth_paramDevice = '<device>';
	var volume_hdmi = "amixer sset 'PCM' <value>%";
	var volume_analog = "amixer sset 'PCM' <value>%";
	var volume_paramValue = "<value>";
	
	var device_usb = 'hw:Device,0,0';
	var device_bluetooth = 'bluealsa:HCI=hci0,DEV=<mac>,PROFILE=a2dp';
	var device_bluetooth_paramMac = '<mac>';
	var device_hdmi = 'hw:ALSA,1,0';
	var device_analog = 'hw:ALSA,1,0';

	var switch_hdmi = '2';
	var switch_analog = '1';

	var command_passThrough = 'arecord -f S16_LE -r48000 -c2 -D dsnoop:Loopback,1,0 -B100000 | aplay -D <device> -B100000';
	var command_passThrough_paramDevice = '<device>';	
	
	var getBluetoothDeviceName = function(callback) {
		var getName = spawn('amixer', ['-D', 'bluealsa']);
		getName.stdout.on('data', function(data) {
			var key = "Simple mixer control '";
			var name = data.toString('utf8');
			var start = name.indexOf(key) + key.length;
			var end = name.indexOf("'", start);
			name = name.substring(start-1, end+1);
			
			callback(name);
		});
	}
	
	var currentProcess = null;
	var processes = [];
	var killProcess = function(pid) {
		var checkIsAlive = spawn('ps', ['-p', pid, '-o', 'comm=']);
		var isAlive = false;
		checkIsAlive.stdout.on('data', function(data) {
			isAlive = true;
			spawn('pkill', ['-P', pid]);
		});
		checkIsAlive.on('close', function() {
			if(!isAlive) processes.splice(processes.indexOf(pid), 1);
		});
	}
	var killProcesses = function() {
		for(var i=processes.length-1; i>-1; i--) {
			if(processes[i] !== currentProcess) killProcess(processes[i]);
		}
	}
	setInterval(killProcesses, 1000);
	
	setOutput = function(output) {
		if(outputValue != output) {
			outputValue = output;
			setVolume(volumeValue);
			
			var startPassthrough = function(device) {
				var setupPassthrough = function() {
					if(outputValue == output) {
						var command = command_passThrough.replace(command_passThrough_paramDevice, device);
						var passthrough = spawn('sh', ['-c', command]);
						passthrough.on('close', function(code) {
							if(code != 0) setTimeout(setupPassthrough, 1000);
						});
						currentProcess = passthrough.pid;
						processes.push(currentProcess);
					}
				}
				setupPassthrough();
			}
			
			if(output == output_bluetooth) {
				var device = device_bluetooth.replace(device_bluetooth_paramMac, 'B8:69:C2:C3:EE:65');
				startPassthrough(device);
			} else if(output == output_usb) {
				startPassthrough(device_usb);
			} else if(output == output_hdmi) {
				spawn('amixer', ['cset', 'numid=3', switch_hdmi]);
				startPassthrough(device_hdmi);
			} else if(output == output_analog) {
				spawn('amixer', ['cset', 'numid=3', switch_analog]);
				startPassthrough(device_analog);
			}
		}
	}
	
	setVolume = function(volume) {
		volumeValue = volume;
		
		if(outputValue == output_bluetooth) {
			getBluetoothDeviceName(function(btName) {
				var command = volume_bluetooth.replace(volume_paramValue, volume_curve[volume]);
				command = command.replace(volume_bluetooth_paramDevice, btName);
				spawn('sh', ['-c', command]);
			});
		} else if(outputValue == output_usb) {
			var commandCard = volume_usb_card.replace(volume_paramValue, volume_curve[volume]);
			var commandSpeakers = volume_usb_speakers.replace(volume_paramValue, volume_curve[volume]);
			spawn('sh', ['-c', commandCard]);
			spawn('sh', ['-c', commandSpeakers]);
		} else if(outputValue == output_hdmi) {
			var command = volume_hdmi.replace(volume_paramValue, volume_curve[volume]);
			spawn('sh', ['-c', command]);
		} else if(outputValue == output_analog) {
			var command = volume_analog.replace(volume_paramValue, volume_curve[volume]);
			spawn('sh', ['-c', command]);
		}
	}

	// Get the current selected audio output and start passthrough
	settings.getAllSettings(function(settings) {
		volumeValue = settings["audioVolume"];
		setOutput(settings["audioOutput"]);
	});
}

// Basic controls
Audio.prototype.setOutput = function(output) {
	setOutput(output);
}
Audio.prototype.getOutput = function() {
	if(!outputValue) return 'null';
	return outputValue;
}
Audio.prototype.setVolume = function(volume) {
	setVolume(parseInt(volume));
}
Audio.prototype.getVolume = function() {
	if(!volumeValue) return 0;
	return volumeValue;
}

/////////////////////////
// Export Audio Object //
/////////////////////////
module.exports = new Audio();
