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
var TSX = RunJavaScriptOutput;
// name use to find
var targetName = "$000";
//"astronomical twilight" (-18 degrees)
//"nautical twilight" (-15 degrees)
var twightlightAlt = $001;
var altLimit	= $002;	// Really a constant for the altitude limit
// data to return
var report = 'Success';
// Verify target
var tryTarget 	= {
	ready: true,
	msg: 'Did nothing',
};

CHART.Find("sun");
OBJI.Property(59);
var sunAlt = OBJI.ObjInfoPropOut;
var report = 'Success';
if (sunAlt > twightlightAlt ) {
report  = report +'|isDark=' + false
  + '|sunAltitude=' +
  sunAlt;

} else {
  report  = report +'|isDark=' + true
    + '|sunAltitude=' +
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

		// Figure out the latitude for future calculations.
		CHART.DocumentProperty(0);
		var lat = CHART.DocPropOut;
		// Figure out the object's maximum & minimum altitudes for sanity checking.
		var maxAlt = (90 - lat + targetDEC);
		if (maxAlt > 90)
		// This can happen, so we have to make it fit the convention.
		{
			maxAlt = 180 - maxAlt;
		}

    OBJI.Property(70); // HA			// Pull the Hour Angle value
    var targetHA = OBJI.ObjInfoPropOut; 		// Stuff DEC into variable

    OBJI.Property(68); // TransitTime			// Pull the transitTime value
    var targetTransit = OBJI.ObjInfoPropOut; 		// Stuff DEC into variable

    report = report +
      '|isValid=' +
      true
      + '|AZ=' +
      azimuth
      + '|ALT=' +
      altitude
			+ '|maxAlt=' +
      maxAlt
      + '|RA=' +
      targetRA
      + '|DEC=' +
      targetDEC
      + '|HA=' +
      targetHA
      + '|TRANSIT=' +
      targetTransit;
  }
  else {
    report = report +
      '|isValid=' +
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
    '|isValid=' +
    false;
	TSX.writeLine( repErr );
  tryTarget 	= {
    ready: false,
    msg: 'Not found',
  };
}

var BTP = sky6RASCOMTele.DoCommandOutput;
var pointing = '';
if (BTP == 1)
{
  pointing = 'pointing=East';
  // RunJavaScriptOutput.writeLine ("Mount has not flipped and is pointing east.");

} else if (BTP == 0) {

  pointing = 'pointing=West';
  //RunJavaScriptOutput.writeLine ("Mount has flipped and is pointing west.");
}
else {
  pointing = 'pointing=Unknown';
}
report = report +'|ready='+ tryTarget.ready + '|readyMsg='+tryTarget.msg + '|'+pointing;

// add focuser info
if( SelectedHardware.focuserModel != '<No Focuser Selected>') {
  var temp = CCDSC.focTemperature.toFixed(1);
  var pos = CCDSC.focPosition;
  report = report +'|focusTemp='+ temp +'|focusPosition='+ pos;
}

report;
/* Socket End Packet */
