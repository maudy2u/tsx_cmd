/* Java Script */
/* Socket Start Packet */

//
//	Park the mount, disconnect cameras.
//
//	Ken Sturrock
//	Jaunary 13, 2018
//  Stephen Townsend
//  2018-04-21
//

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

try
{
	ccdsoftAutoguider.Connect();
}
catch (repErr) {
	errMsgs += "Guider: " + refErr + cr;
}

try
{
	ccdsoftCamera.Connect();
}
catch (repErr) {
	errMsgs += "Camera: " + refErr + cr;
}

if( SelectedHardware.mountModel !== "Telescope Mount Simulator" ) {
	try {
		if( sky6RASCOMTele.isParked() ) {
			sky6RASCOMTele.Unpark();
		}
		 errMsgs = 'unparked';
	}
	catch(e) {
		sky6RASCOMTele.SetTracking(0, 1, 0 ,0);
		errMsgs = 'unparked';
	}
}
errMsgs
/* Socket End Packet */
