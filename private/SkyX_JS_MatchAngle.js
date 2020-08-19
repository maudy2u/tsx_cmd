/* Java Script */
/* Socket Start Packet */
// SkyX_JS_MatchAngle
//  Graham (Craig) and Stephen Townsend
//  2020-05-27
// *******************************
var TARGET_PA =  $000; // the desire angle for ImageLink to report, e.g. 0, or 22.3
var ACCURACY = $003; // The difference required b/w TARGET_PA cf. ImageLink, e.g. 0.05
var JUSTROTATE = $004; // Use 0 to get ImageLink PA within ACCURACY; 1 will just rotate assuming in sync 
var PIXELSIZE = $001; // ImageLink Camera pixelscale. Used in case BINNING is used. Simulator is 1.7
var FOCALLENGTH = $002; // System focal length.  Use to in case BINNING is used. Simulator is 1.7
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


// TakeImage and return PA
function currentPA() {
  ImageLink.scale = AILSSCALE; // SEEMS THIS MAY BE IGNORED
  ImageLink.pathToFITS = CCDSC.LastImageFileName;
  ImageLink.execute();
  return Number( ImageLinkResults.imagePositionAngle );//sky position
}

// *******************************
// Calc position to rotate too...
// Assume starting at the 180 position
function calcMove( cur_pa, tar_pa) {
  var move = Number(cur_pa)-Number(tar_pa);
  //TSX.writeLine ("first  : " + move)
  var i = 0;
  while (Math.abs(move) > 90 && Math.abs(move) != 180) {
    if( move > 90 && move < 180 ) {
      move = move-180;
      //TSX.writeLine ("iter direct: ", i)
      i = i + 1;
      continue;
    }
    else if( move < -90 && move > -180 ) {
      move = move+180;
      //TSX.writeLine ("iter neg: ", i)
      i = i + 1;
      continue;
    }

    if(   move > 180 ) {
        move = (move-180);
    }
    else if( move < -180 ) {
      move = move+180;
    }
    i = i + 1;
    //TSX.writeLine ("iter adj: ", i)
  }
  return move;
}

function positivePA( pa ) {
	if( pa < 0 ) {
		pa = 360+(pa%360); // add 360 to make positive
	}
	else if( pa >= 360 ) {
		pa = pa %360;
	}
	return Number(pa);
}

function isWithinAccuracy( target_pa, result_pa, accuracy, cur_pa, attempt ) {
  var success = false;
  var err = Math.abs(calcMove(target_pa, result_pa ));

  if( err < accuracy ) {
    success = true;
  }
  TSX.writeLine (
      "[ROTATOR] ATTEMPT " + attempt
    + ": Target PA: " + target_pa.toFixed(2)
    + ", Current PA: " + cur_pa.toFixed(2)
    + ", Result PA: " + result_pa.toFixed(2)
    +  ", Err: " + err.toFixed(2)
  );
  return success;
}

// *******************************
// Rotate to within accuracy
function rotate( target_pa, imageScale, accuracy ) {
  var i = 0;
  var err = 999; // init
  var rot_pa = 0;
  var new_rot_pa = 0;
  var result_pa = 0;
  CCDSC.TakeImage(); // take initial image
  var cur_pa = currentPA(); //ImageLinkResults.imagePositionAngle;//sky position
  OUT = "FAILED";
  TSX.writeLine ("[ROTATOR] Accuracy: " + accuracy.toFixed(2) );
  if( isWithinAccuracy( target_pa, cur_pa, accuracy, cur_pa, i ) ) {
    OUT = 'Success';
    i = MAXTRIES*2;
  }

  while( i< Number(MAXTRIES) && Math.abs(err) > Number(accuracy) ) {


    var move_pa = calcMove( cur_pa, target_pa );
    rot_pa = Number(CCDSC.rotatorPositionAngle());
    new_rot_pa = positivePA( Number(rot_pa)+Number(move_pa) );
    CCDSC.rotatorGotoPositionAngle(new_rot_pa);

    CCDSC.TakeImage(); // take new image, reuse with next iteration
    result_pa = currentPA();

    i++;
    if( isWithinAccuracy( target_pa, result_pa, accuracy, cur_pa, i )) {
      OUT = 'Success';
      break;
    }
    else {
      cur_pa = result_pa;
    }
  }
  var resMsg = "imageLinkAng="+ result_pa.toFixed(3) + "|targetAngle=" + target_pa.toFixed(3) + "|rotPos=" + rot_pa + "|newPos=" + new_rot_pa;
  OUT = OUT + "|" + resMsg;
}

// *******************************
// Start the rotation process
TSX.writeLine ("[ROTATOR] ==== IMAGELINK ===== ");
TARGET_PA = positivePA( TARGET_PA );
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
