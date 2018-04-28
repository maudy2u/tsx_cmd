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
ccdsoftAutoguider.ExposureTime = $000;		// Set the normal exposure duration for "regular" images (from main script)
ccdsoftAutoguider.AutoguiderExposureTime = $001;	// Set the guide exposure duration to the same to preserve my sanity.
ccdsoftAutoguider.AutoSaveOn = true;			// This must be set for the image analysis routine to work later.

ccdsoftAutoguider.TakeImage();

/* Socket End Packet */
