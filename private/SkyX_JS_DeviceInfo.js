/* Java Script */
/* Socket Start Packet */
// Stephen Townsend
// 2018-04-19

var Out = '';
var filters = '';
var bins = '';
var dev = [];

if( SelectedHardware.mountModel != '<No Mount Selected>' ) {
  dev.push(
    "mntMan=" + SelectedHardware.mountManufacturer +
    "|mntMod=" + SelectedHardware.mountModel
  );
}

if( SelectedHardware.autoguiderCameraModel != '<No Camera Selected>' ) {
  var ccd = ccdsoftAutoguider;
  ccd.Connect();
  while (!ccd.State == 0) {
    sky6Web.Sleep (1000);
  }
  dev.push(
    "aMan=" + SelectedHardware.autoguiderCameraManufacturer +
    "|aMod=" + SelectedHardware.autoguiderCameraModel
  );
}

if( SelectedHardware.cameraModel != '<No Camera Selected>' ) {
  dev.push(
    "cMan=" + SelectedHardware.cameraManufacturer +
    "|cMod=" + SelectedHardware.cameraModel
  );
}

if( SelectedHardware.filterWheelModel != '<No FilterWheel Selected>' ) {
  dev.push(
    "efwMan=" + SelectedHardware.filterWheelManufacturer +
    "|efwMod=" + SelectedHardware.filterWheelModel
  );
}

if( SelectedHardware.focuserModel != '<No FilterWheel Selected>' ) {
  dev.push(
    "focMan=" + SelectedHardware.focuserManufacturer +
    "|focMod=" + SelectedHardware.focuserModel
  );
}

if( SelectedHardware.rotatorModel != '<No FilterWheel Selected>' ) {
  dev.push(
    "rotMan=" + SelectedHardware.rotatorManufacturer +
    "|rotMod=" + SelectedHardware.rotatorModel
  );
}

if( SelectedHardware.cameraModel != '<No Camera Selected>' ) {
  var ccd = ccdsoftCamera;
  ccd.Connect();
  while (!ccd.State == 0) {
    sky6Web.Sleep (1000);
  }

  var numBins = ccd.lNumberBins;
  var bins = "numBins=" + numBins;
  dev.push(bins);
}


var efwm = SelectedHardware.filterWheelModel;
if( efwm != '<No Filter Wheel Selected>') {
  var ccd = ccdsoftCamera;
  var filters='';
  try {
    var numFilters = ccd.lNumberFilters;
    if( efwm == "Filter Wheel Simulator" ) {
      numFilters = 7;
    }
    filters = "numFilters=" + numFilters;

	  for (var i = 0; i < numFilters; i++) {
  		  var filterName = ccd.szFilterName(i);
   		 filters = filters + "|slot_" +i+"=" + filterName;
  		}
	}
	catch(err){
   		 filters = "numFilters=" + err;
  }
  dev.push(filters);
}


if( SelectedHardware.autoguiderCameraModel != '<No Guider Selected>' ) {
  var ccd = ccdsoftAutoguider;
  ccd.Connect();
  while (!ccd.State == 0) {
    sky6Web.Sleep (1000);
  }

  var numBins = ccd.lNumberBins;
  var bins = "numGuiderBins=" + numBins;
  dev.push(bins);
}


Out = "Success";
for( var i=0; i<dev.length;i++) {
  Out = Out +'|'+dev[i];
}

Out;

/* Socket End Packet */
