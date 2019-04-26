# tsx_cmd
meteor-react javascript server for TheSkyX and astrophotography

This is a hobbyist solution to imaging with TheSkyX using a web page and a nodejs server. The nodejs server is a meteor and mongoDB solution. The server is intended to be a clean install and removal, i.e. delete the directory and it is gone.

... A really fast setup, download and run script in an empty directory: `bin/tsx_cmd_install.sh`
... then run `tsx_cmd_start.sh`, and configure

## Use case:

### Prerequisites:
- All equipment is setup correctly: mount (Myt), imaging camera, rotator, autoguider, filter wheel, focuser.
- All imaging equipment is confirmed to work with TheSkyX, i.e. this app is not really needed
- There is a PC (the PC), such as an ODroid XU4, Mac, RPI3, used to run TheSkyX
- The PC is networked into your LAN via ethernet or Wifi
- There is no need for security, such as user accounts
- the PC has  can be used to install Tsx_Cmd server - nodejs, mongoDB
- Access and use of the PC's command line, such as via ssh

### Description
- Use a web browser to access Tsx_Cmd running on the PC, such as Safari, Chrome via a Mac, iPad,
iPhone or the PC
- Desire to automate an nights imaging session and plan by defining targets, take series,
Flat series, FOV rotation, and Calibration of the Autoguider
- Capture targets based on start/stop times, priority, and minimum altitude
- Automate meridian flips, autoguiding, and autoguider calibration, rotating FOV per target,
doing 1 or more targets in a night
- Automatically stopping sessions once sun reached altitude, such as -11.5 degrees
- Failed CLS pause the session for some time, and then keep trying CLS periodically until stopped
- Periodic CLS to check for clouds
- Check the possible schedule of targets via the Night Planner
- Toggle the enabling and disabling of targets to capture
- Click single button to start the planned session

---
## Install TSX_cmd
[Project - TSX Command](bear://x-callback-url/open-note?id=CD71E4DF-EF35-414B-8543-4038D2330CB3-1082-00000289114BA390)

1. Create a directory for tsx_cmd, it can need ~500MB once installed
	- or clone this whole repository: git clone https://github.com/maudy2u/tsx_cmd

2. Decide to install precompile or development versions
	- **RECOMMENDED:** Fast starting: ([Release 1.8 Initial release to GitHub · maudy2u/tsx_cmd · GitHub](https://github.com/maudy2u/tsx_cmd/releases/tag/RC8)) - fast start
	- Development… clone this repository

3. Fast start, just download this script:

	- `bin/tsx_cmd_install.sh`
	- Which will install:

		- nodejs
		- mongodb
		- tsx_cmd
	  - `tsx_cmd_start.sh` - run once install completes
	  - `tsx_cmd_stop.sh` - use another terminal to stop
	  - `tsx_cmd_update.sh` - future - used to install new binary release

## Start TSX
Start up TSX, use simulator to test as you wish:

	- turn on the server
	- turn off script debugger

## Start TSX_CMD

Open command prompt (Assumes Fast start)
	1. Run `tsx_cmd_install.sh init` from the directory you installed tsx_cmd.
	2. Run `tsx_cmd_start.sh`

If Development version, experience with meteor is assumed.

## Setup TSX

Open a browser: http://localhost:3000/ (or replace with the ip of the PC/SBC running tsx_cmd):

	1. Click on TSXIP and TSXPort to set to the TSX server
	2. Click on the wifi symbol in top right - to load filter wheel, and equipment details to confirm connections. ::This needs to be redone when filters change::
	3. Click the Wrench to setup your imaging equipment details: focal length, pixels, twilight… *If there is no Default filter, return  to step 2.*
	4. Click Calibration icon, if doing flats for the filter exposures

## Create your Night session

	1. Open a browser: http://localhost:3000/ (or replace with the ip of the PC/SBC running tsx_cmd)
	2. Click the Series button to define the Imaging session: LLRGD, SHO…
	3. Click the Targets Menu to create your Objects, assigning a series, and its constraints
		- Enable targets

## Start up

	1. Open a browser: http://localhost:3000/ (or replace with the ip of the PC/SBC running tsx_cmd)
	2. Click the Scheduler at top to view night plans
	3. Click Agent button to toggle, meridian flip, re-focusing, autoguiding, twilight checks…
	4. Click Play button to start.
---
## History:
- Targets and take series improvements
- Calibration of autoguider improvements
- Beta version of cloud checking implemented.
- Added Night planner

#tsx_cmd #./how-to
