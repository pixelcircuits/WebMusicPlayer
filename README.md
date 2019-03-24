# Web Music Player
The Web Music Player is a music platform designed to play music from across the web by utilizing a simple chrome browser. The intent is to designate a computer to host a server and play music for other devices to control through a web interface. Perfect for the Raspberry Pi, this project also includes a local Pixel Visualizer interface, using the Pixel Display and an RF remote, to control the music and provide a visualizer. Refer to the documentation to learn about how to use the Web Music Player.

* [Hackaday](https://hackaday.io/project/28448-web-music-player) - Project Page

## Setup (Raspbian Desktop)
The Web Music Player is only guaranteed to work on the Raspberry Pi 3 and needs the latest version of full Raspbian with the desktop to run (Stretch 2017-11-29). Refer to [this tutorial](https://www.raspberrypi.org/documentation/installation/installing-images/README.md) first for getting Raspbian OS up and running.

**1. Configure Wifi**

Setup wifi connection by clicking on the wifi icon, selecting your wifi network and entering the password.

**2. Enable SPI (for Pixel Visualizer)**

If you want to run the Pixel Visualizer Interface, make sure SPI is enabled. Under ‘Preferences -> Raspberry Pi Configuration’, check enabled for SPI under ‘Interfaces’ and click ‘OK’.

**3. Download and Install**

Open a command prompt and enter the following commands to download and install the Web Music Player. The install script will download/install node.js as well as update the chromium-browser to avoid a small bug in the current version of Raspbian Stretch.
```
git clone https://github.com/pixelcircuits/WebMusicPlayer 
bash WebMusicPlayer/Install.sh
```

**4. Run on Boot**

To run the Web Music Player simply run the Start.sh script in the project folder. To run the Pixel Visualizer Interface as well you need to add the ‘-v’ flag when running the script. To run on boot, open the file explorer and type '/home/pi/.config/lxsession/LXDE-pi' in the address bar. Then open the file 'autostart' and add the following line.
```
@/home/pi/WebMusicPlayer/Start.sh
```
Or the following line to also run the Pixel Visualizer Interface on start. 
```
@/home/pi/WebMusicPlayer/Start.sh -v
```

## License

This project is licensed under the GPL License - see the [LICENSE.md](LICENSE.md) file for details
