/* Java Script */
/* Socket Start Packet */

//
//	Park the mount, disconnect cameras.
//
//	Ken Sturrock
//	Jaunary 13, 2018
// Stephen Townsend
// 2018-04-21
//
var lumFilter = $000;
var softPark = $001;
var errMsgs = "";	//Initialize variable to store any shutdown error messages.
var cr 			= "\n";

///////////////////////////////////////////////////////////////////////////////////////////
//			CAMERA SHUTDOWN SECTION
//
// This just sets the camera back to rational values before shutdown so that it won't try
// to take, for example, five miunute exposures when I start up next time and want to orient
// with an Image Link. Please change as desired. You may want to add statements for filter
// and reduction/calibration.
//
// Whatever makes your life better the next time you turn it on.
//

ccdsoftCamera.ExposureTime = 10;		// Set the exposure to 10 seconds
ccdsoftCamera.AutoSaveOn = true;		// Keep the image
ccdsoftCamera.Frame = 1;			// It's a light frame
ccdsoftCamera.Delay = 1;			// Pause one second
ccdsoftCamera.Subframe = false;			// Not a subframe
ccdsoftCamera.FilterIndexZeroBased = lumFilter;	// Set the filter to Luminance
try
{
	ccdsoftAutoguider.Disconnect();
}
catch (repErr)
//
//	If error, report it.
//
{
	errMsgs += "Guider: " + refErr + cr;
}

try
{
	ccdsoftCamera.Disconnect();
}
catch (repErr)
//
//	If error, report it.
//
{
	errMsgs += "Camera: " + refErr + cr;
}

if( SelectedHardware.mountModel !== "Telescope Mount Simulator" ) {
	if (!softPark ) {
		try {
			 sky6RASCOMTele.ParkAndDoNotDisconnect();
			 errMsgs = 'Parked';
		}
		catch(e) {
			sky6RASCOMTele.SetTracking(0, 1, 0 ,0);
			errMsgs = 'Soft Parked';
		}
	}
	else {
			sky6RASCOMTele.SetTracking(0, 1, 0 ,0);
			errMsgs = 'Soft Parked';
	}
}
errMsgs
/* Socket End Packet */
