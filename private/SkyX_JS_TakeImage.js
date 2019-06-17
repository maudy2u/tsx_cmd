/* Java Script */
/* Socket Start Packet */
// Stephen Townsend
// 2018-04-19

var Out = 'Success|';
var aFilter = $000;
var aExpTime = $001;
var aFrame = $002; //  cdLight =1, cdBias, cdDark, cdFlat
var tName = '$003';

var CCDSC = ccdsoftCamera;
var CCDAG = ccdsoftAutoguider;
var TSXI = ccdsoftCameraImage;

CCDSC.Asynchronous = false;		// We are going to wait for it
CCDSC.ExposureTime = aExpTime;		// Set the exposure time based on the second parameter from tsxfeeder
CCDSC.AutoSaveOn = true;		// Keep the image
CCDSC.ImageReduction = 0;		// Don't do autodark, change this if you do want some other calibration (1=AD, 2=full)
CCDSC.Frame = aFrame;			// It's a light frame
CCDSC.Subframe = false;			// Not a subframe

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
			//var wait = ((ccdsoftAutoguider.AutoguiderExposureTime + ccdsoftAutoguider.Delay + 1) * 1000);

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

while (!CCDSC.State == 0)
//
// Diagnostic routine to make sure the camera is *really* ready
//
{
	sky6Web.Sleep (1000);
}

if ( SelectedHardware.filterWheelModel !== "<No Filter Wheel Selected>" )
//
// This test looks to see if there is a filter wheel. If so, change filters as instructed.
//
{
	CCDSC.filterWheelConnect();		// Probably redundant.
	CCDSC.FilterIndexZeroBased = aFilter;	// Pick a filter (up to eight), set by first parameter from tsxfeeder.
}

// *******************************
// now take image...
CCDSC.TakeImage();

//Enter the rotator angle
if( CCDSC.rotatorIsConnected ) {
	var rotatorPosition = CCDSC.rotatorPositionAngle();
  TSXI.setFITSKeyword("ROTATOR_POS_ANGLE", rotatorPosition);
	Out = Out+'rotatorPosition|'+rotatorPosition;

	// ImageLink.scale = imageScale; // SEEMS THIS MAY BE IGNORED
	// ImageLink.pathToFITS = CCDSC.LastImageFileName;
	// ImageLink.execute();
	// var imageLinkAng=ImageLinkResults.imagePositionAngle;//sky position
	// Out = Out+'|positionAngle|'+Number(imageLinkAng).toFixed(3);
}
//CCDSC.Asynchronous = true;		// We are going to wait for it

// *******************************
//Add some FITSKeywords for future reference
//open TSX camera and get the last image
var success = TSXI.AttachToActiveImager();

//Enter the focsuer position
if( CCDSC.focIsConnected ) {
  TSXI.setFITSKeyword("FOCUS_POS", CCDSC.focPosition);
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
