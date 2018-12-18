/* Java Script */
/* Socket Start Packet */
// SkyX_JS_MatchAngle
//  Stephen Townsend
//  2018-11-29
// *******************************
var TARGETANG= $000;
var PIXELSIZE =$001; // 23.07 ... for simulator with 1.7 imagescale and 2800 FL
var FOCALLENGTH = $002; // use 2800 on SIM
var ACCURACY = $003; // acceptable difference between target angle and ImageLink angle
var JUSTROTATE = $004;
var OUT="";
var MAXTRIES = 5;
var NUMTRIES = 0;
var CCDSC = ccdsoftCamera;
var AILS = AutomatedImageLinkSettings;
var AILSEXPOSURE = AILS.exposureTimeAILS;
var AILSSCALE = AILS.imageScale;
var AILSFILTER = AILS.filterNameAILS;

// *******************************
// Calc position to rotate too...
if( TARGETANG < 0 ) {
	TARGETANG = 360+TARGETANG;
}
else if( TARGETANG > 360 ) {
	TARGETANG = TARGETANG %360;
}
function calcNewPostion( imageLinkAng, rotPos, targetAng)  {
  var diff = imageLinkAng - targetAng; // difference between the actual and target
  var newPos = 0; // new possition for the rotator
  var angle = diff; //Math.abs(diff);
  var offset = 0;
  if( angle > 180 ) {
     offset = 360-angle;
  } else {
    offset = angle;
  }
  var sign = 0;
  if( (diff >= 0 && diff <= 180 ) || (diff <=-180 && diff >=-360) ) {
    sign = 1;
  } else {
    sign = -1;
  }
  offset = offset*sign;
  newPos = rotPos+angle;
  return newPos;
}

// *******************************
// Prepare Filter Wheel if present
function setupFilterWheel() {
  // Setup the Filter if connected to the AILS
  if( CCDSC.filterWheelIsConnected() ) {
    // switch to the AILS filter
    var num = CCDSC.lNumberFilters;
    var slot = -1;
    for( var i=0; i < num; i++ ) {
      var nam = CCDSC.szFilterName(i);
      if( nam === AILSFILTER ) {
        slot = i;
        break;
      }
    }
    if( slot > -1 ) {
      CCDSC.FilterIndexZeroBased = slot; // match AILS
    }
    else {
      CCDSC.FilterIndexZeroBased = 0; // default setting
    }
  }
}

// *******************************
// cannot get the AILS BIN setting, so need to
// calc the BIN manualy...
function calcBin() {
  var imageScale = PIXELSIZE*206.3/FOCALLENGTH;
  var bin = Number(AILSSCALE / imageScale).toFixed(0);
  if( bin < 1 || CCDSC.ImageUseDigitizedSkySurvey == "1" ){
    bin = 1;
  }
  return bin;
}

// *******************************
// Rotate to within accuracy
function rotate( targetAng, imageScale ) {
  if( NUMTRIES > MAXTRIES ) {
    OUT = "Failed|Maxmimu Number of attempts reached";
    return;
  }
  NUMTRIES++;
  CCDSC.TakeImage();

  /// process ref image
  try{
    ImageLink.scale = imageScale; // SEEMS THIS MAY BE IGNORED
    ImageLink.pathToFITS = CCDSC.LastImageFileName;
    ImageLink.execute();

    // Use image results to determine rotation
    var imageLinkAng=ImageLinkResults.imagePositionAngle; // the real sky position
    var rotPos = CCDSC.rotatorPositionAngle(); // the real position
    var newPos = calcNewPostion( imageLinkAng, rotPos, targetAng);
    var resMsg = "imageLinkAng="+ Number(imageLinkAng).toFixed(2) + "|targetAngle=" + Number(targetAng).toFixed(2) + "|rotPos=" + rotPos + "|newPos=" + newPos;
    OUT = "Success|" + resMsg;
    RunJavaScriptOutput.writeLine (resMsg);
    // VERIFY ANGLE and if not rotate
    if( Math.abs(targetAng-imageLinkAng)>ACCURACY) {
      CCDSC.rotatorGotoPositionAngle(newPos);
      while( CCDSC.rotatorIsRotating() ) {
      }
      rotate( targetAng, imageScale );
    }
  }
  catch(  err ) {
    OUT = "Failed|ImageLink Failed: " + err;
  }
}

// *******************************
// Okay.. let's getting going....
// connect to the camera
CCDSC.Connect();
if( JUSTROTATE == 1 ) {
	CCDSC.rotatorGotoPositionAngle(TARGETANG);
	var rotPos = CCDSC.rotatorPositionAngle(); // the real position
	var resMsg = "imageLinkAng=NA|targetAngle=NA|rotPos=" + rotPos + "|targetPos=" + TARGETANG;
	OUT = "Success|" + resMsg;
}
else {

	// Grab current settings so it can be restored
	var oFrame = CCDSC.Subframe;
	var oExp = CCDSC.ExposureTime;
	var obinX = CCDSC.BinX;
	var obinY = CCDSC.BinY;
	var oSave = CCDSC.AutoSaveOn;
	setupFilterWheel();

	// USE AutoImageLink settings to take ref image
	var ailsBin = calcBin()
	CCDSC.Subframe = false; // turn off
	CCDSC.ExposureTime=AILSEXPOSURE; // use AILS exposure
	// Make sure bin is valid.
	try {
	  CCDSC.BinX = ailsBin; // use AILS bin
	  CCDSC.BinY = ailsBin; // use AILS bin
	}
	catch( err ) {
	  OUT = "FAILED|BIN NOT CALCULATED CORRECTLY";
	  return OUT;
	}
	CCDSC.AutoSaveOn = 1; // save so can link
	CCDSC.Asynchronous = false;		// We are going to wait for it
	CCDSC.Frame = 1;			// It's a light frame

	// Start the Rotation
	// Could also pick a bin and set the imagescale
	rotate( TARGETANG, AILSSCALE ); // SIMULATOR USES 1.7 and Rotator CCW=false

	// Restore current settings
	CCDSC.BinX = obinX;
	CCDSC.BinY = obinY;
	CCDSC.Subframe = oFrame;
	CCDSC.ExposureTime = oExp;
	CCDSC.AutoSaveOn = oSave;
}
RunJavaScriptOutput.writeLine ("DONE");
OUT;
/* Socket End Packet */
