/* Java Script */
/* Socket Start Packet */

//	Ken Sturrock
//	January 13, 2018

var guideStarX = "$000";
var guideStarY = "$001";
var Out = '';			// Form the output string

//open TSX camera and get the last image
var ccdAG = ccdsoftAutoguider;

ccdAG.GuideStarX = guideStarX * ccdsoftAutoguiderImage.FITSKeyword ("XBINNING") ;
ccdAG.GuideStarY = guideStarY * ccdsoftAutoguiderImage.FITSKeyword ("YBINNING") ;

ccdAG.AutoSaveOn = false;		// Dont save these images.
ccdAG.Subframe = true;		// Use a subframe around the star.
ccdAG.Frame = 1;			// Light Frame
ccdsoftAutoguider.Asynchronous = false;		// Turn on so we don't get stuck waiting for an endless process

ccdAG.Calibrate();

Out;

/* Socket End Packet */
