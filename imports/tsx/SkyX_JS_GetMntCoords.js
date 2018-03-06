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

var CoordsHMSNow = "";
var CoordsHMS2k = "";

sky6RASCOMTele.GetRaDec();
	
sky6Utils.ConvertEquatorialToString(sky6RASCOMTele.dRa, sky6RASCOMTele.dDec, 5);

CoordsHMSNow = sky6Utils.strOut;

sky6Utils.PrecessNowTo2000( sky6RASCOMTele.dRa, sky6RASCOMTele.dDec);

sky6Utils.ConvertEquatorialToString(sky6Utils.dOut0, sky6Utils.dOut1, 5);

CoordsHMS2k = sky6Utils.strOut;


Out = "^          Now - " + CoordsHMSNow + "\n" + "          j2k - " + CoordsHMS2k;			// Form the output string

/* Socket End Packet */
