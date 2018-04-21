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
var Out = {
  focusTemp: temp,
  focPosition: pos,
};			// Form the output string

Out = Out.focusTemp +'|'+Out.focPosition;

/* Socket End Packet */
