
/* Java Script */
/* Socket Start Packet */

export function tsxCmdGetFocusTemp() {
var Out = '\
  //\
  //	Get the focuser temperature\
  //\
  //	Ken Sturrock\
  //	January 13, 2018\
  //\
\
  Out = "Success|" + ccdsoftCamera.focTemperature.toFixed(1);\
';
return Out;
}
