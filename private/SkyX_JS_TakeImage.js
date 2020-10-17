/* Java Script */
/* Socket Start Packet */
// Stephen Townsend
// 2018-04-19

var aFilter = '$000';
var aExpTime = '$001';
var aFrame = $002; //  cdLight =1, cdBias, cdDark, cdFlat
var tName = '$003';
var delay = '$004';
var binning = '$005';
var friendly = '$006';
var fPattern = '$007';

var TSX = RunJavaScriptOutput;
var CCDSC = ccdsoftCamera;
var CCDAG = ccdsoftAutoguider;
var CCDSI = ccdsoftCameraImage;
var CHART = sky6StarChart;
var OBJI = sky6ObjectInformation;
var Out = 'Success';

CCDSC.Asynchronous = false;		// We are going to wait for it
CCDSC.ExposureTime = aExpTime;		// Set the exposure time based on the second parameter from tsxfeeder
CCDSC.AutoSaveOn = true;		// Keep the image
CCDSC.ImageReduction = 0;		// Don't do autodark, change this if you do want some other calibration (1=AD, 2=full)
var oldFrame = CCDSC.Frame;
CCDSC.Frame = aFrame;			// It's a light frame
CCDSC.Subframe = false;	 		// Not a subframe
var oldDelay = CCDSC.Delay;
CCDSC.Delay = delay;

var WAIT = ((CCDAG.AutoguiderExposureTime + CCDAG.Delay + 1) * 1000);
while (!CCDSC.State == 0) { sky6Web.Sleep (1000); }

function guideError() {
	var Quality = -1;
	var isGuiding = false;
	if( SelectedHardware.autoguiderCameraModel !== '<No Camera Selected>' ) {

		if( CCDAG.State === 5 ) { // check if we are already guding...
			isGuiding = true;
		}
		if( isGuiding) {
			var errorX = CCDAG.GuideErrorX;
			var errorY = CCDAG.GuideErrorY;
			var rms = Math.sqrt( Math.pow(errorX,2)+Math.pow(errorY,2));
			Quality = Number(rms).toFixed(2);
		}
	}
	return Quality;
}


if ( SelectedHardware.filterWheelModel !== "<No Filter Wheel Selected>" )
{
	CCDSC.filterWheelConnect();		// Probably redundant.
	CCDSC.FilterIndexZeroBased = aFilter;	// Pick a filter (up to eight), set by first parameter from tsxfeeder.
}

// *******************************
// now take image...
var obinX = CCDSC.BinX;
var obinY = CCDSC.BinY;
if( typeof binning !== 'undefined' && binning !== '') {
	// Make sure bin is valid.
	try {
	  CCDSC.BinX = binning; // use bin
	  CCDSC.BinY = binning; // use bin
	}
	catch( err ) {
	}
}

// Use Friendly name if it is defined
var orgASFormula = ccdsoftCamera.PropStr("m_csCustomFileNameLight")
var asFormula = '';
if( typeof fPattern !== 'undefined' && fPattern !== '$007' && fPattern !== '' ) {
	asFormula = fPattern; // use a pattern if it is defined
}
if( typeof friendly !== 'undefined' && friendly !== '$006' && friendly !== '' ) {
	asFormula = asFormula.replace(/:t/g, friendly);
	ccdsoftCamera.setPropStr("m_csCustomFileNameLight", asFormula);
}

CCDSC.TakeImage();
var avgPix = CCDSI.averagePixelValue();
var maxPix = CCDSC.MaximumPixel;
Out = Out.trim() + '|avgPix=' + avgPix + '|maxPix='+maxPix;

ccdsoftCamera.setPropStr("m_csCustomFileNameLight", orgASFormula);

CCDSC.BinX = obinX;
CCDSC.BinY = obinY;
CCDSC.Delay = oldDelay;
CCDSC.Frame = oldFrame;

Out = Out.trim() + '|fileName=' + CCDSC.LastImageFileName.trim();

// get the overall RMS error if guiding
var rms = guideError();
if( rms > -1 ) {
	CCDSI.setFITSKeyword("RMS_ERROR", rms);
	Out = Out+'|RMS_ERROR='+rms;
}

// *******************************
//Add some FITSKeywords for future reference
//open TSX camera and get the last image
var success = CCDSI.AttachToActiveImager();

//Enter the rotator angle
if( CCDSC.rotatorIsConnected() ) {
	var rotatorPosition = CCDSC.rotatorPositionAngle();
  CCDSI.setFITSKeyword("ROTATOR_POS_ANGLE", rotatorPosition);
	Out = Out+'|ROTATOR_POS_ANGLE='+Number(rotatorPosition).toFixed(3);
}
//CCDSC.Asynchronous = true;		// We are going to wait for it

// if( ImageLinkResults.imageFilePath ) {
// 	CCDSI.setFITSKeyword("ANGLE", ImageLinkResults.imagePositionAngle);
// 	Out = Out+'|ANGLE='+Number(ImageLinkResults.imagePositionAngle).toFixed(3);
// }

//Enter the focsuer position
if( CCDSC.focIsConnected ) {
	var temp = CCDSC.focTemperature.toFixed(1);
  var pos = CCDSC.focPosition;
  CCDSI.setFITSKeyword("FOCUS_POS", pos);
	// add focuser info
  Out = Out+'|focusTemp='+ Number(temp).toFixed(3) +'|FOCUS_POS='+ Number(pos).toFixed(0);
}

//Enter the custom object name
if( tName != '$003' ) {
	//Correct the OBJECT Keyword if using coordinates instead of a target name
	CCDSI.setFITSKeyword("OBJECT", tName);
}
if( friendly != '$006' ) {
	//Correct the OBJECT Keyword if using coordinates instead of a target name
	CCDSI.setFITSKeyword("OBJECT", friendly);
}

//Set save path and save
//CCDSI.Path = targetImageDataPath;
CCDSI.Save();

CHART.Find("sun");
OBJI.Property(59);
var sunAlt = OBJI.ObjInfoPropOut;
Out = Out+ '|sunAltitude=' + Number(sunAlt).toFixed(3);

sky6RASCOMTele.DoCommand(11, "")
var BTP = sky6RASCOMTele.DoCommandOutput;
var pointing = '';
if (BTP == 1)
{
  pointing = 'pointing=East';
  // RunJavaScriptOutput.writeLine ("Mount has not flipped and is pointing east.");

} else if (BTP == 0) {

  pointing = 'pointing=West';
  //RunJavaScriptOutput.writeLine ("Mount has flipped and is pointing west.");
}
else {
  pointing = 'pointing=Unknown';
}
Out = Out +'|'+pointing;

if( aFrame == 1
	&& tName !== 'Flat'
	&& tName !== 'Dark'
	&& tName !== 'Bias'
 ) { // not for calibrations
	CHART.Find(tName);
	var haveTarget = OBJI.Property(59); // altitude
	if( haveTarget != 'TypeError: Object not found. Error = 250.') {
		// we have a target we can query
		var altitude = OBJI.ObjInfoPropOut;
		altitude = altitude.toFixed(3);

		OBJI.Property(58); // azimuth
		var azimuth = OBJI.ObjInfoPropOut;
		azimuth = azimuth.toFixed(3);

		OBJI.Property(54);  // RA				// Pull the RA value
		var targetRA = OBJI.ObjInfoPropOut; 		// Stuff RA into variable

		OBJI.Property(55); // DEC			// Pull the DEC value
		var targetDEC = OBJI.ObjInfoPropOut; 		// Stuff DEC into variable

		OBJI.Property(70); // HA			// Pull the Hour Angle value
		var targetHA = OBJI.ObjInfoPropOut; 		// Stuff DEC into variable

		OBJI.Property(68); // TransitTime			// Pull the transitTime value
		var targetTransit = OBJI.ObjInfoPropOut; 		// Stuff DEC into variable

		Out = Out
			+ '|AZ=' +
			azimuth
			+ '|ALT=' +
			altitude
			+ '|RA=' +
			Number(targetRA).toFixed(3)
			+ '|DEC=' +
			Number(targetDEC).toFixed(3)
			+ '|HA=' +
			Number(targetHA).toFixed(3)
			+ '|TRANSIT=' +
			Number(targetTransit).toFixed(3);
	}
}

//TSX.writeLine( 'SAMPLE: ' + Out )
Out;
/* Socket End Packet */
