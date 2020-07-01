/* Java Script */
/* Socket Start Packet */
// Stephen Townsend
// 2018-04-19

var Out = 'Success';
var ccdTemp = $000;
var delta = 0.3;

var Out="done";
var CCDSC = ccdsoftCamera;

CCDSC.Asynchronous = true;		// We are going to wait for it
while (!CCDSC.State == 0){ 	sky6Web.Sleep (1000); }

CCDSC.RegulateTemperature=0; // turnit off.
/* Socket End Packet */
