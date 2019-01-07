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

// Assumed Target already set
var targetName = '$000';
var targetRA;
var targetDEC;
var Out;
var slewStatus = "Success";
var CCDAG = ccdsoftAutoguider;

// *******************************
// End any auto guide
var isGuiding = false;
if( SelectedHardware.autoguiderCameraModel !== '<No Camera Selected>' ) {
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
		while (!CCDAG.State == 0) {
			//
			// Diagnostic routine to make sure the camera is *really* done
			//
			sky6Web.Sleep (500);
		}
		CCDAG.Subframe = false;
	}
}
sky6StarChart.Find(targetName);
var haveTarget = sky6ObjectInformation.Property(59); // altitude
if( haveTarget != 'TypeError: Object not found. Error = 250.') {
    // we have a target we can query
    sky6ObjectInformation.Property(54);  // RA				// Pull the RA value
    targetRA = sky6ObjectInformation.ObjInfoPropOut; 		// Stuff RA into variable

    sky6ObjectInformation.Property(55); // DEC			// Pull the DEC value
    targetDEC = sky6ObjectInformation.ObjInfoPropOut; 		// Stuff DEC into variable
  	//Do the closed loop slew synchronously\
    try{
      sky6RASCOMTele.SlewToRaDec(targetRA, targetDEC, "Slew"); 	// Go to the RA & DEC;
    } catch( nErr ) {
      slewStatus = "Failed";
    }
    if( slewStatus == "Success") {
      Out = "Success |";
    } else {
    	Out = "Slew Failed|";
    }
}
Out;
