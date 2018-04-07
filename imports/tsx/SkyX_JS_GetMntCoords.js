/* Java Script */
/* Socket Start Packet */

//
// This javascript snippet is sent (via tsxfeeder) to SkyX in order to determine
// where the mount is currently pointing.
//
// Ken Sturrock January 15, 2017
//

//
// Define variables and set known initial values
//
var targetName = "$000";
var CoordsHMSNow = "";
var CoordsHMS2k = "";

sky6StarChart.Find(targetName);
var dec2000 = sky6StarChart.Declination;
var ra2000 = sky6StarChart.RightAscension;

sky6Utils.PrecessNowTo2000( ra2000, dec2000 );

sky6Utils.ConvertEquatorialToString(sky6Utils.dOut0, sky6Utils.dOut1, 5);

CoordsHMS2000 = sky6Utils.strOut;


Out = ra2000 + '|' + dec2000+ '|' + CoordsHMS2000 + '|';			// Form the output string
//Out = ra2000 + '|' + dec2000+ '|';// + CoordsHMS2000 + '|';			// Form the output string

/* Socket End Packet */
