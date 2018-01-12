/**********************************************************************
*	YouTube Plugin Script for UI Search (Web UI Side)
***********************************************************************/
(function () {
	// Attributes
	var tagKey = "yt::";
	
	// YouTube api key
	var apiKey='AIzaSyBvXFO898wkJxNwRyQ4pfOt5UWwwn7XstM';
	
	// Search for stream details related to the given song
	var search = function(song, callback) {
		if(song.title && song.artist) {
			var url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&key=' + apiKey + '&maxResults=10&q=' + (song.title + ' - ' + song.artist).split(' ').join('+');
			$.getJSON(url, function (data) {
				var streams = [];
				var includedTags = [];
				for(var i=0; i<data.items.length; i++) {
					if(data.items[i].id.videoId) {
						var tag = tagKey + data.items[i].id.videoId;
						if(includedTags.indexOf(tag) == -1 && tag != song.tag) {
							includedTags.push(tag);
							streams.push({
								text: data.items[i].snippet.title,
								img: data.items[i].snippet.thumbnails.medium.url,
								tag: tag
							});	
						}
					}
				}
				callback(streams);
			});
		} else callback(null);
	};
	
	// Get a song tag from the given url
	var decodeUrl = function(url, callback) {
		var tag = null;
		if(url.indexOf('youtube.com/watch') > -1) {
			var index = url.indexOf('?v=');
			if(index > -1) tag = tagKey + url.substring(index+3, url.length);
		}
		callback(tag);
	};
	
	// Get stream data from a song tag
	var getStream = function(tag, callback) {
		var url = 'https://www.googleapis.com/youtube/v3/videos?part=snippet&key=' + apiKey + '&id=' + tag.substring(4, tag.length);
		$.getJSON(url, function (data) {
			if(data.items && data.items[0]) {
				callback({
					text: data.items[0].snippet.title,
					img: data.items[0].snippet.thumbnails.medium.url,
					tag: tag
				});
			} else callback(null);
		});
	};
		
	// Post plugin data in global location
	window.PluginData = {
		icon: "plugins/YouTube/data/icon.png",
		tagKey: tagKey,
		search: search,
		decodeUrl: decodeUrl,
		getStream: getStream
	};
}());