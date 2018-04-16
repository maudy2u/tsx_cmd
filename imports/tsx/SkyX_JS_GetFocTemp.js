/* Java Script */
/* Socket Start Packet */

//
//	Get the focuser temperature
//
//	Ken Sturrock
//	January 13, 2018
//

var temp = ccdsoftCamera.focTemperature.toFixed(1);
var pos = ccdsoftCamera.focPosition;
var Out = temp + '|' + pos;			// Form the output string

Out;

/* Socket End Packet */
