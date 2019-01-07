/* Java Script */
/* Socket Start Packet */

//  Stephen Townsend
//  2018-04-21

var report = [];
var cameraReport;
var ccd;
while (!ccdsoftCamera.State == 0) {
sky6Web.Sleep (1000);
}
ccd = ccdsoftCamera.Connect();
if( SelectedHardware.cameraModel == '<No Camera Selected>') {
cameraReport = { isValid: false, };
} else {
cameraReport = {
isValid: true,
imageReduction: ccd.ImageReduction,
subFrame: ccd.Subframe,
frame: ccd.Frame,
delay: ccd.Delay,
autoSave: ccd.AutoSaveOn,
exposureTime: ccd.ExposureTime,
async: ccd.Asynchronous,
binX: ccd.BinX,
binY: ccd. BinX,
simulating: ccd.ImageUseDigitizedSkySurvey,
lastImageFileName: ccd.LastImageFileName,
manufacturer: SelectedHardware.cameraManufacturer,
model: SelectedHardware.cameraModel,
};
}

var rotatorReport;
if( SelectedHardware.rotatorModel == '<No Rotator Selected>') {
rotatorReport = { isValid: false, };
} else {
if( !ccdsoftCamera.rotatorIsConnected() ) {
ccdsoftCamera.rotatorConnect(); // Probably redundant.
};
rotatorReport = {
isValid: true,
manufacturer: SelectedHardware.rotatorManufacturer,
model: SelectedHardware.rotatorModel,
rotPosition: ccd.rotatorPosition,
};
}
var focReport;
if( SelectedHardware.focuserModel == '<No Focuser Selected>') {
focReport = { isValid: false, };
} else {
if( !ccdsoftCamera.focIsConnected ) {
ccdsoftCamera.focConnect();
};
focReport = {
isValid: true,
focPosition: ccd.focPosition,
focTemperature: ccd.focTemperature,
manufacturer: SelectedHardware.focuserManufacturer,
model: SelectedHardware.focuserModel,
};
}
var efwReport;
if( SelectedHardware.filterWheelModel == '<No Filter Wheel Selected>') {
efwReport = { isValid: false, };
} else {
if( !ccdsoftCamera.filterWheelIsConnected) {
ccdsoftCamera.filterWheelConnect();
};
var filters = [];
var eMod = SelectedHardware.filterWheelModel;
var numFilters = ccd.lNumberFilters;
if( eMod == "Filter Wheel Simulator" ) {
numFilters = 7;
}
for (var i = 0; i < numFilters; i++) {
filters.push( {name: ccdsoftCamera.szFilterName(i), slot: i} );
}
efwReport = {
isValid: true,
manufacturer: SelectedHardware.filterWheelManufacturer,
model: eMod,
currentSlot: ccdsoftCamera.FilterIndexZeroBased,
filters: filters,
};
}
var agCCD;
var autoGuideReport;
if( SelectedHardware.autoguiderCameraModel == '<No Camera Selected>') {
autoGuideReport = { isValid: false, };
} else {
agCCD = ccdsoftAutoguider.Connect();
sky6Web.Sleep (5000);
autoGuideReport = {
isValid: true,
manufacturer: SelectedHardware.autoguiderCameraManufacturer,
model: SelectedHardware.autoguiderCameraModel,
imageReduction: agCCD.ImageReduction,
subFrame: agCCD.Subframe,
frame: agCCD.Frame,
delay: agCCD.Delay,
autoSave: agCCD.AutoSaveOn,
exposure: agCCD.ExposureTime,
autoguiderExposureTime: agCCD.AutoguiderExposureTime,
async: agCCD.Asynchronous,
binX: agCCD.BinX,
binY: agCCD. BinX,
simulating: agCCD.ImageUseDigitizedSkySurvey,
lastImageFileName: agCCD.LastImageFileName,
};
}

var mountReport;
if( SelectedHardware.mountModel == '<No Mount Selected>') {
  mountReport = { isValid: false, };
} else {
if( !sky6RASCOMTele.IsConnected) {
sky6RASCOMTele.Connect();
};
sky6RASCOMTele.GetAzAlt();
mntAz = sky6RASCOMTele.dAz;
mntAlt = sky6RASCOMTele.dAlt;
if (mntAz < 179) {
mntAz = "East";
} else {
mntAz = "West";
}
sky6RASCOMTele.GetRaDec();
var mntRa = sky6RASCOMTele.dRa;
var mntDec = sky6RASCOMTele.dDec;
sky6Utils.PrecessNowTo2000( mntRa, mntDec );
sky6Utils.ConvertEquatorialToString(sky6Utils.dOut0, sky6Utils.dOut1, 5);
var CoordsHMS2000 = sky6Utils.strOut;
mountReport = {
isValid: false,
manufacturer: SelectedHardware.mountManufacturer,
model: SelectedHardware.mountModel,
RA: mntRa,
DEC: mntDec,
ALT: mntAlt,
AZ: mntAz,
HMS2000: CoordsHMS2000,};
}
report = {
  mountReport: mountReport,
  cameraReport: cameraReport,
  rotatorReport: rotatorReport,
  focReport: focReport,
  autoGuideReport: autoGuideReport,
  efwReport: efwReport,
};
report
/* Socket End Packet */
