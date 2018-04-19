/* Java Script */
/* Socket Start Packet */

// Connect hardware selected in TSX.
//
// Stephen Townsend
// 2018-04-19
//

if( SelectedHardware.cameraModel == '<No Camera Selected>') {
	// Nothing to do
} else {
	ccdsoftCamera.Connect();
	sky6Web.Sleep (5000);
	
	if( SelectedHardware.rotatorModel == '<No Rotator Selected>') {
		// Nothing to do
	} else {
		if( !ccdsoftCamera.rotatorIsConnected() ) {
			ccdsoftCamera.rotatorConnect(); // Probably redundant.
		};
	}
	if( SelectedHardware.focuserModel == '<No Focuser Selected>') {
		// Nothing to do
	} else {
		if( !ccdsoftCamera.focIsConnected ) {
			ccdsoftCamera.focConnect(); // Probably redundant.
		}; // Probably redundant.
	}
	if( SelectedHardware.filterWheelModel == '<No Filter Wheel Selected>') {
		// Nothing to do
	} else {
		if( !ccdsoftCamera.filterWheelIsConnected()) {
			ccdsoftCamera.filterWheelConnect(); // Probably redundant.
		};
	}
}

if( SelectedHardware.autoguiderCameraModel == '<No Camera Selected>') {
	// Nothing to do
} else {
	ccdsoftAutoguider.Connect();
	sky6Web.Sleep (5000);
}
if( SelectedHardware.mountModel == '<No Mount Selected>') {
	// Nothing to do
} else {
	if( !sky6RASCOMTele.IsConnected) {
		sky6RASCOMTele.Connect(); // Probably redundant.
	};
}
Out = 'Success'


/* DEBUGING CODE

hasEFW = SelectedHardware.filterWheelModel;
hasRotator = SelectedHardware.rotatorModel;
hasFocuser = SelectedHardware.focuserModel;
hasAG = SelectedHardware.autoguiderCameraModel;
hasCamera = SelectedHardware.cameraModel;
hasMount = SelectedHardware.mountModel;
Out=
hasEFW
+"|"+
hasRotator
 +"|"+
hasFocuser
+"|"+
hasAG
+"|"+
hasCamera
+"|"+
hasMount;

<No Filter Wheel Selected>|
<No Rotator Selected>|
<No Focuser Selected>|
<No Camera Selected>|
<No Camera Selected>|
<No Mount Selected>|
No error. Error = 0.
 */

/* Socket End Packet */
