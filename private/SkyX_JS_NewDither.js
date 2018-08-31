/* Java Script */
/* Socket Start Packet */
// SkyX_JS_NewDither
//
// This is the second generation dithering script.
//
// It brings the random number generation and math into JavaScript from Bash and uses the mount jog procedure
// instead of the move guidestar procedure.
//
// Random number code lifted from Ionut G. Stan:
// http://stackoverflow.com/questions/1527803/generating-random-numbers-in-javascript-in-a-specific-range
//
// Partially inspired by a dithering script written by Richard Wright:
// http://www.bisque.com/sc/blogs/seeker_blog/archive/2013/03/18/the-joy-of-scripting.aspx
//
// Thanks to David McClain for reminding me about the whole high latitude issue which I tried to crudely
// address in the code:
// http://www.bisque.com/sc/forums/t/26737.aspx
//
// Ken Sturrock
// January 13, 2018
//

var pixelSize = $000; // 3.8;
var minDitherFactor = $001; // 3;
var maxDitherFactor = $002;  // 7;


var FITSProblem = "no";
var FITSPixel;
var imageScale = 1.70;
var focalLength;
var binning;
var CCDI = ccdsoftCameraImage;
var CCD = ccdsoftCamera;

try {
	CCDI.AttachToActiveImager();
}
catch(e) {
	var exp = CCD.ExposureTime;
	CCD.ExposureTime = 3;
	CCD.TakeImage();
	CCD.ExposureTime = exp;
	CCDI.AttachToActiveImager();

}

// *******************************
// End any auto guide
var CCDAG = ccdsoftAutoguider;
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

if ( CCD.ImageUseDigitizedSkySurvey != "1" ) {
	try
	{
		FITSPixel = CCDI.FITSKeyword("XPIXSZ")
	}
	catch (repErr)
	//
	//	If error, report it.
	//
	{
		FITSPixel = pixelSize;
	}

	try
	{
		CCD.PropDbl("m_dTeleFocalLength");
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
		CCD.PropLng("m_nXBin");
	}
	catch (repErr)
	//
	//	If error, report it.
	//
	{
		FITSProblem = "yes";
	}


	if ( FITSProblem == "yes" )
	//
	// If we can't get the header data to calculate the image scale,
	// just make some shit up....
	//
	{
		imageScale = 2.0;

	} else {

		focalLength = CCD.PropDbl("m_dTeleFocalLength");;
		pixelSize = FITSPixel;
		binning = CCD.PropLng("m_nXBin");;

		imageScale = ( (pixelSize * binning) / focalLength ) * 206.3;

		imageScale = imageScale.toFixed(2);
	}
}

// Change this if you want different min/max dither factors, but be cautious not to go
// overboard.
var minDither = imageScale * minDitherFactor;
var maxDither = imageScale * maxDitherFactor;


// Generate our random numbers with the above min/max constraints and divide them by
// sixty to get arc-seconds in decimal format.
var DitherX = (Math.floor(Math.random() * (maxDither - minDither +1)) + minDither) / 60;
var DitherY = (Math.floor(Math.random() * (maxDither - minDither +1)) + minDither) / 60;

// Crude hack to try to compensate for high latitudes.
sky6ObjectInformation.Property(55);
var targDec = sky6ObjectInformation.ObjInfoPropOut;
var targRads = (Math.abs(targDec) * (Math.PI / 180));
var out2 = Math.cos(targRads);
var DecFactor = (1 / Math.cos(targRads));

	DitherY = DitherY * Math.abs(DecFactor);

// Trim off the over-precise values from the arc-seconds.
DitherX = DitherX.toFixed(3);
DitherY = DitherY.toFixed(3);

// Generate classical 60th of a minute seconds values for pretty printing.
var HMSX=DitherX * 60;
var HMSY=DitherY * 60;

// generate some random binaries to get direction values for the jogs.
var NorS = (Math.floor(Math.random() * 2))
var EorW = (Math.floor(Math.random() * 2))

if ( NorS == "0" )
//
// Turn the 0 or 1 into a North or South
//
{

	NorS = "N";

} else {

	NorS = "S";

}

if ( EorW == "0" )
//
// Turn to 0 or 1 into an East or West
//
{

	EorW = "E";

} else {

	EorW = "W";

}

sky6RASCOMTele.Jog(DitherX, NorS);		// Jog mount in X
sky6RASCOMTele.Jog(DitherY, EorW);		// Jog mount in Y

while (!sky6RASCOMTele.IsSlewComplete)
//
// The jog is run synchronous, but just in case...
//
{
	sky6Web.Sleep(1000);
}

out= 'Success|'+ HMSX.toFixed(1) + "|NorS|" + HMSY.toFixed(1) + "|EorW" +'|'+focalLength+'|'+binning;

/* Socket End Packet */
