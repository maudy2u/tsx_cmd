# tsx_cmd
meteor-react javascript server for TheSkyX and astrophotography

This is hobbist solution to imaging with TheSkyX using a web page and a nodejs server. The nodejs server is a meteor and mongoDB solution. The server is intended to be a clean install and removal, i.e. delete the directory and it is gone.

## Use case:
- All equipement is setup correctly: mount (Myt), imaing camera, rotator, autoguider, filter wheel, focuser.
- All imaging euqipement is confirmed to work with TheSkyX, i.e. this app is not really needed
- There is a PC (the PC), such as an ODroid XU4, Mac, RPI3, used to run TheSkyX
- The PC is networked into your LAN via ethernet or Wifi
- There is no need for security, such as user accounts
- the PC has  can be used to install Tsx_Cmd server - nodejs, mongoDB
- Access and use of the PC's commmand line, such as via ssh
- Web browser to access Tsx_Cmd running on the PC, such as Safari, Chrome on another Mac,
iPhone or the PC
- Desire to automate an nights imaging session and plan by defining targets, take series,
Flat series, FOV rotation, and Calibration of the Autoguider
- Capture targets based on start/stop times, priority, and minimum altitude
- Automate meridian flips, autoguiding, and autoguider calibration, rotating FOV per target,
doing 1 or more targets in a night
- Automatically stopping sessions once sun reached altitude, such as -11.5 degrees
- Failed CLS pause the session for some time, and then keep trying CLS peridocialy until stopped
- Periodic CLS to check for clouds

## Versions:
- Targets and take series work
- Calibration of autoguider does not worked binned
- Beta version of cloud checking implemented.
