/* Java Script */
/* Socket Start Packet */
// SkyX_JS_MatchAngle
//  Stephen Townsend
//  2018-04-21

var targetAng= $000;
var pixelSize =$001;
var EXPOSURE = $002;
var ACCURACY = $003; // acceptable difference between target angle and ImageLink angle
var CCDSC = ccdsoftCamera;
var Out="";

// *******************************
// Calc position to rotate too...
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
// Rotate to within accuracy
function rotate(targetAng, imageScale ) {
  // Setup to take ref image
  CCDSC.AutoSaveOn = 1;
  CCDSC.ExposureTime=EXPOSURE; // use automated time
  CCDSC.TakeImage();

  /// process ref image
  ImageLink.scale = imageScale; // use automated scale
  ImageLink.pathToFITS = CCDSC.LastImageFileName;
  ImageLink.execute();

  // Use image results to determine rotation
  var imageLinkAng=ImageLinkResults.imagePositionAngle; // the real sky position
  var rotPos = CCDSC.rotatorPositionAngle(); // the real position
  var newPos = calcNewPostion( imageLinkAng, rotPos, targetAng);
  Out = "Success|imageLinkAng="+ imageLinkAng + "|targetAngle=" + targetAng + "|rotPos=" + rotPos + "|newPos=" + newPos;
  RunJavaScriptOutput.writeLine ("imageLinkAng="+ imageLinkAng + ", targetAngle=" + targetAng + ", rotPos=" + rotPos + ", newPos=" + newPos);
  // VERIFY ANGLE and if not rotate
  if( Math.abs(targetAng-imageLinkAng)>ACCURACY) {
    CCDSC.rotatorGotoPositionAngle(newPos);
    while( CCDSC.rotatorIsRotating() ) {
    }
    rotate(targetAng, imageScale );
  }
}

// *******************************
// Okay.. let's getting going....

// connect to the camera
CCDSC.Connect();

// Grab current settings so it can be restored
var oFrame = CCDSC.Subframe;
var oExp = CCDSC.ExposureTime;
var obinX = CCDSC.BinX;
var obinY = CCDSC.BinY;
var oSave = CCDSC.AutoSaveOn;

var knownImageScale = pixelSize * obinX;

rotate( targetAng, knownImageScale ); // using 1.17 and CCW=false for simulator

// Restore current settings
CCDSC.BinX = obinX;
CCDSC.BinY = obinY;
CCDSC.Subframe = oFrame;
CCDSC.ExposureTime = oExp;
CCDSC.AutoSaveOn = oSave;

RunJavaScriptOutput.writeLine ("DONE");
Out = Out;

/* Socket End Packet */
