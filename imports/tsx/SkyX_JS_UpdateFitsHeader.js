/* Java Script */
/* Socket Start Packet */

//

var Out = '';			// Form the output string
var targetName = "$000";

//open TSX camera and get the last image
var tsxi = ccdsoftCameraImage;
var success = tsxi.AttachToActiveImager();

//Add some FITSKeywords for future reference

//Correct the OBJECT Keyword if using coordinates instead of a target name
tsxi.setFITSKeyword("OBJECT", targetName);

//Enter the rotator angle
var tsxc = ccdsoftCamera;
if( tsxc.focIsConnected ) {
  tsxi.setFITSKeyword("FOCUS_POS", tsxc.focPosition);
}
if( tsxc.rotatorIsConnected ) {
  tsxi.setFITSKeyword("ROTATOR_POS", tsxc.rotatorPositionAngle());
}

//Set save path and save
//tsxi.Path = targetImageDataPath;

tsxi.Save();

Out = tsxi.Path;

/* Socket End Packet */
