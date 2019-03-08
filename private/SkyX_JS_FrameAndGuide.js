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
var GUIDE_STAR_X = "$000";
var GUIDE_STAR_Y = "$001";
var frameSize = $002;
var frameHalf = frameSize/2;

var CAMSCALE = $004;
var GUIDERSCALE = $005;
var GUIDING_PIXEL_ERROR_TOLERANCE = $006;
var IS_GUIDE_SETTLING_ENABLED = $007;

var CCDSC = ccdsoftCamera;
var CCDAG = ccdsoftAutoguider;
var CCDAGI = ccdsoftCameraImage;

CCDSC.Asynchronous = false;		// We are going to wait for it

CCDAGI.AttachToActiveAutoguider ();
CCDAG.GuideStarX = GUIDE_STAR_X * CCDAGI.FITSKeyword ("XBINNING") ;
CCDAG.GuideStarY = GUIDE_STAR_Y * CCDAGI.FITSKeyword ("YBINNING") ;

var W =CCDAG.WidthInPixels;
var H = CCDAG.HeightInPixels;

var L=0, T=0, R=W, B=H;
if( (GUIDE_STAR_X - frameHalf) > 0 ) {
  L = GUIDE_STAR_X - frameHalf;
}
if( (GUIDE_STAR_Y - frameHalf) > 0 ) {
  T = GUIDE_STAR_Y - frameHalf;
}
if( (GUIDE_STAR_X + frameHalf) < W ) {
  R = GUIDE_STAR_X + frameHalf;
}
if( (GUIDE_STAR_Y + frameHalf) < H ) {
  B = GUIDE_STAR_Y + frameHalf;
}

// Grab original settings
var oL = CCDAG.SubframeLeft;
var oT = CCDAG.SubframeTop;
var oR = CCDAG.SubframeRight;
var oB = CCDAG.SubframeBottom;
var oSave = CCDAG.AutoSaveOn;
var oSub= CCDAG.Subframe;
var oFrame = CCDAG.Frame;

CCDAG.SubframeLeft = L* CCDAGI.FITSKeyword ("XBINNING");
CCDAG.SubframeTop = T* CCDAGI.FITSKeyword ("YBINNING") ;
CCDAG.SubframeRight = R* CCDAGI.FITSKeyword ("XBINNING");
CCDAG.SubframeBottom = B* CCDAGI.FITSKeyword ("YBINNING");

CCDAG.Frame = 1;			// Light Frame
CCDAG.AutoSaveOn = false;		// Dont save these images.
//CCDAG.Subframe = false;		// Use a subframe around the star.
CCDAG.Subframe = true;		// Use a subframe around the star.

CCDAG.Asynchronous = true;		// Turn on so we don't get stuck waiting for an endless process

try{
	var res = CCDAG.Autoguide();			// Do it.
  Out = 'Success|' + res;
}
catch(e) {
  Out = 'Failed|' + e;
}

var guideQuality = "Not checked";
Out = 'Success|' + guideQuality
/* Socket End Packet */
