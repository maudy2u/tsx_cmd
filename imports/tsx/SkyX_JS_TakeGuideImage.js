/* Java Script */
/* Socket Start Packet */

//	
//	This JavaScript code simply connects to the guide camera and takes a picture
//
//	Ken Sturrock December 25, 2017
//

ccdsoftAutoguider.Connect();

ccdsoftAutoguider.Asynchronous = false;
ccdsoftAutoguider.Frame = 1;
ccdsoftAutoguider.Subframe = false;
ccdsoftAutoguider.ExposureTime = "$000";		// Set the normal exposure duration for "regular" images (from main script)	
ccdsoftAutoguider.AutoguiderExposureTime = "$000";	// Set the guide exposure duration to the same to preserve my sanity.
ccdsoftAutoguider.AutoSaveOn = true;			// This must be set for the image analysis routine to work later.

if (SelectedHardware.autoguiderCameraModel == "SBIG ST-i")
//
//	If an ST-i is selected as the guider, then the AutoDark will be activated.
//
{
	ccdsoftAutoguider.ImageReduction = 1;	
} 

if (ccdsoftCamera.PropStr("m_csObserver") == "Ken Sturrock")
//
// Do some custom stuff. If your name also happens to be "Ken Sturrock" and you own an EM-200 and/or EM-11
// then modify as appropriate.
//
// My EM-11 seems to like a slightly faster guide exposure time than my EM-200.
//
//
{
	if ( SelectedHardware.mountModel == "EM-200 Temma2" )
	//
	// This is the driver that I use for my EM-200 Temma 2
	//
	{
		ccdsoftAutoguider.ExposureTime = 5;
		ccdsoftAutoguider.AutoguiderExposureTime = 5;
		delay = 0;
	}

	if ( SelectedHardware.mountModel == "EM-200 Temma PC" )
	//
	// This is the driver that I use for my EM-11 Temma M
	// There isn't an actual driver for the Temma M and if I 
	// use the EM-11 Temma Jr. driver, it will try to "fake park" 
	// instead of actually turning the sidereal drive off.
	//
	{
		ccdsoftAutoguider.ExposureTime = 4;
		ccdsoftAutoguider.AutoguiderExposureTime = 4;
		delay = 0;
	}
}

ccdsoftAutoguider.TakeImage();

/* Socket End Packet */
