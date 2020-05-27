/* Java Script */
/* Socket Start Packet */

//
//	Park the mount, disconnect cameras.
//
//	Ken Sturrock
//	Jaunary 13, 2018
//  Stephen Townsend
//  2018-04-21, 2020-05-24
//
var lumFilter = $000;
var softPark = $001;
var errMsgs = "";	//Initialize variable to store any shutdown error messages.
var CR 			= "|";

///////////////////////////////////////////////////////////////////////////////////////////
//			CAMERA SHUTDOWN SECTION
//
// This just sets the camera back to rational values before shutdown so that it won't try
// to take, for example, five miunute exposures when I start up next time and want to orient
// with an Image Link. Please change as desired. You may want to add statements for filter
// and reduction/calibration.
//
// Whatever makes your life better the next time you turn it on.
ccdsoftCamera.ExposureTime = 10;		// Set the exposure to 10 seconds
ccdsoftCamera.AutoSaveOn = true;		// Keep the image
ccdsoftCamera.Frame = 1;			// It's a light frame
ccdsoftCamera.Delay = 1;			// Pause one second
ccdsoftCamera.Subframe = false;			// Not a subframe
ccdsoftCamera.FilterIndexZeroBased = lumFilter;	// Set the filter to Luminance
// If soft park do not disconnect camera to keep it cooling?
if (!softPark ) {
	try {
		ccdsoftAutoguider.Disconnect();
	}
	catch (repErr) 	{
		errMsgs += "Guider|" + refErr + CR;
	}

	try {
		ccdsoftCamera.Disconnect();
	}
	catch (repErr) {
		errMsgs += "Camera|" + refErr + CR;
	}
}

if( SelectedHardware.mountModel !== "Telescope Mount Simulator" ) {
	if (!softPark ) {
		try {
			if(!sky6RASCOMTele.IsParked() ){
				sky6RASCOMTele.ParkAndDoNotDisconnect();
 			 	while( !sky6RASCOMTele.IsParked() ) {
					sky6Web.Sleep(1000);
 			 	}
		 	}
			errMsgs = 'Parked';
		}
		catch(e) {
			sky6RASCOMTele.SetTracking(0, 1, 0 ,0);
			errMsgs = 'Parking - Failed - Soft Parked';
		}
	}
	else {
		if( sky6RASCOMTele.IsParked() ){
			try{
				sky6RASCOMTele.Unpark();
			}
			catch(e) {
				errMsgs = 'Soft Parking - Failed - stopped tracking';
			}
		}
		sky6RASCOMTele.SetTracking(0, 1, 0 ,0);
		errMsgs = 'Soft Parked';
	}
}
else {
	errMsgs = 'Parked';
}
sky6Web.Sleep(3000); // needed if command is too fast
errMsgs
/* Socket End Packet */
