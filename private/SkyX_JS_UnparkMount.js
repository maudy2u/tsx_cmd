/* Java Script */
/* Socket Start Packet */

// Force a connection to the mount to unpark
var out = '';
try
{
	sky6RASCOMTele.Connect();
	while( sky6RASCOMTele.IsParked() ) {
		sky6Web.Sleep(1000);
	}

	out = 'unparked';
}
catch (repErr) {
	out += "Mount: " + refErr + cr;
}
out
/* Socket End Packet */
