/**********************************************************************
*	Plugin Template Script for Player Controls (Web Streaming Side)
***********************************************************************/
(function () {
	// Attributes
	var tagKey = "sc::";
	
	// Data
	var player = null;
	var duration = null;
	var state_tag = null;
	var state_timePercent = 0;
	var state_timeText = '--:--';
	var state_durationText = '--:--';
	var state_state = "processing";
	var state_state_old = null
	
	// Function hook for Page Load
	var onLoad = function() 
	{
		var getState = this.getState;
		var url = document.URL;
		var start = url.indexOf('soundcloud.com/');
		var first = url.indexOf('/', start);
		var second = url.indexOf('/', first+1);
		state_tag = tagKey + url.substring(first+1,second) + ':' + url.substring(second+1,url.length);
				
		PageEditor.loadScript("https://w.soundcloud.com/player/api.js");
		var cw = 32, ch = 32;
		var textElement = PageEditor.addElement('div', {innerHTML:"Streaming SoundCloud to Web Music Player!"}, {width:"100%", height:"45px", fontSize:"30px", textAlign:"center", fontFamily:"Roboto,Helvetica Neue,sans-serif"});
		var canvasElement = PageEditor.addElement('canvas', {id:"canvas", width:cw, height:ch}, {width:"500px", imageRendering:"pixelated", border:"5px solid #8f8f8f", position:"absolute", left:"calc(50% - 250px)"});
		document.body.style["background-color"] = "#FFF";
		
		var ifrm = document.createElement('iframe');
		ifrm.setAttribute('style', 'display:none;');
		ifrm.setAttribute('src', 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(window.location.href) + '&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=true');
		var playerWidget = SC.Widget(ifrm);
		playerWidget.bind(SC.Widget.Events.READY, function() {
			player = playerWidget;
			
			// load image to canvas
			playerWidget.getCurrentSound(function(data) {
				duration = data.duration;
				state_durationText = PluginUtil.getTimeString(data.duration/1000);
				
				var img = new Image;
				img.crossOrigin = "Anonymous";
				img.onload = function(){
					var context = canvasElement.getContext('2d');
					context.drawImage(img,0,0,cw,ch);
					function sendImageData(c,w,h) {
						var data = c.getImageData(0, 0, 32, 16).data;
						var convertedData = new Uint8ClampedArray((data.length/4)*3);
						for(var i=0, j=0; j<data.length; j+=4) {
							convertedData[i++] = data[j];
							convertedData[i++] = data[j+1];
							convertedData[i++] = data[j+2];
						}
						PluginPlayer.sendVideoData(convertedData);
						setTimeout(sendImageData,500,c,w,h);
					}
					sendImageData(context,cw,ch);
				};
				img.src = data.artwork_url;
			});
			
			// subscriptions
			var updateState = function(data) {
				state_timePercent = data.relativePosition*100;
				state_timeText = PluginUtil.getTimeString(data.currentPosition/1000);
				
				if(state_state == "processing") {
					if(data.loadedProgress > 0 && state_state_old) state_state = state_state_old;
				} else if(data.loadedProgress == 0) {
					state_state_old = state_state;
					state_state = "processing";
				}
			};
			playerWidget.bind(SC.Widget.Events.PLAY_PROGRESS, function(data) {
				updateState(data);
			});
			playerWidget.bind(SC.Widget.Events.PLAY, function(data) {
				state_state = "playing";
				updateState(data);
				PluginPlayer.updatePlayingState(getState());
			});
			playerWidget.bind(SC.Widget.Events.PAUSE, function(data) {
				state_state = "paused";
				updateState(data);
				PluginPlayer.updatePlayingState(getState());
			});
			playerWidget.bind(SC.Widget.Events.FINISH, function(data) {
				state_state = "paused";
				updateState(data);
				PluginPlayer.updatePlayingState(getState());
			});
			playerWidget.bind(SC.Widget.Events.SEEK, function(data) {
				updateState(data);
				PluginPlayer.updatePlayingState(getState());
			});
		});
		document.body.appendChild(ifrm);
	};
	
	// Function responsible for relaying the current player state
	var getState = function() 
	{
		return {
			tag: state_tag,
			timePercent: state_timePercent,
			timeText: state_timeText,
			durationText: state_durationText,
			state: state_state,
			errorText: ""
		}
	};

	// Function hook for Play Command
	var onPlay = function(tag) 
	{
		var tagoff = tag.split(tagKey)[1];
		var url = 'https://soundcloud.com/' + tagoff.split(':')[0] + '/' + tagoff.split(':')[1];
		if(url != document.URL) {
			PluginPlayer.goToURL(url, tag);
		} else {
			if(player) player.play();
		}
	};

	// Function hook for Pause Command
	var onPause = function() 
	{
		if(player) player.pause();
	};

	// Function hook for Seek Command
	var onSeek = function(s) 
	{
		if(player && duration) player.seekTo((s/100)*duration);
	};

	// Register Plugin
	PluginPlayer.register({
		tagKey: "sc::",
		domain: "soundcloud.com",
		webOnly: null, /* only webrequests with the given key words will load */
		wedExclude: ['api-v2.soundcloud', 'a-v2.sndcdn'], /* webrequests with the given key words will be blocked */
		domDelete: ['#app'], /* DOM elements to delete */
		domHide: null, /* DOM elements to hide */
		getState: getState,
		onLoad: onLoad,
		onPlay: onPlay,
		onPause: onPause,
		onSeek: onSeek
	});
}());
