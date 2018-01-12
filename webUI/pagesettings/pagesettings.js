(function () {
    var app = angular.module('App')
	app.directive('pagesettings', function ($mdDialog, notification, settings, plugins) {					
		function link($scope, element, attrs) {	
			$scope.$parent.toolbarText = "Settings";
			$scope.volume = 0;
			$scope.output = {
				text: "",
				aux: false,
				usb: false,
				hdmi: false,
				bluetooth: false
			};
			$scope.bluetooth = {
				scanning: false,
				selectedStatus: "not connected",
				selectedDevice: "No Bluetooth Device",
				selectedMac: null,
				devices: []
			};
			$scope.plugins = {
				images: {},
				list: []
			};
				
			$scope.volumeChange = function() {
				settings.setSettings({
					audioVolume: $scope.volume
				});
			}
			$scope.outputSelect = function(output) {
				$scope.output.aux = false;
				$scope.output.usb = false;
				$scope.output.hdmi = false;
				$scope.output.bluetooth = false;
				if($scope.output.text != output) {
					$scope.output.text = output;
					settings.setSettings({
						audioOutput: output
					});
				}
			}
			$scope.bluetoothSelect = function(device) {
				if(device) settings.setSettings({selectedBluetooth: { name: device.name, mac: device.mac }});
				else settings.setSettings({selectedBluetooth: { name: "", mac: null }});
			}
			$scope.bluetoothScan = function() {
				$scope.bluetooth.scanning = true;
				settings.bluetoothScan();
			}
			$scope.pluginChange = function(plugin, step) {
				var commitData = function() {
					var pluginConfiguration = [];
					for(var i=0; i<$scope.plugins.list.length; i++) {
						pluginConfiguration.push({
							name: $scope.plugins.list[i].name,
							enabled: $scope.plugins.list[i].enabled,
							index: $scope.plugins.list[i].index,
						});
					}
					if(step === 0) pluginConfiguration[plugin.index].enabled = !plugin.enabled;
					plugins.updatePlugins(pluginConfiguration);
					settings.setSettings({
						pluginConfiguration: pluginConfiguration
					});
				}
				
				if(step > 0 && plugin.index > 0) {
					var otherPlugin = $scope.plugins.list[plugin.index-1];
					otherPlugin.index = otherPlugin.index+1;
					$scope.plugins.list[otherPlugin.index] = otherPlugin;
					plugin.index = plugin.index-1;
					$scope.plugins.list[plugin.index] = plugin;
					commitData();
				}
				if(step < 0 && plugin.index < $scope.plugins.list.length-1) {
					var otherPlugin = $scope.plugins.list[plugin.index+1];
					otherPlugin.index = otherPlugin.index-1;
					$scope.plugins.list[otherPlugin.index] = otherPlugin;
					plugin.index = plugin.index+1;
					$scope.plugins.list[plugin.index] = plugin;
					commitData();
				}
				if(step === 0) {
					commitData();
				}
			}
			$scope.confirmShutdown = function(ev) {
				var confirm = $mdDialog.confirm()
					.title('Are you sure you want to Shutdown?')
					.targetEvent(ev)
					.ok('Yes')
					.cancel('No');

					$mdDialog.show(confirm).then(function() {
						settings.shutdown();
						var div = document.createElement("div");
						div.style.width = "100%";
						div.style.height = "100%";
						div.style.position = "absolute";
						div.style.top = "0";
						div.style.zIndex = "800";
						div.style.backgroundColor = "rgba(41, 41, 41, 0.74)";
						document.body.append(div);
					});
			};
			
			
			settings.getSettings(function(settings) {
				$scope.volume = settings.audioVolume;
				
				$scope.output.text = settings.audioOutput;
				if(settings.audioOutput == "aux") $scope.output.aux = true;
				if(settings.audioOutput == "usb") $scope.output.usb = true;
				if(settings.audioOutput == "hdmi") $scope.output.hdmi = true;
				if(settings.audioOutput == "bluetooth") $scope.output.bluetooth = true;
				
				if(settings.selectedBluetooth.name) {
					$scope.bluetooth.selectedDevice = settings.selectedBluetooth.name;
					$scope.bluetooth.selectedMac = settings.selectedBluetooth.mac;
				} else { 
					$scope.bluetooth.selectedDevice = "No Bluetooth Device";
					$scope.bluetooth.selectedMac = null;
				}
				
				settings.pluginConfiguration.sort(function(a, b) {
					return a.index - b.index;
				});
				for(var i=0; i<settings.pluginConfiguration.length; i++) settings.pluginConfiguration[i].index = i;
				$scope.plugins.list = settings.pluginConfiguration;
				plugins.getPlugins(function(pluginList) {
					for(var i=0; i<pluginList.length; i++) $scope.plugins.images[pluginList[i].name] = pluginList[i].icon;
					$scope.$apply();
				});
				
				$scope.$apply();
			});
			settings.bluetoothGetStatus(function(bluetoothStatus) {
				var updateSelectedBluetooth = function(bluetoothStatus) {
					var name = bluetoothStatus.name || "No Bluetooth Device";
					if($scope.bluetooth.selectedMac != bluetoothStatus.mac || $scope.bluetooth.selectedStatus != bluetoothStatus.status) {
						$scope.bluetooth.selectedDevice = name;
						$scope.bluetooth.selectedMac = bluetoothStatus.mac;
						$scope.bluetooth.selectedStatus = bluetoothStatus.status;
						//$scope.$apply();
					}
				}
				updateSelectedBluetooth(bluetoothStatus);
				setInterval(function() { 
					settings.bluetoothGetStatus(function(bluetoothStatus) {
						updateSelectedBluetooth(bluetoothStatus);
					});
				}, 500);
				
				var updateBluetoothDevices = function(devices) {
					var different = (devices.length != $scope.bluetooth.devices.length);
					if(!different) {
						for(var i=0; i<$scope.bluetooth.devices.length; i++) {
							var found = false;
							for(var j=0; j<devices.length; j++) {
								if(devices[j].name == $scope.bluetooth.devices[i].name) {
									found = true;
									break;
								}
							}
							if(!found) {
								different = true;
								break;
							}
						}
					}
					if(different || $scope.bluetooth.scanning != settings.bluetoothGetIsScanning()) {
						$scope.bluetooth.devices = devices;
						$scope.bluetooth.scanning = settings.bluetoothGetIsScanning();
						//$scope.$apply();
					}
				}
				setInterval(function() { 
					var devices = settings.bluetoothGetDevices();
					updateBluetoothDevices(devices);
				}, 500);
			}, true);
		}
        return {
			templateUrl: 'webUI/pagesettings/pagesettings.html',
			link: link
        };
    });
}());