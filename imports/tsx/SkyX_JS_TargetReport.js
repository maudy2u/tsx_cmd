/* Java Script */
/* Socket Start Packet */

/*
Returns:
 isDark: true/false
 sunAlt
 isValid: false, or if true adds.

 azimuth
 altitude
 targetRA
 targetDEC
 targetHA
 targetTransit
 ready
 readyMsg
try { // try to get focuser info
 focTemp
 focPostion
}
*/

// name use to find
var targetName = "$000";
//"astronomical twilight" (-18 degrees)
//"nautical twilight" (-15 degrees)
var twightlightAlt = $001;
var altLimit	= $002;	// Really a constant for the altitude limit
// data to return
var report;
// Verify target
var tryTarget 	= {
	ready: true,
	msg: 'Did nothing',
};

sky6StarChart.Find("sun");
sky6ObjectInformation.Property(59);
var sunAlt = sky6ObjectInformation.ObjInfoPropOut;
if (sunAlt > twightlightAlt ) {
report  = false
  + '|' +
  sunAlt;

} else {
  report  = true
    + '|' +
    sunAlt;
};

try {
  //
  // Try to find the target and catch the error if it fails.
  //
  sky6StarChart.Find(targetName);
  var haveTarget = sky6ObjectInformation.Property(59); // altitude
  if( haveTarget != 'TypeError: Object not found. Error = 250.') {
    // we have a target we can query
    var altitude = sky6ObjectInformation.ObjInfoPropOut;
    altitude = altitude.toFixed(1);
    if (altitude < altLimit)
    {
      tryTarget 	= {
        ready: false,
        msg: "Has sunk below: " +  altLimit,
      };
    }
    else {
      tryTarget 	= {
        ready: true,
        msg: 'Found and above minAlt',
      };
    }

    sky6ObjectInformation.Property(58); // azimuth
    var azimuth = sky6ObjectInformation.ObjInfoPropOut;
    if (azimuth < 179) {
    	azimuth = "East";
    } else {
    	azimuth = "West";
    }

    sky6ObjectInformation.Property(54);  // RA				// Pull the RA value
    var targetRA = sky6ObjectInformation.ObjInfoPropOut; 		// Stuff RA into variable

    sky6ObjectInformation.Property(55); // DEC			// Pull the DEC value
    var targetDEC = sky6ObjectInformation.ObjInfoPropOut; 		// Stuff DEC into variable

    sky6ObjectInformation.Property(70); // HA			// Pull the Hour Angle value
    var targetHA = sky6ObjectInformation.ObjInfoPropOut; 		// Stuff DEC into variable

    sky6ObjectInformation.Property(68); // TransitTime			// Pull the transitTime value
    var targetTransit = sky6ObjectInformation.ObjInfoPropOut; 		// Stuff DEC into variable

    report = report +
      '|' +
      true
      + '|' +
      azimuth
      + '|' +
      altitude
      + '|' +
      targetRA
      + '|' +
      targetDEC
      + '|' +
      targetHA
      + '|' +
      targetTransit;
  }
  else {
    report = report +
      '|' +
      false;

    tryTarget 	= {
      ready: false,
      msg: 'Not found',
    };
  }
}
catch (repErr) {
	//
	//	If error, report it.
	//
  report = report +
    '|' +
    false;

  tryTarget 	= {
    ready: false,
    msg: 'Not found',
  };
}

report = report +'|'+ tryTarget.ready + '|'+tryTarget.msg;

// add focuser info
if( SelectedHardware.focuserModel != '<No Focuser Selected>') {
  var temp = ccdsoftCamera.focTemperature.toFixed(1);
  var pos = ccdsoftCamera.focPosition;
  report = report +'|'+ temp +'|'+ pos;
}

report;
/* Socket End Packet */
