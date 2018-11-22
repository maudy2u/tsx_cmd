/* Java Script */
/* Socket Start Packet */

//
//	This JavaScript code simply connects to the guide camera and takes a picture
//
//	Ken Sturrock December 25, 2017
//

var Out = 'Success|';
var CCDSAG = ccdsoftAutoguider;

CCDSAG.Connect();
CCDSAG.Asynchronous = false;		// We are going to wait for it
CCDSAG.Frame = 1;
CCDSAG.Subframe = false;
CCDSAG.ExposureTime = $000;		// Set the normal exposure duration for "regular" images (from main script)
CCDSAG.AutoguiderExposureTime = $001;	// Set the guide exposure duration to the same to preserve my sanity.
CCDSAG.AutoSaveOn = true;			// This must be set for the image analysis routine to work later.

CCDSAG.TakeImage();
Out;
/* Socket End Packet */
