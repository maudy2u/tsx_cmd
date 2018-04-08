/* Java Script */
/* Socket Start Packet */

//
// Script will closed-loop-slew to the target supplied by tsxfeeder.
//
// If you are using the simulator (DSS images) then Image Link,
// and therefore CLS, will *often* fail. Both M31 and M33 are usually safe
// targets to try with DSS images.
//
// Thanks to Terry Friedrichson for the example code and tutorials
//
// Thanks also to Rick McAlister, Robert Woodard and Roberto Abraham for their many
// Visual Basic and JavaScript examples shared on the Software Bisque WWW site. Thanks
// to Daniel Bisque for the Image Scale hint for the simulator.
//
// This JavaScript code is sent by Terry Friedrichson's tsxfeeder utility
// which is, in turn, called by a bash script.
//
// Ken Sturrock
// January 13, 2018
//

//
// Define Variables
//

var Target 		= "$000";		// tsxfeeder replaces $000 with a command line parameter
var Filter		= "$001";		// the filter to use. Set by run_target, no effect if no wheel
var repErr		= "";			// Throw-away error message for the try/catch tests
var targetRA		= "";			// Right Assention of target - used for mount synch
var targetDEC		= "";			// Declination of target - used for mount synch
var CLSStatus 		= "Success";
var myMount		= SelectedHardware.mountModel;
var iScale		= 0			// Holds the calculated Image Scale


if ( SelectedHardware.mountModel !== "Telescope Mount Simulator")
//
// See if we are running the simulator, if we are not using the simulator
// then set the tracking speed below.
//
{
	// This is to make sure that the mount is on and tracking after being "parked".
	// You may need to remove and replace with the correct unpark code, probably "sky6RASCOMTele.Unpark();"
	//
	sky6RASCOMTele.SetTracking(1, 1, 0 ,0);

} else {


if ( ccdsoftCamera.ImageUseDigitizedSkySurvey == "1" )
//
// Test to see if we are using the DSS with the simulator,
// if so, set image scale to 1.7 to try to help out CLS.
//
{
	ImageLink.scale = 1.7;
}

}

sky6StarChart.Find(Target);				// This has been validated before calling this script

ccdsoftCamera.Connect();

sky6RASCOMTele.Asynchronous = false;

ccdsoftCamera.Asynchronous = false;
ccdsoftCamera.AutoSaveOn = true;
ccdsoftCamera.ImageReduction = 0;			// Set this to ONE if you have a mechanical shutter.
ccdsoftCamera.Frame = 1;
ccdsoftCamera.Subframe = false;

if ( SelectedHardware.filterWheelModel !== "<No Filter Wheel Selected>" )
{
	ccdsoftCamera.filterWheelConnect();		// Probably redundant.
	ccdsoftCamera.FilterIndexZeroBased = Filter;	// Set in main script
}



try
//
// Try to closed-loop-slew to the target and catch the error if it fails.
//
{
		ClosedLoopSlew.exec();
}

	catch (repErr)
	//
	// We're going to use our throw away variable repErr to
	// swallow the actual error message and substitute it for a generic
	// failure message.
	//
	{
		CLSStatus = "Failed";
	}

/* Socket End Packet */
