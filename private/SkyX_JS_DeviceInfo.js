/* Java Script */
/* Socket Start Packet */
// Stephen Townsend
// 2018-04-19

var Out = '';
var filters = '';
var bins = '';

Out =
"aMan|" + SelectedHardware.autoguiderCameraManufacturer +
"|aMod|" + SelectedHardware.autoguiderCameraModel +
"|cMan|" + SelectedHardware.cameraManufacturer +
"|cMod|" + SelectedHardware.cameraModel +
"|efwMan|" + SelectedHardware.filterWheelManufacturer +
"|efwMod|" + SelectedHardware.filterWheelModel +
"|focMan|" + SelectedHardware.focuserManufacturer +
"|focMod|" + SelectedHardware.focuserModel +
"|mntMan|" + SelectedHardware.mountManufacturer +
"|mntMod|" + SelectedHardware.mountModel +
"|rotMan|" + SelectedHardware.rotatorManufacturer +
"|rotMod|" + SelectedHardware.rotatorModel;

var ccd = ccdsoftCamera;
ccd.Connect();
while (!ccd.State == 0) { sky6Web.Sleep (1000); }

var numBins = ccd.lNumberBins;
var bins = "|numBins|" + numBins;
Out = Out + bins;

var efwm = SelectedHardware.filterWheelModel;
var numFilters = ccd.lNumberFilters;
if( efwm == "Filter Wheel Simulator" ) {
  numFilters = 7;
}

var filters = "|numFilters|" + numFilters;
for (var i = 0; i < numFilters; i++) {
  var filterName = ccd.szFilterName(i);
  filters = filters + "|" + filterName;
}

Out = Out + filters;

/* Socket End Packet */
