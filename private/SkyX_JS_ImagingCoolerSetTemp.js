/* Java Script */
/* Socket Start Packet */
// Stephen Townsend
// 2018-04-19

var Out = 'Success';
var ccdTemp = $000;
var delta = 0.3;

var CCDSC = ccdsoftCamera;

CCDSC.Asynchronous = false;		// We are going to wait for it

function isTemperatureClose( ccdTemp ) {

		var t = CCDSC.Temperature;
		var diff = Math.abs(ccdTemp-t);
		if( diff <= delta ) {
			return true;
		}
		else {
			return false;
		}
}

while (!CCDSC.State == 0){ 	sky6Web.Sleep (1000); }
var t = CCDSC.TemperatureSetPoint;
if( !isTemperatureClose( ccdTemp ) || !CCDSC.RegulateTemperature ) {
//	CCDSC.RegulateTemperature=0; // toggle to change set point
	CCDSC.TemperatureSetPoint=ccdTemp;
	CCDSC.RegulateTemperature=1;
}

Out + '|' + CCDSC.Temperature + '|' + CCDSC.RegulateTemperature;
/* Socket End Packet */
