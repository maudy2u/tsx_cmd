/* Java Script */
/* Socket Start Packet */

//
// See if the target is valid
//
// Ken Sturrock
// January 13, 2018
//

var Target	= "$000";	// tsxfeeder replaces $000 with a command line parameter
var altLimit	= $001;	// Really a constant for the altitude limit
var altitude 	= 0;
var azimuth 	= 0;
var out 	= "";
var FindStatus	= "Success";	// Preload value for success.

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

	out = "cannot be found.";

} else {

	sky6ObjectInformation.Property(59);
    	altitude = sky6ObjectInformation.ObjInfoPropOut;

	altitude = altitude.toFixed(1);

	sky6ObjectInformation.Property(58);
    	azimuth = sky6ObjectInformation.ObjInfoPropOut;

	out = "Success";

	if (azimuth < 179)
	//
	//
	//
	{
			if ((altitude < altLimit) && ( ! ccdsoftCamera.ImageUseDigitizedSkySurvey == "1" ))
			{
				out = "is below " + altLimit + " degrees. Currently: " + altitude + " degrees." ;
			}

			if (altitude < 0)
			{
		 		out = "is below the horizon: " + altitude + " degrees.";
			}

	} else {

			if (altitude < altLimit)
			{
				out = "has sunk too low." ;
			}
	}
}

/* Socket End Packet */
