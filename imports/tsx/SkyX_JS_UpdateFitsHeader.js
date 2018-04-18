/* Java Script */
/* Socket Start Packet */

//

var Out = '';			// Form the output string
var targetName = "$000";

//open TSX camera and get the last image
var tsxi = ccdsoftImage;
var sucess = tsxi.AttachToActiveImager();

//Add some FITSKeywords for future reference

//Correct the OBJECT Keyword if using coordinates instead of a target name
tsxi.setFITSKeyword("OBJECT", targetName);

//Enter the rotator angle
var tsxc = ccdsoftCamera;
if( tsxc.focIsConnected ) {
  tsxi.setFITSKeyword("ROTATOR_ANG", tsxc.rotatorPositionAngle().ToString());
  tsxi.setFITSKeyword("ROTATOR_POS", tsxc.focPosition);
}
//Enter Image Position Angle as saved

tsxi.setFITSKeyword("ORIENTAT", tplan.GetItem(TargetPlan.sbTargetPAName));

//Set save path and save

tsxi.Path = targetImageDataPath;

tsxi.Save();

Out;

/* Socket End Packet */
