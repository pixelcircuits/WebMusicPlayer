(function () {
    var app = angular.module('App')
	app.service('playcontrols', function(adapter, websockets, settings) {
		
		// POST REST request
		jQuery["postJSON"] = function(url, data, callback) {
			$.ajax({url: url, type: "POST", data: JSON.stringify(data), contentType:"application/json; charset=utf-8", dataType:"json", success: callback});
		}
		
		// Make a copy of an item
		function copy(obj) {
			return JSON.parse(JSON.stringify(obj));
		}
		
		//Determine if queues are different
		function queuesDifferent(a, b) {
			if(a.length != b.length) return true;
			for(var i=0; i<a.length; i++) for(var q in a[i]) if(a[i][q] !== b[i][q]) return true;
			return false;
		}
		
		//Determine if playing data is different
		function playingDifferent(a, b) {
			for(var q in a) if(a[q] !== b[q]) return true;
			return false;
		}
		
		//Find the given song in queue
		function findInQueue(song) {
			for(var i=0; i<queue.length; i++) {
				if(queue[i].id == song.id) {
					return i;
				}
			}
			return -1;
		}
		
		//Shuffles the given array
		function shuffle(array) {
			var currentIndex = array.length, temporaryValue, randomIndex;
			while (0 !== currentIndex) {
				randomIndex = Math.floor(Math.random() * currentIndex);
				currentIndex -= 1;

				temporaryValue = array[currentIndex];
				array[currentIndex] = array[randomIndex];
				array[randomIndex] = temporaryValue;
			}
			return array;
		}
		
		//////////////////////////////////
		// Realtime updates (websocket) //
		//////////////////////////////////
		var playing = {id:'', tag:'', title:'', artist:'', album:'', art:'', timePercent:0, timeText:"--:--", durationText:"--:--", state:"paused"};
		var queue = [];
		var queueRepeat = true;
		this.getPlaying = function() {
			return copy(playing);
		}
		this.getQueue = function() {
			return copy(queue);
		}
		this.getQueueRepeat = function() {
			return queueRepeat;
		}
		
		var onPlayingUpdateFunctions = [];
		function updatePlaying(newPlaying) {
			if(playingDifferent(newPlaying, playing)) {
				playing = newPlaying;
				for(var i in onPlayingUpdateFunctions) onPlayingUpdateFunctions[i].func(copy(playing));
			}
		}
		this.onPlayingUpdate = function(onPlayingUpdateFunction, scope) {
			var scopeId = undefined;
			if(scope) {
				scopeId = scope.$id
				scope.$on('$destroy', cleanSubscriptions);
			}
			onPlayingUpdateFunctions.push({func:onPlayingUpdateFunction, scopeId:scopeId});
		}
		var onQueueUpdateFunctions = [];
		function updateQueue(newQueue, newRepeat) {
			if(queuesDifferent(newQueue, queue)) {
				queue = newQueue;
				for(var i in onQueueUpdateFunctions) onQueueUpdateFunctions[i].func(copy(queue), queueRepeat);
			} else if(queueRepeat != newRepeat) {
				queueRepeat = newRepeat;
				for(var i in onQueueUpdateFunctions) onQueueUpdateFunctions[i].func(null, queueRepeat);
			}
		}
		this.onQueueUpdate = function(onQueueUpdateFunction, scope) {
			var scopeId = undefined;
			if(scope) {
				scopeId = scope.$id
				scope.$on('$destroy', cleanSubscriptions);
			}
			onQueueUpdateFunctions.push({func:onQueueUpdateFunction, scopeId:scopeId});
		}
		function cleanSubscriptions(ev) {
			for(var i=0; i<onQueueUpdateFunctions.length;) {
				if(onQueueUpdateFunctions[i].scopeId === ev.currentScope.$id) onQueueUpdateFunctions.splice(i,1);
				else i++;
			}
			for(var i=0; i<onPlayingUpdateFunctions.length;) {
				if(onPlayingUpdateFunctions[i].scopeId === ev.currentScope.$id) onPlayingUpdateFunctions.splice(i,1);
				else i++;
			}
		}
		$.getJSON(location.origin + '/poll', function (data) {
			updatePlaying(data.playing);
			updateQueue(data.queue, data.queueRepeat);
		});
		websockets.subscribe("PlayingUpdate", function(data) {
			updatePlaying(data.playing);
			updateQueue(data.queue, data.queueRepeat);
		});

		///////////////
		// Play song //
		///////////////
		this.playSong = function(song) {
			if(song) song = adapter.cleanSong(song);
			$.postJSON(location.origin + '/play', song, function (data) { });
		}

		////////////////
		// Pause song //
		////////////////
		this.pauseSong = function() {
			$.getJSON(location.origin + '/pause', function (data) { });
		}

		///////////////
		// Stop song //
		///////////////
		this.stopSong = function() {
			$.getJSON(location.origin + '/stop', function (data) { });
		}

		///////////////
		// Seek song //
		///////////////
		this.seekSong = function(time) {
			$.getJSON(location.origin + '/seek/' + time, function (data) { });
		}

		////////////////
		// Set volume //
		////////////////
		this.setVolume = function(volume) {
			if(volume < 0) volume = 0;
			if(volume > 100) volume = 100;
			settings.setVolumeSetting(volume);
		}

		////////////////
		// Queue next //
		////////////////
		this.queueNext = function() {
			var index = findInQueue(playing);
			if(index > -1) {
				index++;
				if(index >= queue.length) index = 0;
				$.postJSON(location.origin + '/play', adapter.cleanSong(queue[index]), function (data) { });
			}
		}

		////////////////
		// Queue back //
		////////////////
		this.queueBack = function() {
			var index = findInQueue(playing);
			if(index > -1) {
				index--;
				if(index < 0) index = queue.length-1;
				$.postJSON(location.origin + '/play', adapter.cleanSong(queue[index]), function (data) { });
			}
		}

		///////////////
		// Queue add //
		///////////////
		this.queueAdd = function(song) {
			var index = findInQueue(song);
			if(index == -1) {
				var newQueue = copy(queue);
				newQueue.push(song);
				$.postJSON(location.origin + '/queue/update', adapter.cleanSongs(newQueue), function (data) { });
			}
		}

		//////////////////
		// Queue remove //
		//////////////////
		this.queueRemove = function(song) {
			var index = findInQueue(song);
			if(index > -1) {
				var newQueue = copy(queue);
				newQueue.splice(index,1);
				$.postJSON(location.origin + '/queue/update', adapter.cleanSongs(newQueue), function (data) { });
			}
		}

		/////////////////
		// Queue clear //
		/////////////////
		this.queueClear = function() {
			$.postJSON(location.origin + '/queue/update', [], function (data) { });
		}

		///////////////
		// Queue set //
		///////////////
		this.queueSet = function(songs) {
			$.postJSON(location.origin + '/queue/update', adapter.cleanSongs(songs), function (data) { });
		}

		//////////////////
		// Queue repeat //
		//////////////////
		this.queueRepeat = function(repeat) {
			var val = "false";
			if(repeat) val = "true";
			$.getJSON(location.origin + '/queue/repeat/' + val, function (data) { });
		}

		///////////////////
		// Queue shuffle //
		///////////////////
		this.queueShuffle = function() {
			if(queue.length > 0) {
				var newQueue = copy(queue);
				newQueue = shuffle(newQueue);
				$.postJSON(location.origin + '/queue/update', adapter.cleanSongs(newQueue), function (data) { });
			}
		}
		
	});
}());