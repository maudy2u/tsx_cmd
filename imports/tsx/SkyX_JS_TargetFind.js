/* Java Script */
/* Socket Start Packet */

//
// See if the target is valid
//
// Ken Sturrock
// January 13, 2018
//

var Target	= "$000";	// tsxfeeder replaces $000 with a command line parameter
var FindStatus	= "Success";	// Preload value for success.
var altitude 	= 0;
var azimuth 	= 0;
var out 	= "";

try
//
// Try to find the target and catch the error if it fails.
//
{
		sky6StarChart.Find(Target);
}

	catch (repErr)
	//
	//	If error, report it.
	//
	{
		FindStatus = "fail";
	}


if ( FindStatus == "fail" )
{

	out = "Cannot be found.|";

} else {

	sky6ObjectInformation.Property(59);
    	altitude = sky6ObjectInformation.ObjInfoPropOut;

	altitude = altitude.toFixed(1);

	sky6ObjectInformation.Property(58);
    	azimuth = sky6ObjectInformation.ObjInfoPropOut;

	out = "Success|";
}

/* Socket End Packet */
