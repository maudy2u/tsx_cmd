/* Java Script */
/* Socket Start Packet */
// Stephen Townsend
// 2018-04-19

var Out = 'Success|';
var aFilter = $000;
var aExpTime = $001;
var aFrame = $002; //  cdLight =1, cdBias, cdDark, cdFlat
var tName = '$003';

var camScale = $004;
var guiderScale = $005;
var guidingPixelErrorTolerance = $006;
var isGuideSettlingEnabled = $007;

var CCDSC = ccdsoftCamera;
var CCDAG = ccdsoftAutoguider;
var TSXI = ccdsoftCameraImage;
var wait = ((CCDAG.AutoguiderExposureTime + CCDAG.Delay + 1) * 1000);

function isGuidingGood( camImageScale, guiderImageScale, pixelTolerance ) {
	var wait = ((CCDAG.AutoguiderExposureTime + CCDAG.Delay + 1) * 1000);

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

while (!CCDSC.State == 0)
//
// Diagnostic routine to make sure the camera is *really* ready
//
{
	sky6Web.Sleep (1000);
}

CCDSC.Asynchronous = false;		// We are going to wait for it
CCDSC.ExposureTime = aExpTime;		// Set the exposure time based on the second parameter from tsxfeeder
CCDSC.AutoSaveOn = true;		// Keep the image
CCDSC.ImageReduction = 0;		// Don't do autodark, change this if you do want some other calibration (1=AD, 2=full)
CCDSC.Frame = aFrame;			// It's a light frame
CCDSC.Subframe = false;			// Not a subframe

if ( SelectedHardware.filterWheelModel !== "<No Filter Wheel Selected>" )
//
// This test looks to see if there is a filter wheel. If so, change filters as instructed.
//
{
	CCDSC.filterWheelConnect();		// Probably redundant.
	CCDSC.FilterIndexZeroBased = aFilter;	// Pick a filter (up to eight), set by first parameter from tsxfeeder.
}

// *******************************
// check guiding...
// if good, continue... if not then wait for X SECONDS and then check again...
var chk_guiding = isGuideSettlingEnabled;
var chk_count = 0;
var max_chk = 3;
var guideQuality = "Poor";
while( chk_guiding && (chk_count < max_chk) && (guideQuality === "Poor") ) {
	var res = isGuidingGood( camScale, guiderScale, guidingPixelErrorTolerance );
	guideQuality = res.split('|')[0].trim();
	sky6Web.Sleep (wait);
	chk_count++;
}

// *******************************
// now take image...
CCDSC.TakeImage();

// *******************************
//Add some FITSKeywords for future reference
//open TSX camera and get the last image
var success = TSXI.AttachToActiveImager();

//Enter the focsuer position
if( CCDSC.focIsConnected ) {
  TSXI.setFITSKeyword("FOCUS_POS", CCDSC.focPosition);
}
//Enter the rotator angle
if( CCDSC.rotatorIsConnected ) {
  TSXI.setFITSKeyword("ROTATOR_POS", CCDSC.rotatorPositionAngle());
}
//Enter the custom object name
if( tName != '$003' ) {
	//Correct the OBJECT Keyword if using coordinates instead of a target name
	TSXI.setFITSKeyword("OBJECT", tName);
}
//Set save path and save
//TSXI.Path = targetImageDataPath;
TSXI.Save();

Out;
/* Socket End Packet */
