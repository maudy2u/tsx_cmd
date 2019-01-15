/* Java Script */
/* Socket Start Packet */

//
//	This script takes the GuideX and GuideY variables passed to it from the main script
//	(using the substitution function in Terry's tsxfeeder) and then sets up autoguiding.
//
//	Ken Sturrock
//	January 13, 2018
//


// The lines below take the guide star coordinates from the main script (the $ tokens
// are swapped for the real numbers by tsxfeeder) and the multiplication magic is done
// to un-compensate SkyX's compensation of coordinates for binned images which
// I don't want it to do because I actually know what I'm doing....
//

var CAMSCALE = $004;
var GUIDERSCALE = $005;
var GUIDING_PIXEL_ERROR_TOLERANCE = $006;
var IS_GUIDE_SETTLING_ENABLED = $007;

var CCDSC = ccdsoftCamera;
var CCDAG = ccdsoftAutoguider;
var CCDAGI = ccdsoftCameraImage;

CCDSC.Asynchronous = false;		// We are going to wait for it

var WAIT = ((CCDAG.AutoguiderExposureTime + CCDAG.Delay + 1) * 1000);

function isGuidingGood( camImageScale, guiderImageScale, pixelTolerance ) {
//	var wait = ((CCDAG.AutoguiderExposureTime + CCDAG.Delay + 1) * 1000);

	var isGuiding = false;
	if( SelectedHardware.autoguiderCameraModel !== '<No Camera Selected>' ) {

		if( CCDAG.State === 5 ) { // check if we are already guding...
			isGuiding = true;
		}
		if( isGuiding) {

			// not needed...
			//var wait = ((CCDAG.AutoguiderExposureTime + CCDAG.Delay + 1) * 1000);

			var errorX = CCDAG.GuideErrorX;
			var errorY = CCDAG.GuideErrorY;
			var Quality =" ";

			var imageScaleRatio = (camImageScale / guiderImageScale);
			var imageScaleRatio = imageScaleRatio.toFixed(2);

			if (imageScaleRatio < 0.2)
			//
			// I have doubts about measuring this level of accuracy with
			// a centroid calculation at such an undersampled image scale.
			//
			{
				imageScaleRatio = 0.2; // default for "GOOD"
			}
			var pixelLimit = imageScaleRatio;

			// If user provides a pixelTolerance then use it instead of the
			// calculated tolerance
			if( pixelTolerance > 0 ) {
				pixelLimit = pixelTolerance;
			}

			//
			// Measure the error regardless of where the limit came from
			//
			if ( (Math.abs(errorX) < pixelLimit) && (Math.abs(errorY) < pixelLimit)  )	{
				Quality = "Good|" + Number(errorX).toFixed(2) + ", " +  Number(errorY).toFixed(2) +'|'+pixelLimit;
			}
			else {
				Quality = "Poor|" + Number(errorX).toFixed(2) + ", " +  Number(errorY).toFixed(2) +'|'+pixelLimit;
			}
			if ( CCDAG.ImageUseDigitizedSkySurvey == "1" )
			//
			// Test to see if we are using the simulator, if so, say everything is great.
			//
			{
				Quality = "Good|Simulator ";
			}
		}
		else {
			Quality = "Good|Not Guiding ";
		}
	}
	else {
		Quality = "Good|No guider ";
	}
	return Quality;
}

// *******************************
// Settle guiding...
// if good, continue... if not then wait for X SECONDS and then check again...
var chk_count = 0;
var max_chk = 8; // use nice number... :)
var guideQuality = "Not checked";
while( IS_GUIDE_SETTLING_ENABLED && (chk_count < max_chk) && (guideQuality === "Poor" || guideQuality == "Not checked") ) {
	var res = isGuidingGood( CAMSCALE, GUIDERSCALE, GUIDING_PIXEL_ERROR_TOLERANCE );
	guideQuality = res.split('|')[0].trim();
	sky6Web.Sleep (WAIT);
	RunJavaScriptOutput.writeLine (guideQuality);
	chk_count++;
}

Out = 'Success|' + guideQuality
/* Socket End Packet */
