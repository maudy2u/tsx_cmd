/* Java Script */
/* Socket Start Packet */

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

var FITSProblem = "no";

ccdsoftCameraImage.AttachToActiveImager();

if ( ccdsoftCamera.ImageUseDigitizedSkySurvey == "1" )
//
// Test to see if we are using the simulator, set image scale to 1.7
//
// Otherwise extract metadata from the most recent image's FITS header
// to calculate the image scale. This is used to adjust the distance moved
// to compensate for different pixel sizes.
//
// If, however, you own a camera whose driver fails to provide the needed
// data in the FITS header (cough, ZWO....) then just dither as if your image
// scale is two AS/pixel. This is, of course, probably wrong but at least
// it's something.
//
{

	var imageScale = 1.70;

} else {


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
		ccdsoftCamera.PropDbl("m_dTeleFocalLength");
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
		ccdsoftCamera.PropLng("m_nXBin");
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
		var imageScale = 2.0;

	} else {

		var focalLength = ccdsoftCamera.PropDbl("m_dTeleFocalLength");;
		var pixelSize = ccdsoftCameraImage.FITSKeyword ("XPIXSZ");
		var binning = ccdsoftCamera.PropLng("m_nXBin");;

		var imageScale = ( (pixelSize * binning) / focalLength ) * 206.3;

		imageScale = imageScale.toFixed(2);
	}
}

// Change this if you want different min/max dither factors, but be cautious not to go
// overboard.
var minDither = imageScale * 2.5;
var maxDither = imageScale * 7;


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

out= 'Success|'+ HMSX.toFixed(1) + "|NorS|" + HMSY.toFixed(1) + "|EorW";

/* Socket End Packet */
