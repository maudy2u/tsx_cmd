/* Java Script */
/* Socket Start Packet */

//	Ken Sturrock
//	January 13, 2018
//  20181011 Stephen Townsend

var guideStarX = $000;
var guideStarY = $001;
var frameSize = $002;
var frameHalf = frameSize/2;
var Out = '';			// Form the output string

//open TSX camera and get the last image
var CCDAG = ccdsoftAutoguider;
var CCDAGI = ccdsoftAutoguiderImage;

CCDAGI.AttachToActiveAutoguider ();
CCDAG.GuideStarX = guideStarX * CCDAGI.FITSKeyword ("XBINNING") ;
CCDAG.GuideStarY = guideStarY * CCDAGI.FITSKeyword ("YBINNING") ;

var W =CCDAG.WidthInPixels;
var H = CCDAG.HeightInPixels;

var L=0, T=0, R=W, B=H;
if( (guideStarX - frameHalf) > 0 ) {
  L = guideStarX - frameHalf;
}
if( (guideStarY - frameHalf) > 0 ) {
  T = guideStarY - frameHalf;
}
if( (guideStarX + frameHalf) < W ) {
  R = guideStarX + frameHalf;
}
if( (guideStarY + frameHalf) < H ) {
  B = guideStarY + frameHalf;
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

CCDAG.AutoSaveOn = false;		// Dont save these images.
CCDAG.Subframe = true;		// Use a subframe around the star.
if( CCDAG.ImageUseDigitizedSkySurvey == "1" ){ // Simulator
  CCDAG.Frame = 1;			// Light Frame
}
ccdsoftAutoguider.Asynchronous = false;		// Turn on so we don't get stuck waiting for an endless process

try{
  // var res = CCDAG.Calibrate(0);
  var res = CCDAG.Calibrate(0); // removing the 0 to see if this removes the dialog
  Out = 'Success|' + res;
}
catch(e) {
  Out = 'Failed|' + e;
}

CCDAG.AutoSaveOn = oSave;
CCDAG.Frame = oFrame;
CCDAG.SubframeLeft = oL;
CCDAG.SubframeTop = oT;
CCDAG.SubframeRight = oR;
CCDAG.SubframeBottom = oB;
CCDAG.Subframe = oSub;		// Use a subframe around the star.

//Out = 'W: ' + W + ', H: ' + H + ', L:' + CCDAG.SubframeLeft + ', T:' + CCDAG.SubframeTop + ', R:' + CCDAG.SubframeRight + ', B:' + CCDAG.SubframeBottom
Out;

/* Socket End Packet */
