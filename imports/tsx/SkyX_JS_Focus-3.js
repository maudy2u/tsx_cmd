/* Java Script */
/* Socket Start Packet */

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

var CCDSC		= ccdsoftCamera;
var focusingFilter = $000;
var bin 		= $001;
var binFactor = $002;
var initExp 		= ccdsoftCamera.ExposureTime;			// How long of an exposure does the camera use?
var initialBinX		= ccdsoftCamera.BinX;
var initialBinY		= ccdsoftCamera.BinY;

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




			//
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
			CCDSC.ExposureTime = 1;			// Set duration for a throw-away light frame

			CCDSC.TakeImage();			// Snap the throw-away

			CCDSC.AutoSaveOn = true;		// Keep the images for the future
			CCDSC.ExposureTime = initExp;		// Restore camera duration time. It'll get set later anyway...


			if ( bin  )
			//
			// Are we binning 2x2 for a OSC camera? This probably doesn't work, but has been reported.
			//
			{
				ccdsoftCamera.BinX = binFactor;
				ccdsoftCamera.BinY = binFactor;
			}



			// Finally! Focus the camera!
			// Use three samples per point and let @F3 figure out the rest.
			//
			out = CCDSC.AtFocus3(3, true);


			if ( bin  )
			//
			// If we binned the camera for focusing, put it back.
			//
			{
				ccdsoftCamera.BinX = initialBinX; // removed quotes
				ccdsoftCamera.BinY = initialBinY; // removed quotes
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
