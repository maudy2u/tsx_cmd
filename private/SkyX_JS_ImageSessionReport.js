/* Java Script */
//
// Playing around with time to cross an altitude.
//
// Based on a conversation here: http://www.bisque.com/sc/forums/p/35048/185331.aspx
//
// Already found & fixed a couple of bugs since it was posted. Sigh...
//
// Ken Sturrock
// December 27, 2018
//
/*---------------------------*/

var desiredAltitude = 30;
var object = "Bellatrix";

/*---------------------------*/

sky6StarChart.Find(object);

RunJavaScriptOutput.writeLine("Object: " + object);
RunJavaScriptOutput.writeLine("Desired Altitiude: " + desiredAltitude);

// All our trig is in radians, so we have to convert.
var desiredAltitudeRads = (desiredAltitude * (Math.PI / 180));

// We're going to use the transit time from SkyX as our base time
sky6ObjectInformation.Property(68);
var transitTime = sky6ObjectInformation.ObjInfoPropOut;

RunJavaScriptOutput.writeLine("");

// Figure out the latitude for future calculations.
sky6StarChart.DocumentProperty(0);
var ourLatitude = sky6StarChart.DocPropOut;
var ourLatitudeRads = (ourLatitude * (Math.PI / 180));

// Pull the object's Declination.
sky6ObjectInformation.Property(55);
var objDecNow = sky6ObjectInformation.ObjInfoPropOut;
var objDecNowRads = (objDecNow * (Math.PI / 180));

// Pull the current altitude.
sky6ObjectInformation.Property(59);
var currentAltitude = sky6ObjectInformation.ObjInfoPropOut;
RunJavaScriptOutput.writeLine("Current object altitude: " + currentAltitude.toFixed(2) + " degrees.");

// Pull the object's Hour Angle
sky6ObjectInformation.Property(70);
var objHA = sky6ObjectInformation.ObjInfoPropOut;
var objHADeg = objHA * 15.041067;
var objHARad = (objHADeg * (Math.PI / 180));

// Figure out the object's maximum & minimum altitudes for sanity checking.
var maxAltitude = (90 - ourLatitude + objDecNow);

if (maxAltitude > 90)
// This can happen, so we have to make it fit the convention.
{
	maxAltitude = 180 - maxAltitude;
}

// Report this out in a less precise manner.
RunJavaScriptOutput.writeLine("Maximum object altitude: " + maxAltitude.toFixed(2) + " degrees.");

var minAltitude = (Math.abs(ourLatitude) - (90 - Math.abs(objDecNow)));

RunJavaScriptOutput.writeLine("");


if ((desiredAltitude > maxAltitude) || (desiredAltitude < minAltitude))
// Deliver the bad news if the desired height isn't doable. Otherwise, do it.
{
	RunJavaScriptOutput.writeLine("Desired altitude is higher than object's maximum(" + maxAltitude.toFixed(2)
		+ ") or lower than its minimum (" + minAltitude.toFixed(2) + ") altitude.");

} else {

	// This is the spherical trigonometry formula supplied by Patrick Wallace, but I broke it into sections
	// because I get easily confused by lots of parenthesis.
	var upperTerm = Math.sin(desiredAltitudeRads) - (Math.sin(ourLatitudeRads) * Math.sin(objDecNowRads));
	var lowerTerm = Math.cos(ourLatitudeRads) * Math.cos(objDecNowRads);
	var crossingHACos = (upperTerm / lowerTerm);
	var crossingHARads = Math.acos(crossingHACos);

	// Convert from radians into degrees.
	var crossingHADeg = crossingHARads * 180 / Math.PI;

	// Convert from degrees into time.
	var crossingHA = crossingHADeg / 15;

	if ( objHA < 0 )
	// Is the thing rising or setting? If rising, reset the sign on the desired HA to match convention.
	{
		crossingHA = crossingHA * -1;

		RunJavaScriptOutput.writeLine(object + " is currently rising. HA: " + objHA.toFixed(6));

	} else {

		RunJavaScriptOutput.writeLine(object + " is currently setting. HA: " + objHA.toFixed(6));

	}

	RunJavaScriptOutput.writeLine("");

	// Calculate the time at the desired altitude when rising. We'll use the transit time as a base.
	var risingCrossTime = transitTime - Math.abs(crossingHA);

	if (risingCrossTime > 24)
	// Get us back into the valid clock hours.
	{
		risingCrossTime = risingCrossTime - 24;
	}

	if (risingCrossTime < 0)
	// Get us back into the valid clock hours.
	{
		risingCrossTime = risingCrossTime + 24;
	}

	// This is a bunch of annoyance to convert a decimal time into a pretty-looking H:M format time.
	// I could probably make a legitimate date/time  object, but I'm too lazy.
	var risingSplitTime = risingCrossTime.toString();
	risingSplitTime = risingSplitTime.split(".");

	var hours = risingSplitTime[0];

	hours = hours.toString();

	if ( hours.length < 2)
	// Pad the hours with a leading zero if needed.
	{
		hours = "0" + hours;
	}

	var minutes =  "0." + risingSplitTime[1];
	minutes = minutes * 60;
	minutes = Math.floor(minutes);
	minutes = minutes.toString();

	if ( minutes.length < 2)
	// Pad the minutes with a leading zero if needed.
	{
		minutes = "0" + minutes;
	}

	var prettyRiseTime = hours + ":" + minutes;

	// Tell us the time we pass the desired altitude on the way up.
	RunJavaScriptOutput.writeLine("    It crosses " + desiredAltitude + " degrees on the way up at " + prettyRiseTime);

	// Caclulate the setting time, same as above but an HA addition instead of a subtraction.
	var settingCrossTime = transitTime + Math.abs(crossingHA);

	if (settingCrossTime > 24)
	{
		settingCrossTime = settingCrossTime - 24;
	}

	if (settingCrossTime < 0)
	{
		settingCrossTime = settingCrossTime + 24;
	}


	// More string insanity for display purposes.
	var settingSplitTime = settingCrossTime.toString();
	settingSplitTime = settingSplitTime.split(".");

	hours = settingSplitTime[0];

	hours = hours.toString();

	if ( hours.length < 2)
	{
		hours = "0" + hours;
	}

	minutes =  "0." + settingSplitTime[1];
	minutes = minutes * 60;
	minutes = Math.floor(minutes);
	minutes = minutes.toString();

	if ( minutes.length < 2)
	{
		minutes = "0" + minutes;
	}

	var prettySetTime = hours + ":" + minutes;

	// Tell us the time we pass the desired altitude on the way down.
	RunJavaScriptOutput.writeLine("    It crosses " + desiredAltitude + " degrees on the way down at " + prettySetTime);

}
