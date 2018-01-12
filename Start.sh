#!/bin/bash
BASEDIR=$(dirname "$0")
VISUALIZER=false
while getopts ":v" opt; do
  case $opt in
    v)
      VISUALIZER=true
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      ;;
  esac
done
cd $BASEDIR

#Start WebMusicPlayer Server with WebUI
sudo node ./server.js &
sleep 6

#Start Chrome Browser with WebMusicPlayer ChromeLink
/usr/bin/chromium-browser localhost/lite.html --alsa-output-device=hw:Loopback,0,0 --load-extension=./chromelink --user-agent="Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36" --disable-background-timer-throttling --disable-renderer-backgrounding --new-window &
sleep 6

#Start VisualizerUI for WebMusicPlayer
if $VISUALIZER ; then
  cd visualizerUI
  sudo ./VisualizerUI
fi
