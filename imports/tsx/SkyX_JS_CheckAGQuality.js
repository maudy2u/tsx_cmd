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

var wait = ((ccdsoftAutoguider.AutoguiderExposureTime + ccdsoftAutoguider.Delay + 1) * 1000);

var pixelLimit = "$000"

var errorX = ccdsoftAutoguider.GuideErrorX;
var errorY = ccdsoftAutoguider.GuideErrorY;
var Quality =" ";
var imageScaleRatio = 0;
var FITSProblem = "no";

if (( pixelLimit == "autoGC" ) || (pixelLimit == "autoGL" ))
//
// Did the user specify a close or lost value, or do we calculate it?
//
{
	try
	//
	// Try to connect to the camera image
	//
	{ 
			ccdsoftCameraImage.AttachToActiveImager();
	}
	
		catch (repErr)
		//
		//	If there's no picture, take a token picture - we just want the FITS header
		// 
		{
	
			ccdsoftCamera.Asynchronous = false;
			ccdsoftCamera.Frame = 1;
			ccdsoftCamera.Delay = 0;
			ccdsoftCamera.Subframe = false;
			ccdsoftCamera.ExposureTime = 1;


			ccdsoftCamera.TakeImage();
			ccdsoftCameraImage.AttachToActiveImager(); 
		} 
	
	
	try
	//
	// Try to connect to the guider image
	//
	{ 
			ccdsoftAutoguiderImage.AttachToActiveAutoguider(); 
	}
	
		catch (repErr)
		//
		//	If error, take a picture.	
		// 
		{
			ccdsoftAutoguider.Asynchronous = false;
			ccdsoftAutoguider.Frame = 1;
			ccdsoftAutoguider.Subframe = false;
			ccdsoftAutoguider.ExposureTime = 1;

			ccdsoftAutoguider.TakeImage();
			ccdsoftAutoguiderImage.AttachToActiveAutoguider(); 
		} 

	if ( ccdsoftCamera.ImageUseDigitizedSkySurvey == "0" ) 
	//
	//	So, the simulator does have pixel size values but they are a different keyword than
	//	SkyX inserts. Therefore, if using the simulator, skip this stuff because we'll
	//	set the image scale down below anyway.
	//
	//	If we're using real hardware, but the FITS keywords aren't filled out properly
	//	then throw a flag so we don't blow up the math.
	//
	//	What a cluster....
	//
	{
		

 		try
		{
			ccdsoftAutoguiderImage.FITSKeyword("XPIXSZ")
		}
			catch (repErr)
			//
			//	If error, report it. 	
			// 
			{
				FITSProblem = "yes";
			} 
	
		try
		//
		//	Of course this glosses over idiocy like rectangular pixels in the Lodestar
		//
		{
			ccdsoftAutoguiderImage.FITSKeyword("XBINNING")
		}
			catch (repErr)
			//
			//	If error, report it. 	
			// 
			{
				FITSProblem = "yes";
			} 
	
		try
		{
			ccdsoftCameraImage.FITSKeyword("XPIXSZ")
		}
			catch (repErr)
			//
			//	If error, report it. 	
			// 
			{
				FITSProblem = "yes";
			} 
	
		try
		{
			ccdsoftCameraImage.FITSKeyword("XBINNING")
		}
			catch (repErr)
			//
			//	If error, report it. 	
			// 
			{
				FITSProblem = "yes";
			} 
	}


	if ( FITSProblem !== "yes" )
	//
	//	Set the image scale for the simulator, or use the FITS values
	//
	{

	
		if ( ccdsoftCamera.ImageUseDigitizedSkySurvey == "1" ) 
		//
		//	Imaging Camera Voodoo
		//
		//	The DSS images don't have a FITS keyword for focal length so
		//	just set the image scale without doing the math.
		//
		{
		
			var camImageScale = 1.70; 
		
		} else {
		
			var camFocalLength = ccdsoftCameraImage.FITSKeyword ("FOCALLEN");
			var camPixelSize = ccdsoftCameraImage.FITSKeyword ("XPIXSZ");
			var camBinning = ccdsoftCameraImage.FITSKeyword ("XBINNING");
		
			var camImageScale = ( (camPixelSize * camBinning) / camFocalLength ) * 206.3;
			
			camImageScale = camImageScale.toFixed(2);
		}
		
		if ( ccdsoftAutoguider.ImageUseDigitizedSkySurvey == "1" ) 
		//
		// Guiding Camera Voodo
		//
		// Same as above, but for the guider
		//
		{
	
			var guiderImageScale = 1.70; 
	
		} else {
	
			var guiderFocalLength = ccdsoftAutoguiderImage.FITSKeyword ("FOCALLEN");
			var guiderPixelSize = ccdsoftAutoguiderImage.FITSKeyword ("XPIXSZ");
			var guiderBinning = ccdsoftAutoguiderImage.FITSKeyword ("XBINNING");
		
			var guiderImageScale = ( (guiderPixelSize * guiderBinning) / guiderFocalLength ) * 206.3;
			
			guiderImageScale = guiderImageScale.toFixed(2);
		}
	
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
	
		if (ccdsoftCamera.PropStr("m_csObserver") == "Ken Sturrock")
		//
		// Is it me?
		//
		{
			if (( SelectedHardware.mountModel == "EM-200 Temma PC" ) && (SelectedHardware.cameraModel == "ASICamera")) 
			//
			// This is the driver that I use for my EM-11 Temma M & hi-resolution ZWO
			//
			// Bump up the value a bit because the EM-11 will seldom meet the Auto-calculated settle limit and I don't 
			// want to wait all night.
			//
			{
				imageScaleRatio = 0.9;
			}
		}


		if ( pixelLimit == "autoGL" ) 
		//
		// If we are asking if the guider is LOST, then bump up the value
		//
		{
	
			imageScaleRatio = (imageScaleRatio * 2.5);
		}

		//
		// Set the limit if we calculated it from above
		//
		pixelLimit = imageScaleRatio
	
	}

		
}

if ( FITSProblem !== "yes" )
{

	//
	// Measure the error regardless of where the limit came from
	//
	
	if ( (Math.abs(errorX) < pixelLimit) && (Math.abs(errorY) < pixelLimit)  )
	{
		Quality = "Good;" + errorX.toFixed(2) + ", " +  errorY.toFixed(2);
	} else {
		Quality = "Poor;" + errorX.toFixed(2) + ", " +  errorY.toFixed(2);
	}

	if ( ccdsoftAutoguider.ImageUseDigitizedSkySurvey == "1" ) 
	//
	// Test to see if we are using the simulator, if so, say everything is great.
	//
	{
		Quality = "Good;Simulator ";
	}

} else {

		Quality = "Good;FITS Header Error - Set Close and Lost Values Manually"
}
	
/* Socket End Packet */
