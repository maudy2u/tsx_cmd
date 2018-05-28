/* Java Script */
/* Socket Start Packet */
// SkyX_JS_CLS

var Target 		= "$000";		// tsxfeeder replaces $000 with a command line parameter
var Filter		= "$001";		// the filter to use. Set by run_target, no effect if no wheel
var repErr		= "";			// Throw-away error message for the try/catch tests
var Out;

// *******************************
// unpark if parked
if ( SelectedHardware.mountModel !== "Telescope Mount Simulator") {
	sky6RASCOMTele.Unpark();
}

// *******************************
// End auto guide
while (ccdsoftAutoguider.ExposureStatus == "DSS From Web")
{
	sky6Web.Sleep (500);	// Waste time if we are waiting for a DSS download
}
ccdsoftAutoguider.Abort();
while (!ccdsoftAutoguider.State == 0)
{
	sky6Web.Sleep (500);
}
ccdsoftAutoguider.Subframe = false;

// *******************************
// Find target and start CLS
sky6StarChart.Find(Target);				// This has been validated before calling this script

ccdsoftCamera.Connect();

sky6RASCOMTele.Asynchronous = false;
ccdsoftCamera.Asynchronous = false;
ccdsoftCamera.AutoSaveOn = true;
ccdsoftCamera.ImageReduction = 0;			// Set this to ONE if you have a mechanical shutter.
ccdsoftCamera.Frame = 1; // for light frame
ccdsoftCamera.Subframe = false;

if ( SelectedHardware.filterWheelModel !== "<No Filter Wheel Selected>" ) {
	ccdsoftCamera.filterWheelConnect();		// Probably redundant.
	ccdsoftCamera.FilterIndexZeroBased = Filter;	// Set in main script
}

try {
		ClosedLoopSlew.exec();
		var imageLinkAng=ImageLinkResults.imagePositionAngle; // the real sky position
		Out = 'Success|' + imageLinkAng;
		if( SelectedHardware.rotatorModel != '<No Rotator Selected>') {
			Out = Out + '|' + ccdsoftCamera.rotatorPositionAngle(); // the real position
		}
}
catch (repErr) 	{
		Out = "Failed|" + repErr;
}
Out
/* Socket End Packet */
