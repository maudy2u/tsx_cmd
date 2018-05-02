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
 targetTransit;

 focTemp
 focPostion

*/

// name use to find
var targetName = "$000";
//"astronomical twilight" (-18 degrees)
//"nautical twilight" (-15 degrees)
var twightlightAlt = $001;
// data to return
var report;

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


sky6StarChart.Find(targetName);
var haveTarget = sky6ObjectInformation.Property(59); // altitude
if( haveTarget != 'TypeError: Object not found. Error = 250.') {
  // we have a target we can query
  var altitude = sky6ObjectInformation.ObjInfoPropOut;
  altitude = altitude.toFixed(1);

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
}

if( SelectedHardware.focuserModel != '<No Focuser Selected>') {
  var temp = ccdsoftCamera.focTemperature.toFixed(1);
  var pos = ccdsoftCamera.focPosition;
  report = report + temp +'|'+ pos;
}


report;

/* Socket End Packet */
