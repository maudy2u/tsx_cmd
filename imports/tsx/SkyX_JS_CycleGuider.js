/* Java Script */
/* Socket Start Packet */

//	
//	Disconnect & reconnect guider
//
//	Ken Sturrock 
//	January 13, 2018
//

ccdsoftAutoguider.Disconnect();
sky6Web.Sleep (5000);	
ccdsoftAutoguider.Connect();


/* Socket End Packet */
