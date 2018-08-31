/* Java Script */
/* Socket Start Packet */
// SkyX_JS_Focus-3
//
// This is the experimental @F3 focusing module.
//
// You will have to have configured your @F3 system previously.
//
// The required build level is something of a guess. The @F3 button doesn't appear
// in the normal SXP interface until 113??, but I didn't want the LTI users
// to whine and get huffy. The hooks seem to be there in 11177, so I used that.
//
// Ken Sturrock
// January 17, 2018
// Stephen Townsend
// Modified so guiding is not affected by the AutoFocus... disable Guide while focusing...

var CCDSC	= ccdsoftCamera;
var CCDAG = ccdsoftAutoguider;
var focusingFilter = $000;
var focusExp = $001;
var numFocSamples = 1;
var initExp = ccdsoftCamera.ExposureTime;			// How long of an exposure does the camera use?

if ( Application.build >= 11177 ) {

	// If there is a filter wheel then set it to the filter provided, else skip
	if ( SelectedHardware.filterWheelModel !== "<No Filter Wheel Selected>" ) {
		CCDSC.FilterIndexZeroBased = focusingFilter; 	// set in main script
	}

	// If there is no focuser... skip
	if ( SelectedHardware.focuserModel !== "<No Focuser Selected>" ) {

		// If it is the simulator, sim out...
		if ( CCDSC.ImageUseDigitizedSkySurvey == "1" ) {
			// Just pretend to focus since we're simulating images and it will fail anyway.
			out = "Simulator";

		}
		else {
			/* ******************************
			// End any auto guide

			Enumerator
			0 cdStateNone 	Camera is idle.
			1 cdStateTakePicture 	Camera is taking a picture.
			2 cdStateTakePictureSeries 	Camera is taking a seriesof pictures.
			3 cdStateFocus 	Camera is acquiring focus pictures.
			4 cdStateMoveGuideStar 	Camera is moving the guide star.
			5 cdStateAutoGuide 	Camera is autoguiding.
			6 cdStateCalibrate 	Camera is calibrating the autoguider.
			7 cdStateTakeColor 	Camera is taking a color image.
			8 cdStateAutoFocus 	Camera is performing autofocus.
			9 cdStateAutoFocus2 Camera is performing autofocus.
			 */
			var isGuiding = false;
			if( SelectedHardware.autoguiderCameraModel !== '<No Camera Selected>' ) {
				if( CCDAG.State === 5 ) { // check if we are already guding...
					isGuiding = true;
				}
				if( isGuiding) {
					while (CCDAG.ExposureStatus == "DSS From Web"){
						sky6Web.Sleep (500);	// Waste time if we are waiting for a DSS download
									// so it doesn't throw an Error 206.
									// Sometimes, it still does....
					}
					CCDAG.Abort();
					while (!CCDAG.State == 0) {
						//
						// Diagnostic routine to make sure the camera is *really* done
						//
						sky6Web.Sleep (500);
					}
					CCDAG.Subframe = false;
				}
			}

			// The section below takes a throw-away light-frame with the chosen base filter.
			// If you don't take a normal image then @Focus will not apply the focuser offset for
			// the filter. This may mean the starting position will be "more bad" but it also means that,
			// in case of focus failure, the focuser will not be set for the present filter and the next light
			// frame taken after the failed focus will be taken with an offset applied ontop of the wrong
			// recycled base position.
			//
			// OK, that makes little sense. Just pretend that you never read it.
			//
			CCDSC.AutoSaveOn = false;		// Toss the image for this one single frame
			CCDSC.ExposureTime = focusExp;			// Set duration for a throw-away light frame
			// var initBinX = CCDSC.BinX;
			// var initBinY = CCDSC.BinY;
			// CCDSC.BinX = 2;
			// CCDSC.Biny = 2;

			// Not needed in @Focus3: http://www.bisque.com/sc/forums/p/32837/169061.aspx#169061
			//CCDSC.ImageReduction = 1;
			//
			CCDSC.TakeImage();			// Snap the throw-away

			CCDSC.AutoSaveOn = true;		// Keep the images for the future

			// Finally! Focus the camera!
			// Use three samples per point and let @F3 figure out the rest.
			var res1 ='';
			var temp = '';
			var pos = '';
			try {
				res1 = CCDSC.AtFocus3(numFocSamples, 1);
			} catch (e) {
				res1 = 'Failed: focus failed.'
			} finally {
				temp = CCDSC.focTemperature.toFixed(1);
				pos = CCDSC.focPosition;
			}
			out = pos +'|'+ temp +'|'+ res1;

			// out = CCDSC.AtFocus2();
			CCDSC.ImageReduction = 0;
			// CCDSC.BinX = initBinX;
			// CCDSC.Biny = initBinY;
			CCDSC.ExposureTime = initExp;		// Restore camera duration time. It'll get set later anyway...

			// Resume Guiding if was guiding
			if( SelectedHardware.autoguiderCameraModel !== '<No Camera Selected>' && isGuiding ) {
				CCDAG.AutoSaveOn = false;		// Dont save these images.
				CCDAG.Subframe = true;		// Use a subframe around the star.
				CCDAG.Frame = 1;			// Light Frame
				CCDAG.Asynchronous = true;		// Turn on so we don't get stuck waiting for an endless process
				CCDAG.Autoguide();			// Do it.
			}
		}

	} else {

		out = "No Focuser";
	}

} else {

		out = "@Focus3 requires a higher build level."
}

out

/* Socket End Packet */
