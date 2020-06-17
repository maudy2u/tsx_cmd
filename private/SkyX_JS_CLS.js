/* Java Script */
/* Socket Start Packet */
// SkyX_JS_CLS
//	Ken Sturrock
//  January 13, 2018
// Stephen Townsend
// 2018-04-19

var Target 		= "$000";		// tsxfeeder replaces $000 with a command line parameter
var Filter		= "$001";		// the filter to use. Set by run_target, no effect if no wheel
var retries = $002;
var repErr		= "";			// Throw-away error message for the try/catch tests
var CCDSC = ccdsoftCamera;
var CCDAG = ccdsoftAutoguider;
var SHW = SelectedHardware;
var Out = '';

// *******************************
// unpark if parked
if ( SHW.mountModel !== "Telescope Mount Simulator") {
	sky6RASCOMTele.Unpark();
}

// *******************************
// End any auto guide
var isGuiding = false;
if( SHW.autoguiderCameraModel !== '<No Camera Selected>' ) {
	if( CCDAG.State === 5 ) { // check if we are already guding...
		isGuiding = true;
	}
	if( isGuiding) {
		while (CCDAG.ExposureStatus == "DSS From Web"){
			sky6Web.Sleep (500);	// Waste time if we are waiting for a DSS download
						// so it doesn't throw an Error 206.
						// Sometimes, it still does....
		}
		CCDAG.Abort();
		while (CCDAG.State != 0) {
			//
			// Diagnostic routine to make sure the camera is *really* done
			//
			sky6Web.Sleep (500);
		}
		CCDAG.Subframe = false;
	}
}

// *******************************
// Find target and start CLS
sky6StarChart.Find(Target);				// This has been validated before calling this script

CCDSC.Connect();

sky6RASCOMTele.Asynchronous = false;
CCDSC.Asynchronous = false;
CCDSC.AutoSaveOn = true;
CCDSC.ImageReduction = 0;			// Set this to ONE if you have a mechanical shutter.
CCDSC.Frame = 1; // for light frame
CCDSC.Subframe = false;

if ( SHW.filterWheelModel !== "<No Filter Wheel Selected>" ) {
	CCDSC.filterWheelConnect();		// Probably redundant.
	CCDSC.FilterIndexZeroBased = Filter;	// Set in main script
}

var clsRes = -1; // used to determine
var tries = 0; // count number of tries for CLS

while( clsRes === -1 && tries < retries+1 ) { // add one as need to do once and zero based.
	try {
			clsRes = ClosedLoopSlew.exec();
			var imageLinkAng=ImageLinkResults.imagePositionAngle; // the real sky position
			Out = 'Success|PA=' + imageLinkAng;
			if( (SHW.rotatorModel !== '<No Rotator Selected>') && CCDSC.rotatorIsConnected() ) {
				Out = Out + '|rotPos=' + CCDSC.rotatorPositionAngle(); // the real position
			}
	}
	catch (repErr) 	{
			Out = "Failed|" + repErr;
			clsRes = -1;
	}
	finally {
		tries = tries + 1;
	}
}
// if cls failed - ut
Out
/* Socket End Packet */
