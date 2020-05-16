/* Java Script */
/* Socket Start Packet */
// SkyX_JS_MatchAngle
//  Stephen Townsend
//  2018-11-29
// *******************************
var TARGET_PA =  73; // $000;
var ACCURACY = 0.01; // $003; // DIFF target angle VS. ImageLink angle
var JUSTROTATE = 0; //$004;
var PIXELSIZE = 3.8; //$001; // 23.07 ... for simulator with 1.7 imagescale and 2800 FL
var FOCALLENGTH = 2800; //$002; // use 2800 on SIM
var OUT="";
var MAXTRIES = 5;
var NUMTRIES = 0;
var CCDSC = ccdsoftCamera;
var AILS = AutomatedImageLinkSettings;
var AILSEXPOSURE = AILS.exposureTimeAILS;
var AILSSCALE = AILS.imageScale;
var AILSFILTER = AILS.filterNameAILS;
var TSX = RunJavaScriptOutput;


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


function adjustPA( pa ) {

	var new_pa = pa;
	if( pa < 0 ) {
		pa = 360+pa;
	}
	else if( pa >= 360 ) {
		pa = pa %360;
	}
	return new_pa*1;
}
// Now calculate rotate position
// THE 180 DEGREE RULLE DEPENDS ON THE ROTATOR ROTATION

function diff_PA( target_pa, cur_pa) {
	// any need to handle pointing
	var adj_pa = 0;
	var cw = 0; // if positive add to the imageLinkPA
	var ccw = 0; // if positive substract to the imageLinkPA
	if( target_pa < 180 ) {
		cw = target_pa*1-cur_pa*1;
		ccw = cur_pa*1 - target_pa*1;
	  TSX.writeLine ("  ccw adj: " + ccw ); // if this is greater than zero
	  TSX.writeLine ("  cw adj: " + cw); // if this is greater than zero
	}
	else {
		cw = target_pa*1+180*1-cur_pa*1;
		ccw = cur_pa*1 - target_pa*1-180*1;
	   TSX.writeLine ("  ccw adj: " + ccw ); // if this is greater than zero
	 	TSX.writeLine ("  cw adj: " + cw); // if this is greater than zero
	}

	if( cw > 0 ) {
		adj_pa = cw*1;
	}
	else {
	   adj_pa = ccw*-1;
	}

	return adj_pa*1;
}


// TakeImage and return PA
function currentPA() {
	ImageLink.scale = AILSSCALE; // SEEMS THIS MAY BE IGNORED
	ImageLink.pathToFITS = CCDSC.LastImageFileName;
	ImageLink.execute();
	var p1=ImageLinkResults.imagePositionAngle;//sky position
	return p1*1;
}


// *******************************
// Calc position to rotate too...
// Assume starting at the 180 position

/*
	1. get the current imageLink position
	2. Make sure the target position is within 0-360
	2. Next determine which way to rotate to TARGET_PA... relative to 180 rotation
	3.
 */

 // *******************************
 // Rotate to within accuracy
 function rotate( targetAng, imageScale, accuracy ) {
	 var i = 0;
	 var err = accuracy*1+1;
	 var cur_pa = 0;
	 var rotPA = 0;
	 var new_rotPA = 0;
	 var resultPA = 0;
   var res = "FAILED";
	 TSX.writeLine ("[ROTATOR] accuracy requested: " + accuracy.toFixed(2) + ", init: " + err  );

	 while( i< MAXTRIES && (err*1) > (accuracy*1) ) {
		 // Make sure the target is witin 0-360
		 cur_pa = currentPA(); //ImageLinkResults.imagePositionAngle;//sky position

 	   TSX.writeLine ("\n[ROTATOR] ==== CURRENT PA ===== " + (i*1+1) );
		 TSX.writeLine ("[ROTATOR] Orignal PA: " + cur_pa.toFixed(2) );
		 cur_pa = adjustPA( cur_pa );
		 TSX.writeLine ("[ROTATOR] Adjusted Target PA: " + cur_pa.toFixed(2) );
		 var diff = diff_PA( targetAng*1, cur_pa*1);
		 var exp_PA = cur_pa*1+diff*1;
      exp_PA = adjustPA( exp_PA )*1;
		 TSX.writeLine ("[ROTATOR] imageLink offset: " + diff.toFixed(2) + ", e.g. " + cur_pa.toFixed(2) + "+" + diff.toFixed(2) + "=" + exp_PA.toFixed(2) );

		 TSX.writeLine ("\n[ROTATOR] ==== ROTATOR PA ===== ");
		 rotPA = CCDSC.rotatorPositionAngle()*1;
 		 TSX.writeLine ("[ROTATOR] RotatorPa: " + rotPA.toFixed(2) );
		 new_rotPA = rotPA*1 - diff*1;

//		 diff = diff_PA( new_rotPA*1, rotPA*1);
//		 new_rotPA = rotPA*1 + diff*1;
      new_rotPA = adjustPA( new_rotPA )*1;

		 TSX.writeLine ("[ROTATOR] Adjusted new Rot PA: " + new_rotPA.toFixed(2) );

		 // SUCCESS AS LONG AS THIS I A SUBSTRACTED DIFFERENCE, WHY!!!!
		 TSX.writeLine ("[ROTATOR] RotatorPa offset: " + diff.toFixed(2) );
		 CCDSC.rotatorGotoPositionAngle(new_rotPA);
		 TSX.writeLine ("[ROTATOR] RotatorPa adjustment: " + new_rotPA.toFixed(2) );

		 TSX.writeLine ("\n[ROTATOR] ==== RESULT ===== ");
		 CCDSC.TakeImage();
		 resultPA = currentPA()*1;

		 err = Math.abs( adjustPA(targetAng) - resultPA );

		// MUST CONSIDER THE 180 DEGREE ROTATION RULE
		 if( Math.abs(err-180) < err) {
			err = err-180;
		 }
		 TSX.writeLine ("[ROTATOR] wanted: " + targetAng.toFixed(2) + ", was: " + cur_pa.toFixed(2) +", and now: " + resultPA.toFixed(2) );
		 TSX.writeLine ("[ROTATOR] accuracy requested: " + accuracy.toFixed(2) + ", obtained: " + err.toFixed(2)  );
		 i++;
		 if( err < accuracy ) {
			res = 'Success';
		 }
	 }
	 var resMsg = "imageLinkAng="+ resultPA.toFixed(3) + "|targetAngle=" + targetAng.toFixed(3) + "|rotPos=" + rotPA + "|newPos=" + new_rotPA;
	 OUT = res + "|" + resMsg;
 }

 TSX.writeLine ("[ROTATOR] ==== IMAGELINK ===== ");
 TSX.writeLine ("[ROTATOR] Target PA: " + TARGET_PA.toFixed(2) );
if( JUSTROTATE == 1 ) {
	TSX.writeLine ("[ROTATOR] Just Rotating ");
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
	CCDSC.TakeImage(); // get an initial image
	rotate( TARGET_PA*1, AILSSCALE*1, ACCURACY*1 );

	CCDSC.BinX = obinX;
	CCDSC.BinY = obinY;
	CCDSC.Subframe = oFrame;
	CCDSC.ExposureTime = oExp;
	CCDSC.AutoSaveOn = oSave;
}
TSX.writeLine ("DONE: "+ OUT);
OUT;
/* Socket End Packet */
