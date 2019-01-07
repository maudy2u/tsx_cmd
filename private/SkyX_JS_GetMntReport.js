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
var rpt ='';
var mntRa = 0;
var mntDec = 0;
var mntDir = "";

sky6RASCOMTele.GetRaDec();			// Ask the SkyX for pointing coordinates
mntRa = sky6RASCOMTele.dRa;		// Put the value into the Az value
mntDec = sky6RASCOMTele.dDec;		// Do same for altitude

sky6Utils.PrecessNowTo2000( mntRa, mntDec );

sky6Utils.ConvertEquatorialToString(sky6Utils.dOut0, sky6Utils.dOut1, 5);

CoordsHMS2000 = sky6Utils.strOut;

// Form the output string
rpt = mntRa +'|'+mntDec+'|'+CoordsHMS2000

var mntAz = 0;
var mntAlt = 0;
var mntDir = "";

sky6RASCOMTele.GetAzAlt();			// Ask the SkyX for pointing coordinates
mntAz = sky6RASCOMTele.dAz;		// Put the value into the Az value
mntAlt = sky6RASCOMTele.dAlt;		// Do same for altitude

if (mntAz < 179)
//
// Simplify the azimuth value to simple east/west
//
{
	mntDir = "East";
} else {
	mntDir = "West";
}

sky6RASCOMTele.DoCommand(11, "");

var BTP = sky6RASCOMTele.DoCommandOutput;
var pointing = '';
if (BTP == 1) {
  pointing = 'East';
  // RunJavaScriptOutput.writeLine ("Mount has not flipped and is pointing east.");

}
else if (BTP == 0) {
  pointing = 'West';
  //RunJavaScriptOutput.writeLine ("Mount has flipped and is pointing west.");

}
else {
  pointing = 'Unknown';
}
// Form the output string
rpt = rpt + '|' + mntDir + '|' + mntAlt + '|' + pointing;
/* Socket End Packet */
