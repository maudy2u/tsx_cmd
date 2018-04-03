/* Java Script */
/* Socket Start Packet */

//	
//	This script will return the assigned name for a filter slot
//
//	Ken Sturrock 
//	January 13, 2018
//


// Sometime around build 9050, the code that reads the filter name also destroyed the @Focus2
// focusing model. If you are running 9050, 9051 or something around that then update to build 9127
// or higher.
//


if ( SelectedHardware.filterWheelModel !== "<No Filter Wheel Selected>" )
//
// This test looks to see if there is a filter wheel. If not, return "NA".
// Otherwise, give us the filter name for the main script's pretty printing.
//
{
	ccdsoftCamera.szFilterName($000);	
} else {
	out = "No Filter";	 
}




/* Socket End Packet */
