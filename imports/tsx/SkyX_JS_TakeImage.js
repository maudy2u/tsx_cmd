/* Java Script */
/* Socket Start Packet */

var aFilter = $000;
var aExpTime = $001;

//
//	This JavaScript code simply connects to the imaging camera and takes a picture.
//
//	$000 and $001 represent filter and exposure. They are replaced by tsxfeeder.
//
//	Thanks to Matt Bisque for helping me with the QSI readout mode toggle.
//
//	Ken Sturrock
//	January 13, 2018
//


while (!ccdsoftCamera.State == 0)
//
// Diagnostic routine to make sure the camera is *really* ready
//
{
	sky6Web.Sleep (1000);
}

ccdsoftCamera.Asynchronous = false;		// We are going to wait for it
ccdsoftCamera.ExposureTime = aExpTime;		// Set the exposure time based on the second parameter from tsxfeeder
ccdsoftCamera.AutoSaveOn = true;		// Keep the image
ccdsoftCamera.ImageReduction = 0;		// Don't do autodark, change this if you do want some other calibration (1=AD, 2=full)
ccdsoftCamera.Frame = 1;			// It's a light frame
ccdsoftCamera.Subframe = false;			// Not a subframe

if ( SelectedHardware.filterWheelModel !== "<No Filter Wheel Selected>" )
//
// This test looks to see if there is a filter wheel. If so, change filters as instructed.
//
{
	ccdsoftCamera.filterWheelConnect();		// Probably redundant.
	ccdsoftCamera.FilterIndexZeroBased = aFilter;	// Pick a filter (up to eight), set by first parameter from tsxfeeder.
}

if (ccdsoftCamera.PropStr("m_csObserver") == "Ken Sturrock")
//
// Do some custom stuff. If your name also happens to be "Ken Sturrock", modify as appropriate
//
{
	if ( SelectedHardware.cameraModel == "QSI Camera  " )
	//
	// Put my QSI into High Quality (but slow) mode for less noisy images
	//
	{
		ccdsoftCamera.setPropStr("m_csExCameraMode", "Higher Image Quality");
	}

	ccdsoftCamera.Delay = 1;			// Set delay to one second on all my cameras
}

	ccdsoftCamera.TakeImage();


if (ccdsoftCamera.PropStr("m_csObserver") == "Ken Sturrock")
//
// Do some custom stuff. If your name also happens to be "Ken Sturrock", modify as appropriate
//
{

	if ( SelectedHardware.cameraModel == "QSI Camera  " )
	//
	// Put my QSI back into faster mode to speed up less important imaging tasks
	//
	{
		ccdsoftCamera.setPropStr("m_csExCameraMode", "Faster Image Downloads");
	}
}

/* Socket End Packet */
