/* Java Script */
//
// Ken Sturrock
// December 27, 2018
// modified 2019-01-05, Stephen Townsend
/*---------------------------*/
var request = "$000";

var Out = '';
var TSX = RunJavaScriptOutput;
var SINFO = sky6ObjectInformation;
var SCHART = sky6StarChart;
var targets = request.split('##');
for( var i=0; i<targets.length; i++ ) {
	var object = targets[i].split('|')[0].trim();
	var alt = targets[i].split('|')[1].trim();
	//var passthru = targets[i].split('|')[2].trim();
	try {
		SCHART.Find(object);
	}
	catch( e ) {
		TSX.writeLine("Object not found: " + object);
		continue;
	}

	TSX.writeLine("Object: " + object);
	TSX.writeLine("Desired Altitiude: " + alt);

	// All our trig is in radians, so we have to convert.
	var altRads = (alt * (Math.PI / 180));

	// We're going to use the transit time from SkyX as our base time
	SINFO.Property(68);
	var transitTime = SINFO.ObjInfoPropOut;

	TSX.writeLine("");

	// Figure out the latitude for future calculations.
	SCHART.DocumentProperty(0);
	var lat = SCHART.DocPropOut;
	var latRads = (lat * (Math.PI / 180));

	// Pull the object's Declination.
	SINFO.Property(55);
	var objDecNow = SINFO.ObjInfoPropOut;
	var objDecNowRads = (objDecNow * (Math.PI / 180));

	// Pull the current altitude.
	SINFO.Property(59);
	var currentAltitude = SINFO.ObjInfoPropOut;
	TSX.writeLine("Current object altitude: " + currentAltitude.toFixed(2) + " degrees.");

	// Pull the object's Hour Angle
	SINFO.Property(70);
	var objHA = SINFO.ObjInfoPropOut;
	var objHADeg = objHA * 15.041067;
	var objHARad = (objHADeg * (Math.PI / 180));

	// Figure out the object's maximum & minimum altitudes for sanity checking.
	var maxAlt = (90 - lat + objDecNow);

	if (maxAlt > 90)
	// This can happen, so we have to make it fit the convention.
	{
		maxAlt = 180 - maxAlt;
	}
	TSX.writeLine("Maximum object altitude: " + maxAlt.toFixed(2) + " degrees.");

	var minAlt = (Math.abs(lat) - (90 - Math.abs(objDecNow)));

	TSX.writeLine("");
	if ((alt > maxAlt) || (alt < minAlt))
	{
		TSX.writeLine("Desired altitude is higher than object's maximum(" + maxAlt.toFixed(2)
			+ ") or lower than its minimum (" + minAlt.toFixed(2) + ") altitude.");

	} else {
		var upperTerm = Math.sin(altRads) - (Math.sin(latRads) * Math.sin(objDecNowRads));
		var lowerTerm = Math.cos(latRads) * Math.cos(objDecNowRads);
		var crossingHACos = (upperTerm / lowerTerm);
		var crossingHARads = Math.acos(crossingHACos);
		var crossingHADeg = crossingHARads * 180 / Math.PI;
		var crossingHA = crossingHADeg / 15;

		if ( objHA < 0 )
		{
			crossingHA = crossingHA * -1;
			TSX.writeLine(object + " is currently rising. HA: " + objHA.toFixed(6));
		} else {
			TSX.writeLine(object + " is currently setting. HA: " + objHA.toFixed(6));
		}

		TSX.writeLine("");

		var risingCrossTime = transitTime - Math.abs(crossingHA);

		if (risingCrossTime > 24)
		{
			risingCrossTime = risingCrossTime - 24;
		}

		if (risingCrossTime < 0)
		{
			risingCrossTime = risingCrossTime + 24;
		}

		var risingSplitTime = risingCrossTime.toString();
		risingSplitTime = risingSplitTime.split(".");

		var hours = risingSplitTime[0];

		hours = hours.toString();

		if ( hours.length < 2)
		{
			hours = "0" + hours;
		}

		var min =  "0." + risingSplitTime[1];
		min = min * 60;
		min = Math.floor(min);
		min = min.toString();

		if ( min.length < 2)
		{
			min = "0" + min;
		}

		var prettyRiseTime = hours + ":" + min;

		TSX.writeLine("    It crosses " + alt + " degrees on the way up at " + prettyRiseTime);

		var cTime = transitTime + Math.abs(crossingHA);

		if (cTime > 24)
		{
			cTime = cTime - 24;
		}

		if (cTime < 0)
		{
			cTime = cTime + 24;
		}
		var settingSplitTime = cTime.toString();
		settingSplitTime = settingSplitTime.split(".");

		hours = settingSplitTime[0];

		hours = hours.toString();

		if ( hours.length < 2)
		{
			hours = "0" + hours;
		}

		min =  "0." + settingSplitTime[1];
		min = min * 60;
		min = Math.floor(min);
		min = min.toString();

		if ( min.length < 2)
		{
			min = "0" + min;
		}
		var prettySetTime = hours + ":" + min;

		TSX.writeLine("    It crosses " + alt + " degrees on the way down at " + prettySetTime);

		if( Out != '' ) {
			Out += '##';
		}
		Out += object +'|'+ alt +'|'+ prettyRiseTime +'|'+prettySetTime;
//		Out += object +'|'+ alt +'|'+ prettyRiseTime +'|'+prettySetTime+'|'+passthru;
	}
}
TSX.writeLine(" ************** ");
Out
