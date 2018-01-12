/**********************************************************************
*	Plugin Template Script for UI Search (Web UI Side)
***********************************************************************/
(function () {
	// Attributes
	var tagKey = "sc::";
	
	// Search for stream details related to the given song
	var search = function(song, callback) {
		/* Song Parameter
		*	title - title of the song
		*	artist - artist of the song
		*	album - album of the song
		*/
		
		/* Return to callback either NULL or a list of stream objects
		*	text - stream identifying text
		*	img - stream identifying image url
		*	tag - stream tag
		*/
		callback(null);
	};
	
	// Get a song tag from the given url
	var decodeUrl = function(url, callback) {
		var tag = null;
		var start = url.indexOf('soundcloud.com/');
		if(start > -1) {
			var first = url.indexOf('/', start);
			var second = url.indexOf('/', first+1);
			if(first > start && second > start) tag = tagKey + url.substring(first+1,second) + ':' + url.substring(second+1,url.length);
		}
		callback(tag);
	};
	
	// Get stream data from a song tag
	var getStream = function(tag, callback) {
		var url = "https://soundcloud.com/" + tag.substring(4, tag.length).replace(':', '/');
		var ifrm = document.createElement('iframe');
		ifrm.setAttribute('style', 'display:none;');
		ifrm.setAttribute('src', 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(url) + '&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=true');
		document.body.appendChild(ifrm);
		var player = SC.Widget(ifrm);
		player.bind(SC.Widget.Events.READY, function() {
			player.getCurrentSound(function(data) {
				ifrm.parentNode.removeChild(ifrm);
				var text = data.title;
				if(data.publisher_metadata) text += " - " + data.publisher_metadata.artist;
				callback({
					text: text,
					img: data.artwork_url,
					tag: tag
				});
			});
		});
	};
	
	// Include soundcloud script
	var head= document.getElementsByTagName('head')[0];
	var script= document.createElement('script');
	script.type= 'text/javascript';
	script.src= 'https://w.soundcloud.com/player/api.js';
	head.appendChild(script);
		
	// Post plugin data in global location
	window.PluginData = {
		icon: "plugins/SoundCloud/data/icon.png",
		tagKey: tagKey,
		search: search,
		decodeUrl: decodeUrl,
		getStream: getStream
	};
}());
