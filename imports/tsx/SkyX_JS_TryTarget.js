import { Meteor } from 'meteor/meteor';
/* Java Script */
/* Socket Start Packet */

//
// See if the target is valid
//
// Ken Sturrock
// January 13, 2018
//

// select the target per its Ra/dec
function tsxCmdSetTargetRaDec(ra, dec) {
Out = 'var err;\
sky6StarChart.LASTCOMERROR=0;\
sky6StarChart.EquatorialToStarChartXY('+ra+','+dec+');\
sky6StarChart.ClickFind( sky6StarChart.dOut0 ,sky6StarChart.dOut1 );\
err = sky6StarChart.LASTCOMERROR;\
if (err != 0)\
{\
Out = t + " not found."\
return false;\
}\
return "Found";\
}';
};

function tsxCmdFindTargetWithRaDecAlt(ra, dec, alt) {

Out = 'var err;\
var FindStatus	= "Success";	// Preload value for success.\
var altLimit	= "'+ alt +'";	// Really a constant for the altitude limit\
var altitude 	= 0;\
var azimuth 	= 0;\
var out 	= "";\
var FindStatus	= "Success";\
try{\
sky6StarChart.LASTCOMERROR=0;\
sky6StarChart.EquatorialToStarChartXY('+ra+','+dec+');\
sky6StarChart.ClickFind( sky6StarChart.dOut0 ,sky6StarChart.dOut1 );\
}catch(repErr){FindStatus = "fail";}\
if(FindStatus=="fail"){out = "cannot be found.";\
}else{\
sky6ObjectInformation.Property(59);\
altitude = sky6ObjectInformation.ObjInfoPropOut;\
altitude = altitude.toFixed(1);\
sky6ObjectInformation.Property(58);\
azimuth = sky6ObjectInformation.ObjInfoPropOut;\
out = "Success";\
if (azimuth < 179)\
{\
if ((altitude < altLimit) && ( ! ccdsoftCamera.ImageUseDigitizedSkySurvey == "1" ))\
{\
out = "is below " + altLimit + " degrees. Currently: " + altitude + " degrees." ;\
}\
if (altitude < 0)\
{\
out = "is below the horizon: " + altitude + " degrees.";\
}\
} else {\
if (altitude < altLimit)\
{\
out = "has sunk too low.";\
}\
}\
}\
';
}
/* Socket End Packet */
