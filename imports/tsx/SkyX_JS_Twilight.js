/* Java Script */
/* Socket Start Packet */

//
// Script will check to to see if it is twilight.
//
// Ken Sturrock
// January 13, 2018
//
export function tsxCmdGetTwilight(target) {
var Out ='\
var Target 	= '+target+';	// tsxfeeder replaces $000 with the current target name.\
\
// Find the sun and figure out how high it is.\
sky6StarChart.Find("sun");\
sky6ObjectInformation.Property(59);\
var altitude = sky6ObjectInformation.ObjInfoPropOut;\
\
// Refind where we were.\
sky6StarChart.Find(Target);\
\
if (altitude > -15)\
//\
// If the sun is above -15 degrees, use the "Light." keyword\
//\
// This is technically not as dark as "astronomical twilight" (-18 degrees)\
// but it is an hour before/after the sun crosses the horizon.\
//\
{\
	simpErr = "Light. " + altitude;\
} else {\
	simpErr = "Dark. " + altitude;\
}\
\
if (ccdsoftCamera.ImageUseDigitizedSkySurvey == 1)\
//\
// If using the simulator, then tell us this so we know\
// to ignore the check.\
//\
{\
	simpErr = "Simulator. " + altitude;\
}\
';
return Out;
}

/* Socket End Packet */
