/* Java Script */
/* Socket Start Packet */
// Stephen Townsend
// 2018-04-19

var aFilter = $000;
var aduTarget = $001;
var repeat = $002;
var aExpTime = $003;
var aduDelta = 500;
var timeoutAfter = 5;

var aFrame = 'Flat'; //  cdLight =1, cdBias, cdDark, cdFlat
var Out = 'Success|';

while (!ccdsoftCamera.State == 0) {
	sky6Web.Sleep (1000);
}

ccdsoftCamera.Asynchronous = false;		// We are going to wait for it
ccdsoftCamera.AutoSaveOn = true;		// Keep the image
ccdsoftCamera.ImageReduction = 0;		// Don't do autodark, change this if you do want some other calibration (1=AD, 2=full)
ccdsoftCamera.Frame = aFrame;			// It's a light frame
ccdsoftCamera.Subframe = false;			// Not a subframe
ccdsoftCamera.ExposureTime = aExpTime;		// Set the exposure time based on the second parameter from tsxfeeder

if ( SelectedHardware.filterWheelModel !== "<No Filter Wheel Selected>" ) {
	ccdsoftCamera.filterWheelConnect();		// Probably redundant.
	ccdsoftCamera.FilterIndexZeroBased = aFilter;	// Pick a filter (up to eight), set by first parameter from tsxfeeder.
}

// Take initial image
ccdsoftCamera.TakeImage();
var initialImage = ccdsoftCameraImage.AttachToActiveImager();
var aduResult = initialImate.averagePixelValue();

var tries = 0;
var lastExposure = aExpTime;
while( ((aduResult < (aduTarget-aduDelta)) || (aduResult > (aduTarget+aduDelta))) && tries < timeoutAfter ){

	lastExposure = aExpTime;
	aExpTime = aduTarget * lastExposure / aduResult;

	ccdsoftCamera.ExposureTime = aExpTime;		// Set the exposure time based on the second parameter from tsxfeeder
	ccdsoftCamera.TakeImage();
	initialImage = ccdsoftCameraImage.AttachToActiveImager();
	aduResult = initialImate.averagePixelValue();

	tries = tries +1;
}

if( tries >= timeoutAfter ) {
	Out = 'Error|Maxtries exceeded';
}
else {

	for (var i = 0; i < repeats; i++) {
		ccdsoftCamera.TakeImage();

		// what other "exposure values are needed"
		// do we read fits value and rotate if there is a filter?
		// does focuser move automatically

	}
	Out = aFilter + '|' aExpTime + '|' aduResult;
}
Out
/* Socket End Packet */
