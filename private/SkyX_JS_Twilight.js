/* Java Script */
/* Socket Start Packet */

//
// Script will check to to see if it is twilight.
//
// Ken Sturrock
// January 13, 2018
// Stephen Townsend
// August 1, 2018

var minSunAlt = $000;
var Out;

// Find the sun and figure out how high it is.
sky6StarChart.Find("sun");
sky6ObjectInformation.Property(59);
var altitude = sky6ObjectInformation.ObjInfoPropOut;

if (altitude > minSunAlt )
//
// If the sun is above -15 degrees, use the "Light." keyword
//
// This is technically not as dark as "astronomical twilight" (-18 degrees)
// but it's an hour before/after the sun crosses the horizon.
//
{
	Out = "Light|" + altitude;
} else {
	Out = "Dark|" + altitude;
}

// if (ccdsoftCamera.ImageUseDigitizedSkySurvey == 1)
// //
// // If using the simulator, then tell us this so we know
// // to ignore the check.
// //
// {
// 	Out = "Simulator. " + altitude;
// }

Out

/* Socket End Packet */
