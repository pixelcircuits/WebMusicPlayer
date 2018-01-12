///////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////// Player ////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
var Player = function () {};

// Modules
var ws = require('./websockets.js');
var ad = require('./adapter.js');
var audio = require('./audio.js');


// Player data
var songAtEnd = true;
var player_data = {
	playing: {},
	queue: [],
	queueRepeat: true,
	volume: 75
};


// Helper functions
var clearPlaying = function() {
	player_data.playing.id = '';
	player_data.playing.tag = '';
	player_data.playing.title = '';
	player_data.playing.artist = '';
	player_data.playing.album = '';
	player_data.playing.albumArt = '';
	player_data.playing.albumArtIcon = '';
	player_data.playing.timePercent = 0;
	player_data.playing.timeText = "--:--";
	player_data.playing.durationText = "--:--";
	player_data.playing.state = "error";
	player_data.playing.errorText = "Player not connected.";
}
var copyToPlaying = function(song) {
	player_data.playing.id = song.id;
	player_data.playing.tag = song.tag;
	player_data.playing.title = song.title;
	player_data.playing.artist = song.artist;
	player_data.playing.album = song.album;
	player_data.playing.albumArt = song.albumArt;
	player_data.playing.albumArtIcon = song.albumArtIcon;
}
var playNextInQueue = function() {
	if(player_data.queue.length > 1) {
		var index = -1;
		for(var i=0; i<player_data.queue.length; i++) {
			if(player_data.queue[i].id == player_data.playing.id) {
				index = i;
				break;
			}
		}
		if(index > -1) {
			index++;
			if(index >= player_data.queue.length) {
				if(player_data.queueRepeat) index = 0;
				else index = -1;
			} 
		}
		if(index > -1) {
			copyToPlaying(player_data.queue[index]);
			if(!ws.publish_p("Play", player_data.playing.tag)) {
				clearPlaying();
				player_data.playing.errorText = "Player not connected.";
				publishPlayingUpdate();
			}
		}
	}
}
var getSecondsLeft = function(data) {
	var duration = parseInt(data.durationText.split(':')[0])*60 + parseInt(data.durationText.split(':')[1]);
	return (duration/100)*(100-data.timePercent);
}
clearPlaying();

// Helper for publishing player data
var publishPlayingUpdate = function() {	
	player_data.volume = audio.getVolume();
	ws.publish_c("PlayingUpdate", JSON.stringify(player_data));
}

// Player websocket messages
ws.subscribe_p("Connected", function(data) {
	clearPlaying();
	player_data.playing.state = "null";
	player_data.playing.errorText = "";
	publishPlayingUpdate();
});
ws.subscribe_p("Closed", function(data) {
	clearPlaying();
	publishPlayingUpdate();
});
ws.subscribe_p("VideoData", function(data) {
	ws.publish_c("VideoData", data, true);
});
ws.subscribe_p("PlayingUpdate", function(data) {
	for(var a in data) {
		if(player_data.playing[a] !== undefined) player_data.playing[a] = data[a];
	}
	
	//check for end of song
	if(getSecondsLeft(data) < 1) {
		if(!songAtEnd) {
			playNextInQueue();
			songAtEnd = true;
		}
	} else {
		songAtEnd = false;
	}
	
	publishPlayingUpdate();
}, 'json');


// Player controls
Player.prototype.play = function(song) {
	var tag = player_data.playing.tag;
	if(song && song.tag) {
		tag = song.tag;
		copyToPlaying(ad.cleanSong(song));
	}	
	if(!ws.publish_p("Play", tag)) {
		clearPlaying();
		player_data.playing.errorText = "Player not connected.";
		publishPlayingUpdate();
	}
}
Player.prototype.pause = function() {
	if(!ws.publish_p("Pause", "")) {
		clearPlaying();
		player_data.playing.errorText = "Player not connected.";
		publishPlayingUpdate();
	}
}
Player.prototype.stop = function() {
	//Not currently impemented/used
}
Player.prototype.seek = function(seek) {
	if(!ws.publish_p("Seek", "" + seek)) {
		clearPlaying();
		player_data.playing.errorText = "Player not connected.";
		publishPlayingUpdate();
	}
}

// Queue controls
Player.prototype.queueUpdate = function(newQueue) {
	player_data.queue = ad.cleanSongs(newQueue);
	publishPlayingUpdate();
}
Player.prototype.queueRepeat = function(repeat) {
	player_data.queueRepeat = repeat;
	publishPlayingUpdate();
}

// Basic controls
Player.prototype.getData = function() {
	player_data.volume = audio.getVolume();
	return player_data;
}
Player.prototype.updateData = function(song, visuals) {
	if(visuals) {
		ws.publish_c("VisualsData", JSON.stringify(visuals), true);
	}
	if(song) {
		if(song.id == player_data.playing.id) copyToPlaying(song);
		for(var i=0; i<player_data.queue.length; i++) {
			if(player_data.queue[i].id == song.id) player_data.queue[i] = song;
		}
		publishPlayingUpdate();
	}
}
Player.prototype.updateDataDelete = function(songId) {
		for(var i=0; i<player_data.queue.length; i++) {
			if(player_data.queue[i].id == songId) player_data.queue.splice(i, 1);
		}
		publishPlayingUpdate();
}


//////////////////////////
// Export Player Object //
//////////////////////////
module.exports = new Player();
