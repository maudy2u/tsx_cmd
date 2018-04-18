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
ccdsoftAutoguider.ExposureTime = 7;		// Set the normal exposure duration for "regular" images (from main script)
ccdsoftAutoguider.AutoguiderExposureTime = 7;	// Set the guide exposure duration to the same to preserve my sanity.
ccdsoftAutoguider.AutoSaveOn = true;			// This must be set for the image analysis routine to work later.

if (SelectedHardware.autoguiderCameraModel == "SBIG ST-i")
//
//	If an ST-i is selected as the guider, then the AutoDark will be activated.
//
{
	ccdsoftAutoguider.ImageReduction = 1;
}

ccdsoftAutoguider.TakeImage();

/* Socket End Packet */
