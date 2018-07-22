/* Java Script */
/* Socket Start Packet */

//	
//	Turn on the sidereal tracking motor after a cloud pause.
//
//	Ken Sturrock 
//	January 13, 2018
//


if ( SelectedHardware.mountModel !== "Telescope Mount Simulator")
//
// See if we are running the simulator, if we are not using the simulator
// then set the tracking speed below.
//
{
	sky6RASCOMTele.SetTracking(1, 1, 0 ,0); 
}

/* Socket End Packet */
