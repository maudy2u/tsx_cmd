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
var CLSStatus 		= "Success|";
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

if ( SelectedHardware.focuserModel !== "<No Focuser Selected>" )
//
// This test looks to see if there is a focuser as a final fail-safe
//
// Again - if you don't have a focuser or don't want to focus what you have,
// then it is best to set the useAtFocus variable in the main script!
//
// Note - there is no real focusing done in this script but I wanted to connect
// to any focusers because I queary them below in order to figure out if the
// script is running on a particular user's system.
//
{
	ccdsoftCamera.focConnect();
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

if (ccdsoftCamera.PropStr("m_csObserver") == "Ken Sturrock")
//
// This pulls the "observer name" to see if it's me. It then sets my defaults up for specific
// equipment so that I can leave the variables in the main script generic for others.
//
// This shouldn't have any effect on you unless your name is also "Ken Sturrock" and you have the same
// gear that I have. Just leave it alone, unless you want to change it for specific gear you own.
//
{

	if (SelectedHardware.cameraModel == "ASICamera")
	//
	// Set this for my ZWO setup
	//
	{
		ccdsoftCamera.ImageReduction = 0;
		ccdsoftCamera.FilterIndexZeroBased = 0;

		if ( !ccdsoftCamera.ImageUseDigitizedSkySurvey == "1" )
		//
		// 	Are we running a real session? If so, set temp.
		//
		{
			ccdsoftCamera.TemperatureSetPoint = -10;	//Sometimes I forget to set this....
			ccdsoftCamera.RegulateTemperature = true;
		} else {
			ccdsoftCamera.TemperatureSetPoint = 10;		//Don't bother with a deep chill.
			ccdsoftCamera.RegulateTemperature = true;
		}


	}

	if (SelectedHardware.cameraModel == "QSI Camera  ")
	//
	// Set this for my QSI setup
	//
	{
		ccdsoftCamera.ImageReduction = 1;
		ccdsoftCamera.FilterIndexZeroBased = 0;

		if ( !ccdsoftCamera.ImageUseDigitizedSkySurvey == "1" )
		//
		// 	Are we running a real session? If so, set temp.
		//
		{
			ccdsoftCamera.TemperatureSetPoint = -10;		//Sometimes I forget to set this....
			ccdsoftCamera.RegulateTemperature = true;
		} else {
			ccdsoftCamera.TemperatureSetPoint = 10;			//Don't bother with a deep chill.
			ccdsoftCamera.RegulateTemperature = true;
		}
	}
}

if ( myMount.indexOf('Temma') >= 0 )
//
// Takahashi Temma Exceptions
//
// All Takahashi Temma mounts slew slowly.
//
// Traditionally, Temma mounts also had fast (which was slow) and slow (extremely slow) speeds. The speed was
// contingent upon the input voltage. The SkyX Temma drivers are designed to automatically detect the input
// voltage (12 volt or 24 volt) and choose the speed appropriately.
//
// Temma M (and presumably Z) mounts only run at 12 volts, even though they also have fast and slow speeds.
// Since Temma M mounts do not report the input voltage (which is always 12 volts) then The SkyX’s drivers will
// default the Temma M mount to slow speed. The user can press the “24 volt” button under the Temma tab to
// increase the speed of the Temma M, but the user must remember to do this each session.
//
// Moreover, small Temma mounts (EM-10, EM-11) slew more slowly than larger Temma mounts (EM-200, EM-400 –
// NJP excepted). When a small Temma mount, such as my EM-11, is set to slew at slow speed it can take over
// ten minutes to complete a meridian flip. If the SkyX is waiting for the flip to complete (e.g. Closed Loop Slew
// or scripting a sequence of synchronous commands) then the SkyX will get tired of waiting and throw an Error 209
// which clobbers the script.
//
// The sequence below is designed to slew Temma mounts asynchronously to the target while monitoring the progress with
// a polling loop. When the mount arrives at the target and stops slewing, the loop will break-out and the script
// will continue with the normal CLS command which the Temma will complete fine because it will be much closer to
// the target.
//
// This code is not necessary for faster Temma mounts but it is complicated to try to differentiate between
// them given the limited drivers available and this code adds relatively little overhead.
//
// The real answer is to try to remember to switch the older/12v Temmas into "24v mode" under the Temma Tab, even if on 12v.
//
{

	while (sky6RASCOMTele.IsSlewComplete == 0)
	//
	// This is a safety catch. We would only be here if a very slow-moving Temma has timed out during
	// an @Focus2 run, or some other function. The mount almost certainly isn't really lost, it's just
	// very slow and SkyX has given up on it. Rather than keep throwing commands at it, which will fail,
	// we're going to pause and let it catch up.
	//
	{
		sky6Web.Sleep (10000);						// Hang out.
	}


	sky6RASCOMTele.Asynchronous = true;				// Put us into async so we can monitor
									// the mount while it moves rather than
									// wait for it - which may time-out

	sky6ObjectInformation.Property(54); 				// Pull the RA value
		var targetRA = sky6ObjectInformation.ObjInfoPropOut; 		// Stuff RA into variable

	sky6ObjectInformation.Property(55); 				// Pull the DEC value
		var targetDEC = sky6ObjectInformation.ObjInfoPropOut; 		// Stuff DEC into variable

	sky6RASCOMTele.SlewToRaDec(targetRA, targetDEC, "Slew"); 	// Go to the RA & DEC
									// Do real CLS after this pre-slew

	while (sky6RASCOMTele.IsSlewComplete == 0)
	//
	// Diagnostic routine to wait until the mount has arrived asynchronously.
	//
	// The spinning beach-ball cursor on OSX looks scary, but it's okay.
	//
	{
		sky6Web.Sleep (10000);						// Sleep
	}

	sky6RASCOMTele.Asynchronous = false;

	//
	// Occasionally a CLS fails because my mount is still moving when the image is snapped.
	// This is EXTREMELY rare, but I'm trying to mitigate it here for all Temma users.
	//
	// Since the Taks have a backlash compensation, this delay may let it settle better.
	// The camera delay will get reset below.
	//

	sky6Web.Sleep (5000)
	ccdsoftCamera.Delay = 10;
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




if (( CLSStatus !== "Failed" ) || ( ccdsoftCamera.ImageUseDigitizedSkySurvey == "1" ))
//
// Do the right thing if the CLS passes or fails. Pass if using Simulator....
//
{
		if ( myMount.indexOf('Temma') >= 0 )
		//
		// Return camera delay to something shorter in case the "If Tak" command reset it.
		//
		{
			ccdsoftCamera.Delay = 1;
		}

		sky6StarChart.Find("Z 90");	// Zoom Out for a nicer looking chart
		sky6StarChart.Find(Target);	// "re-find" the target so that the star chart isn't locked onto "screen center"

		iScale = ImageLinkResults.imageScale;

		out = "Success" +"|"+ Target + " " + " (" + iScale + " AS/pixel).";

		if ( ccdsoftCamera.ImageUseDigitizedSkySurvey == "1" )
		//
		// Since we skip the genuine CLS on the simulator, give some fake love.
		//
		{
			out = "Success" +"|"+ Target + " (Simulated)";
		}

} else {

	out = Target + " " + "CLS Failed"
}

/* Socket End Packet */
