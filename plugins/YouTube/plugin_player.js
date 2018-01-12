/**********************************************************************
*	YouTube Plugin Script for Player Controls (Web Streaming Side)
***********************************************************************/
(function () {
	// Attributes
	var tagKey = "yt::";
	
	// Page items
	var playButton = null;
	var settingsButton = null;
	var autoplayButton = null;
	var annotationsButton = null;
	var videoStream = null;
	
	// Function hook for Page Load
	var onLoad = function() 
	{
		var getState = this.getState;
		
		// create splash page
		var cw = 32, ch = 22;
		var textElement = PageEditor.addElement('div', {innerHTML:"Streaming YouTube to Web Music Player!"}, {width:"100%", height:"45px", fontSize:"30px", textAlign:"center", fontFamily:"Roboto,Helvetica Neue,sans-serif"});
		var canvasElement = PageEditor.addElement('canvas', {id:"canvas", width:cw, height:ch}, {width:"500px", imageRendering:"pixelated", border:"5px solid #8f8f8f", position:"absolute", left:"calc(50% - 250px)"});
		
		// get controls
		function getControls() {
			if(playButton && settingsButton && videoStream) {
				videoStream.onplaying = function() {
					PluginPlayer.updatePlayingState(getState());
				};
				videoStream.onpause = function() {
					PluginPlayer.updatePlayingState(getState());
				};
				
				settingsButton.click();
				var settings = document.getElementsByClassName('ytp-menuitem');
				for(var s in settings) {
					var label = "";
					for(var c in settings[s].children) {
						if(settings[s].children[c].className == 'ytp-menuitem-label') {
							label = settings[s].children[c].innerText;
							break;
						}
					}
					if(label.indexOf('Autoplay') > -1) {
						autoplayButton = settings[s];
					} else if(label.indexOf('Annotations') > -1) {
						annotationsButton = settings[s];
					} else if(label.indexOf('Quality') > -1) {
						settings[s].click();
						var menu = document.getElementsByClassName('ytp-panel ytp-quality-menu')[0];
						function findButton(element, text) {
							if(element.innerText == text) return element;
							for(var c in element.children) {
								var rtn = findButton(element.children[c], text);
								if(rtn) return rtn;
							}
						}
						var qButton = findButton(menu, '240p');
						qButton.click();
					}
				}
			}
		}
		PageEditor.getElementsByClassName('ytp-play-button ytp-button', function(elements) {
			playButton = elements[0];
			getControls();
		});
		PageEditor.getElementsByClassName('ytp-button ytp-settings-button', function(elements) {
			settingsButton = elements[0];
			getControls();
		});
		PageEditor.getElementsByClassName('video-stream html5-main-video', function(elements) {
			videoStream = elements[0];
			getControls();
		});
		
		// video pass through
		PageEditor.getElementsByClassName('video-stream html5-main-video', function(elements) {
			if(elements && elements.length) {
				var context = canvasElement.getContext('2d');
				function draw(v,c,w,h) {
					c.drawImage(v,0,0,w,h);
					var data = c.getImageData(0, 3, 32, 16).data;
					var convertedData = new Uint8ClampedArray((data.length/4)*3);
					for(var i=0, j=0; j<data.length; j+=4) {
						convertedData[i++] = data[j];
						convertedData[i++] = data[j+1];
						convertedData[i++] = data[j+2];
					}
					PluginPlayer.sendVideoData(convertedData);
					setTimeout(draw,40,v,c,w,h);
				}
				draw(elements[0],context,cw,ch);
			}
		});
	}
	
	// Function responsible for relaying the current player state
	var getState = function() 
	{
		if(videoStream) {
			//if(autoplayButton.getAttribute('aria-checked') == 'true') autoplayButton.click();
			//if(annotationsButton.getAttribute('aria-checked') == 'true') annotationsButton.click();
			var timePercent = 0;
			var timeText = '--:--';
			var durationText = '--:--';
			var state = "processing";
			if(videoStream && !isNaN(videoStream.duration)) {
				if(videoStream.paused || videoStream.ended) state = 'paused';
				else if(videoStream.currentTime > 0 && videoStream.readyState > 2) state = 'playing';
				timePercent = (videoStream.currentTime*100)/videoStream.duration;
				timeText = PluginUtil.getTimeString(videoStream.currentTime);
				durationText = PluginUtil.getTimeString(videoStream.duration);
			}
			
			var tag = document.URL;
			var index = tag.indexOf('?v=');
			if(index > -1) tag = tag.substring(index+3, tag.length);
			return {
				tag: tagKey + tag,
				timePercent: timePercent,
				timeText: timeText,
				durationText: durationText,
				state: state,
				errorText: ""
			};
		}
		return null;
	}

	// Function hook for Play Command
	var onPlay = function(tag) 
	{
		var url = 'https://www.youtube.com/watch?v=' + tag.split(tagKey)[1];
		if(url != document.URL) {
			PluginPlayer.goToURL(url, tag);
		} else { 
			if(playButton) {
				if(playButton.getAttribute('aria-label') == "Play") playButton.click();
			}
		}
	};

	// Function hook for Pause Command
	var onPause = function() 
	{
		if(playButton) {
			if(playButton.getAttribute('aria-label') == "Pause") playButton.click();
		}
	};

	// Function hook for Seek Command
	var onSeek = function(s) 
	{
		if(videoStream) {
			videoStream.currentTime = (s/100) * videoStream.duration;
		}
	};

	// Register Plugin
	PluginPlayer.register({
		tagKey: tagKey,
		domain: "www.youtube.com",
		webOnly: ['watch', 'base'],
		wedExclude: [],
		domDelete: ['#early-body, #footer-container, #feed-privacy-lb, #hidden-component-template-wrapper, #a11y-announcements-container, #masthead-positioner, ' +
					'#masthead-positioner-height-offset, #guide, .alerts-wrapper, #header, #content, #theater-background, #player-unavailable, #watch-queue-mole, #player-playlist'],
		domHide: ['#player'],
		getState: getState,
		onLoad: onLoad,
		onPlay: onPlay,
		onPause: onPause,
		onSeek: onSeek
	});
}());
