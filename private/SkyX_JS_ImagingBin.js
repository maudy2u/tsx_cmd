/* Java Script */
/* Socket Start Packet */
// Stephen Townsend
// 2018-04-19

var Out = 'Success';
var ccdBin = $001;

var CCDSC = ccdsoftCamera;

CCDSC.Asynchronous = true;		// We are going to wait for it
while (!CCDSC.State == 0)
//
// Diagnostic routine to make sure the camera is *really* ready
//
{
	sky6Web.Sleep (1000);
}
CCDSC.BinX = ccdBin; // use AILS bin
CCDSC.BinY = ccdBin; // use AILS bin

Out;
/* Socket End Packet */
