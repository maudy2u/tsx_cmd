/* Java Script */
/* Socket Start Packet */

//
//	Stop the auto-guider.
//
//	Ken Sturrock 	
//	January 13, 2018
//


while (ccdsoftAutoguider.ExposureStatus == "DSS From Web")
{
	sky6Web.Sleep (500);	// Waste time if we are waiting for a DSS download
				// so it doesn't throw an Error 206.
				// Sometimes, it still does....
}

ccdsoftAutoguider.Abort();
			

while (!ccdsoftAutoguider.State == 0)
//
// Diagnostic routine to make sure the camera is *really* done
//
{
	sky6Web.Sleep (500);
}

ccdsoftAutoguider.Subframe = false;

/* Socket End Packet */


