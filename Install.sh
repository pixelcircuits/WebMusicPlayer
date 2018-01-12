#!/bin/bash
BASEDIR=$(dirname "$0")
cd $BASEDIR

#download and install node.js
wget https://nodejs.org/dist/v9.0.0/node-v9.0.0-linux-armv6l.tar.xz
tar -xvf node-v9.0.0-linux-armv6l.tar.xz
sudo cp -R node-v9.0.0-linux-armv6l/* /usr/local/
rm -r node-v9.0.0-linux-armv6l
rm node-v9.0.0-linux-armv6l.tar.xz
npm install

#make scripts runnable
chmod +x Start
chmod +x End
chmod +x visualizerUI/VisualizerUI

#update chromium-browser
wget http://ports.ubuntu.com/pool/universe/c/chromium-browser/chromium-codecs-ffmpeg-extra_61.0.3163.100-0ubuntu1.1378_armhf.deb
wget http://ports.ubuntu.com/pool/universe/c/chromium-browser/chromium-browser-l10n_61.0.3163.100-0ubuntu1.1378_all.deb
wget http://ports.ubuntu.com/pool/universe/c/chromium-browser/chromium-browser_61.0.3163.100-0ubuntu1.1378_armhf.deb
sudo dpkg -i chromium-codecs-ffmpeg-extra_61.0.3163.100-0ubuntu1.1378_armhf.deb
sudo dpkg -i chromium-browser-l10n_61.0.3163.100-0ubuntu1.1378_all.deb chromium-browser_61.0.3163.100-0ubuntu1.1378_armhf.deb
rm chromium-codecs-ffmpeg-extra_61.0.3163.100-0ubuntu1.1378_armhf.deb
rm chromium-browser-l10n_61.0.3163.100-0ubuntu1.1378_all.deb
rm chromium-browser_61.0.3163.100-0ubuntu1.1378_armhf.deb
