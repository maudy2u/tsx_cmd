/* Java Script */
/* Socket Start Packet */

//
//	Turn off the sidereal tracking motor.
//
//	This script was written for Ginge who wanted a way to "pause" the system in case of clouds
//	rather than shut the whole system down with camera disconnects and a mount park.
//
//	Ken Sturrock
//	January 13, 2018
//

Out = "";

if ( SelectedHardware.mountModel !== "Telescope Mount Simulator")
//
// See if we are running the simulator, if we are not using the simulator
// then set the tracking speed below.
//
{
	sky6RASCOMTele.SetTracking(0, 1, 0 ,0);
}
Out = "Success|";
Out;

/* Socket End Packet */
