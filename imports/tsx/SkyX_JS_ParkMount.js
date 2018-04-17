/* Java Script */
/* Socket Start Packet */

//
//	Park the mount, disconnect cameras.
//
//	Ken Sturrock
//	Jaunary 13, 2018
//
var lumFilter = $000;
var softPark =$001;
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

if (ccdsoftCamera.PropStr("m_csObserver") == "Ken Sturrock")
//
// This pulls the "observer name" to see if it's me. It then sets my defaults up for specific
// equipment so that I can leave the variables in the main script generic for others.
//
// This shouldn't have any effect on you unless your name is also "Ken Sturrock" and you have the same
// gear that I have. Just leave it alone, unless you want to change it for specific gear you own.
//
{

	if ( SelectedHardware.cameraModel == "ASICamera" )
	//
	// Set this for my ASI setup
	//
	{
		ccdsoftCamera.ImageReduction = 0;
		ccdsoftCamera.FilterIndexZeroBased = 0;
		ccdsoftCamera.TemperatureSetPoint = 1;
	}

	if ( SelectedHardware.cameraModel == "QSI Camera  " )
	//
	// Set this for my QSI setup
	//
	{
		ccdsoftCamera.ImageReduction = 1;
		ccdsoftCamera.FilterIndexZeroBased = 0;
		ccdsoftCamera.TemperatureSetPoint = 1;
	}

}



// You can comment these two lines if you would rather not disconnect the cameras.
//
// Note that disconnecting the camera will wipe out any @Focus2 thermal or offset models
// and any subsequentr script runs probably won't focus correctly.
//
// If you "hard code" your offsets then it's not a problem and you can leave these as they
// are so that your camera's TEC will turn off.
//

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



// 			PARKABLE MOUNT SECTION
// Uncomment this and comment out the section below if your mount can park properly and you have set a "park point".
// sky6RASCOMTele.ParkAndDoNotDisconnect();




//			"DUMB" MOUNT SECTION
// This is for mounts like my Temma system since it can't technically park. It just points to Kochab or Beta Octantis
// and shuts off the tracking motor.
//
// If you uncommented out the park line above, then comment out this whole code block to the end.
//
// The script is smart enough to restart tracking before another run. If you want to "manually"
// command a slew, you'll need to turn tracking back on under the telescope tab.
//

if (!softPark) {


sky6StarChart.DocumentProperty(0);
var latitude = sky6StarChart.DocPropOut

if (latitude < 0)
{

	// We are in the southern hemisphere. Aim South.

	sky6StarChart.Find("HIP112405");

	sky6ObjectInformation.Property(54); 				// Pull the RA value
	var targetRA = sky6ObjectInformation.ObjInfoPropOut; 		// Stuff RA into variable

	sky6ObjectInformation.Property(55); 				// Pull the DEC value
	var targetDEC = sky6ObjectInformation.ObjInfoPropOut; 		// Stuff DEC into variable

	try
	{
		sky6RASCOMTele.SlewToRaDec(targetRA, targetDEC, "Beta Octantis"); 	// Go to the RA & DEC
	}
		catch (repErr)
		//
		//	If error, report it.
		//
		{
			errMsgs += "Mount: " + refErr + cr;
		}



} else {

	// We are in the northern hemisphere. Aim North.

	sky6StarChart.Find("kochab");

	sky6ObjectInformation.Property(54); 				// Pull the RA value
	var targetRA = sky6ObjectInformation.ObjInfoPropOut; 		// Stuff RA into variable

	sky6ObjectInformation.Property(55); 				// Pull the DEC value
	var targetDEC = sky6ObjectInformation.ObjInfoPropOut; 		// Stuff DEC into variable


	try
	{
		sky6RASCOMTele.SlewToRaDec(targetRA, targetDEC, "Kochab"); 	// Go to the RA & DEC
	}
		catch (repErr)
		//
		//	If error, report it.
		//
		{
			errMsgs += "Mount: " + refErr + cr;
		}

}
}

if ( SelectedHardware.mountModel !== "Telescope Mount Simulator")
//
// See if we are running the simulator, if we are not using the simulator
// then set the tracking speed below.
//
{
	sky6RASCOMTele.SetTracking(0, 1, 0 ,0);
}

//
//		END "DUMB MOUNT SECTION
//

errMsgs

/* Socket End Packet */
