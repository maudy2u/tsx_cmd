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
var CoordsHMS2000 = "";

var mntRa = 0;
var mntDec = 0;
var mntDir = "";

sky6RASCOMTele.GetRaDec();			// Ask the SkyX for pointing coordinates
mntRa = sky6RASCOMTele.dRa;		// Put the value into the Az value
mntDec = sky6RASCOMTele.dDec;		// Do same for altitude

sky6Utils.PrecessNowTo2000( mntRa, mntDec );

sky6Utils.ConvertEquatorialToString(sky6Utils.dOut0, sky6Utils.dOut1, 5);

CoordsHMS2000 = sky6Utils.strOut;


Out = {
  ra: mntRa,
  dec: mntDec,
  hms: CoordsHMS2000,
};			// Form the output string

Out = Out.ra +'|'+Out.dec+'|'+Out.hms

/* Socket End Packet */
