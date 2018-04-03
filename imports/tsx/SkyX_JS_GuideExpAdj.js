/* Java Script */
/* Socket Start Packet */

//
// Experimental module to tweak the guider exposure time depending
// on the guide star's brightness. 
//
// Ken Sturrock
// Jaunary 17, 2018
//

var guideX = "$000";			// Provided by run_target
var guideY = "$001";			// Provided by run_target
var exposure = "$002";			// This is the default guide exposure - provided by run_target
var delay = "$003";			// default delay - provided by run_target
var totalTime = 0;			// This is the ideal "total time" for a guide cycle
var numToAverage = 3;			// Number of frames to combat seeing. Adjust if needed, don't go crazy
var counter = 0;			// Initialize variable
var brightSum = 0;			//	 "
var brightness = 0;			// 	 "
var out = "";				// 	 "
var BrightestPix = 0;			//	 "
var fullWell = 0;			//	 "
var imageDepth = 0;			//	 "
var bitsExist = "Yes";			// Assume that the image header has a BITPIX field. Check later.
var binsExist = "Yes";			// Assume that the camera reports binning. Check later.
var idealExposure = 0;			// Starting value for scaled exposure value
var idealDelay = 0;			// Set to default for a reasonable initialization value.

function measureStar()
//
// How bright is the star on a scale of zero to one?
//
{
	ccdsoftAutoguider.Asynchronous = false;
	ccdsoftAutoguider.Frame = 1;
	ccdsoftAutoguider.ExposureTime = exposure;	
	ccdsoftAutoguider.AutoSaveOn = false;		
	ccdsoftAutoguider.Subframe = true;

	counter = 0;
	brightSum = 0;

	while ( counter < numToAverage )
	//
	// Take a few images and average them
	//
	{
		counter++

		ccdsoftAutoguider.TakeImage();

		ccdsoftAutoguiderImage.AttachToActiveAutoguider();

		imageDepth = ccdsoftAutoguiderImage.FITSKeyword ("BITPIX");

		fullWell = Math.pow (2, imageDepth);

		brightestPix = ccdsoftAutoguider.MaximumPixel;

		brightness = (brightestPix / fullWell);

		brightSum = brightSum + brightness;
	}

	brightness = (brightSum / numToAverage);
	brightness = brightness.toFixed(2);

}

if (ccdsoftCamera.PropStr("m_csObserver") == "Ken Sturrock")
//
// Reset my chosen values
//
// Do some custom stuff. If your name also happens to be "Ken Sturrock" and you own an EM-200 and/or EM-11
// then modify as appropriate.
//
// My EM-11 seems to like a slightly faster guide exposure time than my EM-200.
//
//
{
	if ( SelectedHardware.mountModel == "EM-200 Temma2" )
	//
	// This is the driver that I use for my EM-200 Temma 2
	//
	{
		exposure = 5;
		delay = 0;
	}

	if ( SelectedHardware.mountModel == "EM-200 Temma PC" )
	//
	// This is the driver that I use for my EM-11 Temma M
	// There isn't an actual driver for the Temma M and if I 
	// use the EM-11 Temma Jr. driver, it will try to "fake park" 
	// instead of actually turning the sidereal drive off.
	//
	{
		exposure = 4;
		delay = 0;
	}
}


totalTime = exposure + delay;		// Reset the total time value to a real value.



//
// This routine checks the previous guider image to see if the camera
// ADC bits and binning are reported. 
//

try
{
	ccdsoftAutoguiderImage.FITSKeyword("BITPIX")
}
	catch (repErr)
	//
	//	If error, report it. 	
	// 
	{
		bitsExist = "no";
	} 

try
{
	ccdsoftAutoguiderImage.FITSKeyword("XBINNING")
}
	catch (repErr)
	//
	//	If error, report it. 	
	// 
	{
		binsExist = "no";
	} 




//
// Take several exposures and average to get brightness
//

if (( ccdsoftAutoguider.ImageReduction > 0 ) && ( bitsExist !== "no") && ( binsExist !== "no"))
//
// Only do this if we are calibrating the guider. I don't want it to freak out over hot
// pixels in the subframe. Also check to make sure that ZWO, or others, haven't forgotten
// a FITS standard field.
//
{

	//
	// Compensate for the CAO's attempt to rescale stuff behind my back if binning is involved
	//
	ccdsoftAutoguider.GuideStarX = guideX * ccdsoftAutoguiderImage.FITSKeyword ("XBINNING") ;	
	ccdsoftAutoguider.GuideStarY = guideY * ccdsoftAutoguiderImage.FITSKeyword ("YBINNING") ;	

	//
	// I was too lazy to reverse engineer and round the TrackBoxX & Y values
	// so I hardcoded 20 as a compromise.
	//
	guideX = Math.round(guideX);
	guideY = Math.round(guideY);

	ccdsoftAutoguider.SubframeTop = ccdsoftAutoguider.GuideStarY - 20;
	ccdsoftAutoguider.SubframeLeft = ccdsoftAutoguider.GuideStarX - 20;

	ccdsoftAutoguider.SubframeBottom = ccdsoftAutoguider.GuideStarY + 20;
	ccdsoftAutoguider.SubframeRight = ccdsoftAutoguider.GuideStarX + 20;
	
	measureStar();

	if ( brightness > 0.85 )
	//
	// If the star is saturated then we have to scale
	// the brightness but we can't scale it because the brightness
	// is inaccurate because it is saturated.
	//
	// So we have to knock the exposure back and then remeasure & scale.
	//
	{
		exposure = exposure * 0.5;

		measureStar();

		if ( brightness > 0.85 )
		//
		// If this is still really bright, then knock it down again.
		//
		{
			
			exposure = exposure * 0.5;

			measureStar();
		}
		
		//
		// Try to reduce the exposure so that the star isn't saturated
		// by aiming for about 60%. I'm purposely aiming higher to try to
		// keep a longer exposure to combat seeing.
		//
		idealExposure = 0.70 / (brightness / exposure)
		idealExposure = idealExposure.toFixed(1)
		exposure = idealExposure;
	}


	if ( brightness < 0.2 )
	//
	// If the star is dim, bump up the exposure.
	//
	{
	
		idealExposure = 0.25 / (brightness / exposure)
		idealExposure = idealExposure.toFixed(1)

		if ( idealExposure > (1.5 * exposure) )
		//
		// Sanity Check to prevent really long guide exposures
		//
		{
			exposure = (1.5 * exposure);

		} else {

			exposure = idealExposure;
		}
	}

	//
	// Tweak the delay to try to balance the total expected time for the AG cycle
	// If the exposure goes long, the delay may go to zero and the cycle may run long.
	//

	idealDelay = totalTime - exposure;
	idealDelay = idealDelay.toFixed(1);

	if ( idealDelay > 0)
	{
		delay = idealDelay;

	} else {

		delay = 0;
	}

	ccdsoftAutoguider.Delay = delay;
	ccdsoftAutoguider.Asynchronous = false;
	ccdsoftAutoguider.Frame = 1;
	ccdsoftAutoguider.Subframe = false;
	ccdsoftAutoguider.AutoguiderExposureTime = exposure;	
	ccdsoftAutoguider.Delay = delay;

	ccdsoftAutoguider.TakeImage();		// Reset the image so that Frame & Guide doesn't try to subframe a subframe

	out += "Guider Exposure: " + exposure + "s, Delay: " + delay + "s";

} else {

	if (( bitsExist == "no" ) || (binsExist == "no"))
	{
		out = "Missing FITS header fields. No adjustment made. Exposure = " + exposure + "s.";

	} else {

		out = "Guider not using calibration. No adjustment made. Exposure = " + exposure + "s.";
	}
}


/* Socket End Packet */

