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
//

var CCDSC	= ccdsoftCamera;
var focusingFilter = $000;
var focusExp = $001;
var numFocSamples = 1;
var initExp = CCDSC.ExposureTime;			// How long of an exposure does the camera use?
// var initBinX = CCDSC.BinX;
// var initBinY = CCDSC.BinY;

if ( Application.build >= 11177 )
{
	if ( SelectedHardware.filterWheelModel !== "<No Filter Wheel Selected>" )
	//
	// Screen out systems that have an automatic focuser but not a filter wheel.
	//
	{
		CCDSC.FilterIndexZeroBased = focusingFilter; 	// set in main script
	}


	if ( SelectedHardware.focuserModel !== "<No Focuser Selected>" )
	//
	// This test looks to see if there is a focuser as a final fail-safe
	//
	// Again - if you don't have a focuser or don't want to focus what you have,
	// then it is best to set the useAtFocus variable in the main script!
	//
	{

		if ( CCDSC.ImageUseDigitizedSkySurvey == "1" )
		//
		// Just pretend to focus since we're simulating images and it will fail anyway.
		//
		{
			out = "Simulator";

		} else {

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
			// CCDSC.BinX = 2;
			// CCDSC.Biny = 2;

			// Not needed in @Focus3: http://www.bisque.com/sc/forums/p/32837/169061.aspx#169061
			//CCDSC.ImageReduction = 1;

			CCDSC.TakeImage();			// Snap the throw-away
			CCDSC.AutoSaveOn = true;		// Keep the images for the future

			// Finally! Focus the camera!
			// Use three samples per point and let @F3 figure out the rest.
			var res1 ='';
			var temp = '';
			var pos = '';
			try {
				CCDSC.FocusExposureTime = focusExp; // direct from example: atfocus3.js
				res1 = CCDSC.AtFocus3(1, true); // direct from example: atfocus3.js
//				res1 = CCDSC.AtFocus3(numFocSamples, true);
// there have been crashes with the @Focus3 method...
// Not sure if this is a fault of the return type
// suspect it was not the use of the `FocusExposureTime`, which is now set
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

		}

	} else {

		out = "No Focuser";
	}

} else {

		out = "@Focus3 requires a higher build level."
}

out

/* Socket End Packet */
