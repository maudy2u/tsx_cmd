/* Java Script */
/* Socket Start Packet */

// Get the skychart center and use to set target

//
// Define variables and set known initial values
//
var CoordsHMS2000 = "";
var rpt ='';
var chartRa = 0;
var chartDec = 0;
var CHART = sky6StarChart;

chartRa = CHART.RightAscension;		// Put the value into the Ra value
chartDec = CHART.Declination;		// Do same for Dec
// RunJavaScriptOutput.writeLine ( chartRa );

//sky6Utils.PrecessNowTo2000( chartRa, chartDec );
//sky6Utils.ConvertEquatorialToString(sky6Utils.dOut0, sky6Utils.dOut1, 5);
sky6Utils.ConvertEquatorialToString(chartRa, chartDec, 5);

CoordsHMS2000 = sky6Utils.strOut;
var ra2000 = CoordsHMS2000.split('Dec:')[0].trim(); // RA: 20h 17m 38.1s
var dec2000 = CoordsHMS2000.split('Dec:')[1].trim(); // Dec: +40° 03' 54.2"

// Form the output string
// need: 20h 17m 38.1s , +40d 03m 54.2s
ra2000 = ra2000.split('RA:')[1].trim();
dec2000 = dec2000.replace(/°/g, 'd');
dec2000 = dec2000.replace(/'/g, 'm');
dec2000 = dec2000.replace(/"/g, 's');

// e.g. sexigesimal=20h 16m 56.1s,+40d 00m 26.6s|RA=20.293916666666668|DEC=40.06505555555555|ra200=20h 16m 56.1s|dec2000=+40d 00m 26.6s
rpt = 'sexi2000='+ra2000+','+dec2000+'|RA='+chartRa +'|DEC='+chartDec+'|ra200='+ra2000+'|dec2000='+dec2000

/* Socket End Packet */
