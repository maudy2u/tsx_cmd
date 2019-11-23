/* Java Script */
/* Socket Start Packet */
// SkyX_JS_TargetReport
// Stephen Townsend
// 2018-04-19

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
var OBJI = sky6ObjectInformation;
var CHART = sky6StarChart;
var CCDSC = ccdsoftCamera;
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

CHART.Find("sun");
OBJI.Property(59);
var sunAlt = OBJI.ObjInfoPropOut;
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
  CHART.Find(targetName);
  var haveTarget = OBJI.Property(59); // altitude
  if( haveTarget != 'TypeError: Object not found. Error = 250.') {
    // we have a target we can query
    var altitude = OBJI.ObjInfoPropOut;
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

    OBJI.Property(58); // azimuth
    var azimuth = OBJI.ObjInfoPropOut;
		azimuth = azimuth.toFixed(1);

    // if (azimuth < 179) {
    // 	azimuth = "East";
    // } else {
    // 	azimuth = "West";
    // }

    OBJI.Property(54);  // RA				// Pull the RA value
    var targetRA = OBJI.ObjInfoPropOut; 		// Stuff RA into variable

    OBJI.Property(55); // DEC			// Pull the DEC value
    var targetDEC = OBJI.ObjInfoPropOut; 		// Stuff DEC into variable

    OBJI.Property(70); // HA			// Pull the Hour Angle value
    var targetHA = OBJI.ObjInfoPropOut; 		// Stuff DEC into variable

    OBJI.Property(68); // TransitTime			// Pull the transitTime value
    var targetTransit = OBJI.ObjInfoPropOut; 		// Stuff DEC into variable

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

var BTP = sky6RASCOMTele.DoCommandOutput;
var pointing = '';
if (BTP == 1)
{
  pointing = 'East';
  // RunJavaScriptOutput.writeLine ("Mount has not flipped and is pointing east.");

} else if (BTP == 0) {

  pointing = 'West';
  //RunJavaScriptOutput.writeLine ("Mount has flipped and is pointing west.");
}
else {
  pointing = 'Unknown';
}
report = report +'|'+ tryTarget.ready + '|'+tryTarget.msg + '|'+pointing;

// add focuser info
if( SelectedHardware.focuserModel != '<No Focuser Selected>') {
  var temp = CCDSC.focTemperature.toFixed(1);
  var pos = CCDSC.focPosition;
  report = report +'|'+ temp +'|'+ pos;
}

report;
/* Socket End Packet */
