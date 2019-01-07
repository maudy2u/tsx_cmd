/* Java Script */
/* Socket Start Packet */
var out = true;
if( SelectedHardware.mountModel !== "Telescope Mount Simulator" ) {
	try {
		out = sky6RASCOMTele.isParked();
	}
	catch(e) {
		sky6RASCOMTele.SetTracking(0, 1, 0 ,0);
		out = true;
	}
}
out
/* Socket End Packet */
