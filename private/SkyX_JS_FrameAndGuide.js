/* Java Script */
/* Socket Start Packet */

//
//	This script takes the GuideX and GuideY variables passed to it from the main script
//	(using the substitution function in Terry's tsxfeeder) and then sets up autoguiding.
//
//	Ken Sturrock
//	January 13, 2018
//


// The lines below take the guide star coordinates from the main script (the $ tokens
// are swapped for the real numbers by tsxfeeder) and the multiplication magic is done
// to un-compensate SkyX's compensation of coordinates for binned images which
// I don't want it to do because I actually know what I'm doing....
//
var guideStarX = "$000";
var guideStarY = "$001";

ccdsoftAutoguider.GuideStarX = guideStarX * ccdsoftAutoguiderImage.FITSKeyword ("XBINNING") ;
ccdsoftAutoguider.GuideStarY = guideStarY * ccdsoftAutoguiderImage.FITSKeyword ("YBINNING") ;

ccdsoftAutoguider.AutoSaveOn = false;		// Dont save these images.
ccdsoftAutoguider.Subframe = true;		// Use a subframe around the star.
ccdsoftAutoguider.Frame = 1;			// Light Frame

ccdsoftAutoguider.Asynchronous = true;		// Turn on so we don't get stuck waiting for an endless process
ccdsoftAutoguider.Autoguide();			// Do it.

/* Socket End Packet */