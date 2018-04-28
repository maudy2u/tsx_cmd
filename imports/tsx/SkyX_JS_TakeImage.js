/* Java Script */
/* Socket Start Packet */

var aFilter = $000;
var aExpTime = $001;
var aFrame = $002; //  cdLight =1, cdBias, cdDark, cdFlat
var Out = 'Success|';

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
ccdsoftCamera.Frame = aFrame;			// It's a light frame
ccdsoftCamera.Subframe = false;			// Not a subframe

if ( SelectedHardware.filterWheelModel !== "<No Filter Wheel Selected>" )
//
// This test looks to see if there is a filter wheel. If so, change filters as instructed.
//
{
	ccdsoftCamera.filterWheelConnect();		// Probably redundant.
	ccdsoftCamera.FilterIndexZeroBased = aFilter;	// Pick a filter (up to eight), set by first parameter from tsxfeeder.
}

ccdsoftCamera.TakeImage();

Out;
/* Socket End Packet */
