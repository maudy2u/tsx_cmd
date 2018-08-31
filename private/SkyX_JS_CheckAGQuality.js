/* Java Script */
/* Socket Start Packet */

//
//	Check guiding quality.
//
//	We want to make sure that the guider is pretty darned close before we kick off the regular settle
//	routine in the bash script. Script reports both absolute as well as signed values.
//
//	Updated to automatically decide a reasonable threshold. The ususal "program around DSS" code
//	is included because I decided to use the FITS values instead of the INI or CAO-supplied values
//	because I couldn't figure out what size the pixel was from the CAO.
//
//	Updated to deal with the issue that some drivers (ZWO at the time of this writing) don't include
//	needed FITS Keywords. If the keywords are missing, claim it's settled and move on with a message.
//
// 	Updated again to cut my EM-11, which guides like a drunk and is paired with a very high resolution
//	camera, a little more slack.
//
//	Ken Sturrock
//	January 13, 2018
//

var camScale = "$000";
var guiderScale = "$001"
var pixelTolerance = "$002"

function isGuidingGood( camImageScale, guiderImageScale) {
	var wait = ((ccdsoftAutoguider.AutoguiderExposureTime + ccdsoftAutoguider.Delay + 1) * 1000);

	var CCDAG = ccdsoftAutoguider;
	var isGuiding = false;
	if( SelectedHardware.autoguiderCameraModel !== '<No Camera Selected>' ) {

		if( CCDAG.State === 5 ) { // check if we are already guding...
			isGuiding = true;
		}
		if( isGuiding) {

			// not needed...
			//var wait = ((ccdsoftAutoguider.AutoguiderExposureTime + ccdsoftAutoguider.Delay + 1) * 1000);

			var errorX = CCDAG.GuideErrorX;
			var errorY = CCDAG.GuideErrorY;
			var Quality =" ";

			imageScaleRatio = (camImageScale / guiderImageScale);
			imageScaleRatio = imageScaleRatio.toFixed(2);

			if (imageScaleRatio < 0.2)
			//
			// I have doubts about measuring this level of accuracy with
			// a centroid calculation at such an undersampled image scale.
			//
			// Relax it a little. Maybe best for user to set in main script
			//
			{
				imageScaleRatio = 0.2;
			}

			var pixelLimit = imageScaleRatio;
			if( pixelTolerance > 0 ) {
				pixelLimit = pixelTolerance;
			}

			//
			// Measure the error regardless of where the limit came from
			//
			if ( (Math.abs(errorX) < pixelLimit) && (Math.abs(errorY) < pixelLimit)  )	{
				Quality = "Good|" + errorX.toFixed(2) + ", " +  errorY.toFixed(2) +'|'+pixelLimit;
			}
			else {
				Quality = "Poor|" + errorX.toFixed(2) + ", " +  errorY.toFixed(2) +'|'+pixelLimit;
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

isGuidingGood( camScale, guiderScale );

/* Socket End Packet */
