/* Java Script */
/* Socket Start Packet */

//	
//	Disconnect & reconnect imaging camera.
//
//	Ken Sturrock 
//	January 13, 2018
//

ccdsoftCamera.Disconnect();
sky6Web.Sleep (5000);	
ccdsoftCamera.Connect();


/* Socket End Packet */
