/* Java Script */
/* Socket Start Packet */

//
// This javascript snippet is sent (via tsxfeeder) to SkyX in order to determine
// where the mount is currently pointing.
//
// Ken Sturrock January 15, 2017
// Stephen Townsend - 2018-04-03

//
// Define variables and set known initial values
//
var targetName = "$000";

sky6StarChart.Find(targetName);
sky6ObjectInformation.Property(59); // altitude
altitude = sky6ObjectInformation.ObjInfoPropOut;
var altitude = altitude.toFixed(1);

sky6ObjectInformation.Property(58); // azimuth
var azimuth = sky6ObjectInformation.ObjInfoPropOut;

sky6ObjectInformation.Property(54);  // RA				// Pull the RA value
var targetRA = sky6ObjectInformation.ObjInfoPropOut; 		// Stuff RA into variable

sky6ObjectInformation.Property(55); // DEC			// Pull the DEC value
var targetDEC = sky6ObjectInformation.ObjInfoPropOut; 		// Stuff DEC into variable

/* Socket End Packet */


Out = 'Success|' + targetRA + '|' + targetDEC+ '|' + altitude + '|'+ azimuth ;			// Form the output string

/* Socket End Packet */
