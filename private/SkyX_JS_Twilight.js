/* Java Script */
/* Socket Start Packet */

//
// Script will check to to see if it is twilight.
//
// Ken Sturrock
// January 13, 2018
//

var target 	= "$000";	// tsxfeeder replaces $000 with the current target name.
var minSunAlt = $001;
var Out;

// Find the sun and figure out how high it is.
sky6StarChart.Find("sun");
sky6ObjectInformation.Property(59);
var altitude = sky6ObjectInformation.ObjInfoPropOut;

// Refind where we were.
sky6StarChart.Find(target);

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
