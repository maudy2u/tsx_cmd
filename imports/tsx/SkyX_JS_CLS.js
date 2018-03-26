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
var tester1 = 0;

// Assumed Target already set
export function tsxCmdCLS() {
  Out = '\
  var CLSStatus = "Success";\
  var iScale		= 0			// Holds the calculated Image Scale\
  //Turn on camera autosave\
	ccdsoftCamera.Connect();\
	ccdsoftCamera.AutoSaveOn = 1;\
	//Do the closed loop slew synchronously\
  try{\
    ClosedLoopSlew.exec();\
  } catch( nErr ) {\
    clsStatus = "Failed";\
  }\
  if( clsStatus == "Success") {\
    iScale = ImageLinkResults.imageScale;\
    out = "Success | " + iScale + " AS/pixel).";\
  } else {\
  	out = "CLS Failed"\
  }\
  }\
  ';
  return Out;
}
