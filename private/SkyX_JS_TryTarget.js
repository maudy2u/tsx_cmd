/* Java Script */
/* Socket Start Packet */

//
// See if the target is valid
//
// Ken Sturrock
// January 13, 2018
//

var Target	= "$000";	// tsxfeeder replaces $000 with a command line parameter
var altLimit	= $001;	// Really a constant for the altitude limit
var altitude 	= 0;
var azimuth 	= 0;
var out 	= {
	ready: true,
	msg: 'Did nothing',
};
var FindStatus	= true;	// Preload value for success.

try {
//
// Try to find the target and catch the error if it fails.
//
		sky6StarChart.Find(Target);
}
catch (repErr) {
	//
	//	If error, report it.
	//
	FindStatus = false;
}


if ( !FindStatus )
{

	out 	= {
		ready: false,
		msg: 'Not found',
	};

} else {

	sky6ObjectInformation.Property(59);
  altitude = sky6ObjectInformation.ObjInfoPropOut;
	altitude = altitude.toFixed(1);

	sky6ObjectInformation.Property(58);
  azimuth = sky6ObjectInformation.ObjInfoPropOut;

	if (altitude < altLimit)
	{
	 	out 	= {
			ready: false,
			msg: "Has sunk below: " +  altLimit,
		};
	}
	else {
		out 	= {
			ready: true,
			msg: 'Found and above minAlt',
		};
	}
}

out = out.ready + '|'+out.msg;
/* Socket End Packet */
