/* Java Script */
/* Socket Start Packet */

//
// This javascript snippet is sent (via tsxfeeder) to SkyX in order to determine
// where the mount is currently pointing.
//
// This script will be called before imaging starts and periodically through
// the session to determine if the mount has crossed the zenith and, if it has,
// if the mount needs to be flipped to avoid a collision.
//
// Ken Sturrock
// January 13, 2018
//

//
// Define variables and set known initial values
//
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

Out = mntDir + "|" + mntAlt;			// Form the output string

/* Socket End Packet */
