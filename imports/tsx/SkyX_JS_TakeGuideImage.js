/* Java Script */
/* Socket Start Packet */

//
//	This JavaScript code simply connects to the guide camera and takes a picture
//
//	Ken Sturrock December 25, 2017
//
export function tsxCmdTakeGuiderImage(guideExposure) {
var Out = '\
ccdsoftAutoguider.Connect();\
ccdsoftAutoguider.Asynchronous = false;\
ccdsoftAutoguider.Frame = 1;\
ccdsoftAutoguider.Subframe = false;\
ccdsoftAutoguider.ExposureTime = "'+guideExposure+'";		// Set the normal exposure duration for "regular" images (from main script)\
ccdsoftAutoguider.AutoguiderExposureTime = "'+guideExposure+'";	// Set the guide exposure duration to the same to preserve my sanity.\
ccdsoftAutoguider.AutoSaveOn = true;			// This must be set for the image analysis routine to work later.\
if (SelectedHardware.autoguiderCameraModel == "SBIG ST-i")\
{\
	ccdsoftAutoguider.ImageReduction = 1;\
}\
ccdsoftAutoguider.TakeImage();\
Out="Success|";\
';
return Out;
}
