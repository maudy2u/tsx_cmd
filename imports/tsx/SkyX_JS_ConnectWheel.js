/* Java Script */
/* Socket Start Packet */

// The only pupose of this is to make sure that the filter wheel (and camera)
// are connected at the beginning of a run so that the human-friendly filter
// names are displayed. The main time this is a problem is if multiple script
// runs are conducted with a semi-colon.
//
// Ken Sturrock
// January 13, 2018
//

if ( SelectedHardware.filterWheelModel !== "<No Filter Wheel Selected>" )
{
	ccdsoftCamera.Connect();
	ccdsoftCamera.filterWheelConnect();		// Probably redundant.
}
/* Socket End Packet */
