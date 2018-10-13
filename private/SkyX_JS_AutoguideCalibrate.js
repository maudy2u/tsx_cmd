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
var ccdAG = ccdsoftAutoguider;

var W =ccdAG.WidthInPixels;
var H = ccdAG.HeightInPixels;

var L=0, T=0, R=W, B=H;
if( (guideStarX - frameHalf) > 0 ) {
  L = guideStarX - frameHalf;
}
if( (guideStarY - frameHalf) > 0 ) {
  L = guideStarY - frameHalf;
}
if( (guideStarX + frameHalf) < W ) {
  R = guideStarX + frameHalf;
}
if( (guideStarY + frameHalf) < H ) {
  B = guideStarY + frameHalf;
}

// Grab original settings
var oL = ccdAG.SubframeLeft;
var oT = ccdAG.SubframeTop;
var oR = ccdAG.SubframeRight;
var oB = ccdAG.SubframeBottom;
var oSave = ccdAG.AutoSaveOn;
var oSub= ccdAG.Subframe;
var oFrame = ccdAG.Frame;

ccdAG.SubframeLeft = L;
ccdAG.SubframeTop = T;
ccdAG.SubframeRight = R;
ccdAG.SubframeBottom = B;
ccdAG.GuideStarX = guideStarX * ccdsoftAutoguiderImage.FITSKeyword ("XBINNING") ;
ccdAG.GuideStarY = guideStarY * ccdsoftAutoguiderImage.FITSKeyword ("YBINNING") ;

ccdAG.AutoSaveOn = false;		// Dont save these images.
ccdAG.Subframe = true;		// Use a subframe around the star.
ccdAG.Frame = 1;			// Light Frame
ccdsoftAutoguider.Asynchronous = false;		// Turn on so we don't get stuck waiting for an endless process

try{
  var res = ccdAG.Calibrate(0);
  Out = 'Success|' + res;
}
catch(e) {
  Out = 'Failed|' + e;
}

ccdAG.AutoSaveOn = oSave;
ccdAG.Frame = oFrame;
ccdAG.SubframeLeft = oL;
ccdAG.SubframeTop = oT;
ccdAG.SubframeRight = oR;
ccdAG.SubframeBottom = oB;
ccdAG.Subframe = oSub;		// Use a subframe around the star.

//Out = 'W: ' + W + ', H: ' + H + ', L:' + ccdAG.SubframeLeft + ', T:' + ccdAG.SubframeTop + ', R:' + ccdAG.SubframeRight + ', B:' + ccdAG.SubframeBottom
Out;

/* Socket End Packet */
