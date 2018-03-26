// import { Meteor } from 'meteor/meteor';
/* Java Script */
/* Socket Start Packet */

//
//	This JavaScript code simply connects to the imaging camera and takes a picture.
//
//	$000 and $001 represent filter and exposure. They are replaced by tsxfeeder.
//
//	Thanks to Matt Bisque for helping me with the QSI readout mode toggle.
//
//	Ken Sturrock
//	January 13, 2018
//
export function tsxCmdTakeImage(filter, exposure) {
var Out = '\
/* Java Script */\
/* Socket Start Packet */\
while (!ccdsoftCamera.State == 0)\
{\
	sky6Web.Sleep (1000);\
}\
\
ccdsoftCamera.Asynchronous = false;\
ccdsoftCamera.ExposureTime = '+exposure+';\
ccdsoftCamera.AutoSaveOn = true;\
ccdsoftCamera.ImageReduction = 0;\
ccdsoftCamera.Frame = 1;\
ccdsoftCamera.Subframe = false;\
\
if ( SelectedHardware.filterWheelModel !== "<No Filter Wheel Selected>" )\
{\
	ccdsoftCamera.filterWheelConnect();\
	ccdsoftCamera.FilterIndexZeroBased = '+filter+';\
}\
ccdsoftCamera.TakeImage();\
Out="Success|";\
/* Socket End Packet */\
';
return Out;
}
