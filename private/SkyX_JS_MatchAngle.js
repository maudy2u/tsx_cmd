/* Java Script */
/* Socket Start Packet */
// SkyX_JS_MatchAngle
//  Stephen Townsend
//  2018-11-29
// *******************************
var TARGET_PA= $000;
var PIXELSIZE =$001; // 23.07 ... for simulator with 1.7 imagescale and 2800 FL
var FOCALLENGTH = $002; // use 2800 on SIM
var ACCURACY = $003; // DIFF target angle VS. ImageLink angle
var JUSTROTATE = $004;
var OUT="";
var MAXTRIES = 5;
var NUMTRIES = 0;
var CCDSC = ccdsoftCamera;
var AILS = AutomatedImageLinkSettings;
var AILSEXPOSURE = AILS.exposureTimeAILS;
var AILSSCALE = AILS.imageScale;
var AILSFILTER = AILS.filterNameAILS;

function calcNewPostion( imageLinkPA, rotPA, targetAng)  {
  var diff = imageLinkPA - targetAng; // difference between the actual and target
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
  newPos = rotPA+angle;
  return newPos;
}

// *******************************
// Prepare Filter Wheel
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
    OUT = "Failed|Maxmimu attempts reached";
    return;
  }
  NUMTRIES++;
  CCDSC.TakeImage();

  try{
    ImageLink.scale = imageScale; // SEEMS THIS MAY BE IGNORED
    ImageLink.pathToFITS = CCDSC.LastImageFileName;
    ImageLink.execute();
    var imageLinkPA=ImageLinkResults.imagePositionAngle;//sky position
    var rotPA = CCDSC.rotatorPositionAngle();//ROT position
    var newPos = calcNewPostion( imageLinkPA, rotPA, targetAng);
    var resMsg = "imageLinkAng="+ Number(imageLinkPA).toFixed(3) + "|targetAngle=" + Number(targetAng).toFixed(3) + "|rotPos=" + rotPA + "|newPos=" + newPos;
    OUT = "Success|" + resMsg;
    RunJavaScriptOutput.writeLine (resMsg);
    // VERIFY ANGLE and if not rotate
    if( Math.abs(targetAng-imageLinkPA)>ACCURACY) {
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
// Calc position to rotate too...
if( TARGET_PA < 0 ) {
	TARGET_PA = 360+TARGET_PA;
}
else if( TARGET_PA > 360 ) {
	TARGET_PA = TARGET_PA %360;
}

if( getPointing() == "WEST" ) {
		if( TARGET_PA < 180 ) {
			TARGET_PA += 180;
		}
		else {
			TARGET_PA -= 180;
		}
}


// *******************************
CCDSC.Connect();
if( JUSTROTATE == 1 ) {
	CCDSC.rotatorGotoPositionAngle(TARGET_PA);
	var rotPA = CCDSC.rotatorPositionAngle(); // the real position
	var resMsg = "imageLinkPA=NA|targetAngle=NA|rotPos=" + rotPA + "|targetPos=" + TARGET_PA;
	OUT = "Success|" + resMsg;
}
else {

	// Grab settings
	var oFrame = CCDSC.Subframe;
	var oExp = CCDSC.ExposureTime;
	var obinX = CCDSC.BinX;
	var obinY = CCDSC.BinY;
	var oSave = CCDSC.AutoSaveOn;
	setupFilterWheel();

	// take ref image
	var ailsBin = calcBin()
	CCDSC.Subframe = false;
	CCDSC.ExposureTime=AILSEXPOSURE;
	// Make sure bin is valid.
	try {
	  CCDSC.BinX = ailsBin; // use AILS bin
	  CCDSC.BinY = ailsBin; // use AILS bin
	}
	catch( err ) {
	  OUT = "FAILED|BIN INVALID";
	  return OUT;
	}
	CCDSC.AutoSaveOn = 1;// save4link
	CCDSC.Asynchronous = false;
	CCDSC.Frame = 1;// light frame

	// SIMULATOR 1.7 and CCW=false
	rotate( TARGET_PA, AILSSCALE );
	CCDSC.BinX = obinX;
	CCDSC.BinY = obinY;
	CCDSC.Subframe = oFrame;
	CCDSC.ExposureTime = oExp;
	CCDSC.AutoSaveOn = oSave;
}
RunJavaScriptOutput.writeLine ("DONE");
OUT;
/* Socket End Packet */
