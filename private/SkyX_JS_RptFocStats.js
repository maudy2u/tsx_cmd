/* Java Script */
/* Socket Start Packet */

//
//	Report back Focuser position and temperature immediately after @Focus2
// 	run. This is useful for performance monitoring and temperature slope
//	calculations.	
//
//	Ken Sturrock 
//	January 13, 2018
//

var focTemp = ccdsoftCamera.focTemperature;
var focPos = ccdsoftCamera.focPosition;

sky6ObjectInformation.Property(0);
var targName = sky6ObjectInformation.ObjInfoPropOut

out = "(Pos: " +  focPos + ", Temp: " + focTemp + ", Place: " + targName + ")";

/* Socket End Packet */

