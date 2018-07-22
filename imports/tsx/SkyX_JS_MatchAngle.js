/* Java Script */
/* Socket Start Packet */
// SkyX_JS_MatchAngle
//  Stephen Townsend
//  2018-04-21

var targetAng= $000;
var knownImageScale =$001;
var exposure = $002;
var accuracy = 1; // acceptable difference between target angle and ImageLink angle
var Out="";

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
function rotate(targetAng, imageScale ) {
  var ccd = ccdsoftCamera;
  ccd.Connect();
  ccd.AutoSaveOn = 1;
  ccd.ExposureTime=exposure;
  ccd.TakeImage();
  ImageLink.scale = imageScale;
  //ImageLink.unknownScale=1;
  ImageLink.pathToFITS = ccd.LastImageFileName;
  ImageLink.execute();
  var imageLinkAng=ImageLinkResults.imagePositionAngle; // the real sky position
  var rotPos = ccd.rotatorPositionAngle(); // the real position
  var newPos = calcNewPostion( imageLinkAng, rotPos, targetAng);
  Out = "Success|imageLinkAng="+ imageLinkAng + "|targetAngle=" + targetAng + "|rotPos=" + rotPos + "|newPos=" + newPos;
  RunJavaScriptOutput.writeLine ("imageLinkAng="+ imageLinkAng + ", targetAngle=" + targetAng + ", rotPos=" + rotPos + ", newPos=" + newPos);
  // VERIFY ANGLE
  if( Math.abs(targetAng-imageLinkAng)>accuracy) {
    ccd.rotatorGotoPositionAngle(newPos);
    while( ccdsoftCamera.rotatorIsRotating() ) {
    }
    rotate(targetAng, imageScale);
  }
}
var ccd = ccdsoftCamera;
var xbin = ccd.BinX;
var ybin = ccd.BinY;
rotate( targetAng, knownImageScale ); // using 1.17 and CCW=false for simulator
ccd.BinX = xbin;
ccd.BinY = ybin;
RunJavaScriptOutput.writeLine ("DONE");
Out = Out;

/* Socket End Packet */
