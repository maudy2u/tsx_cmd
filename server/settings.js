//import { TargetSessions } from '../imports/api/targetSessions.js';
//import { TargetReports } from '../imports/api/targetReports.js';
//import { TakeSeriesTemplates } from '../imports/api/takeSeriesTemplates.js';
//import { ImagingSessionLogs } from '../imports/api/imagingSessionLogs.js';
//import { Filters } from '../imports/api/filters.js';
import { TheSkyXInfos } from '../imports/api/theSkyXInfos.js';
//import { CalibrationFrames } from '../imports/api/calibrationFrames.js';
//import { FlatSeries } from '../imports/api/flatSeries.js';
//import { Seriess } from '../imports/api/seriess.js';

import {
  tsxInfo,
  tsxLog,
  tsxErr,
  tsxWarn,
  tsxDebug,
  logFileForClient,
  AppLogsDB
} from '../imports/api/theLoggers.js';

import {
  tsx_SetServerState,
  tsx_ServerStates,
  tsx_GetServerStateValue,
} from '../imports/api/serverStates.js';

/*
"noVNC_password": "",
"noVNC_port": "6080",
"noVNC_enabled": "true",
"indigo_url": "http://10.9.8.34:7624/ctrl.html",
*/

export function processBuildInfo() {
  var version_dat = {};
  version_dat = JSON.parse(Assets.getText('build_version.json'));
  if( version_dat.version != '') {
    tsx_SetServerState(tsx_ServerStates.tsx_version, version_dat.version);
    tsxLog('            Version', version_dat.version);
  }
  if( version_dat.date != '') {
    tsx_SetServerState(tsx_ServerStates.tsx_date, version_dat.date);
    tsxLog('               Date', version_dat.date);
  }
  if( version_dat.buid != '') {
    tsx_SetServerState(tsx_ServerStates.tsx_build, version_dat.build);
    tsxLog('              Build', version_dat.build);
  }
}

export function processTheSkyXnfo() {
  var dbIp = '';
  var dbPort = '';
  try {
    dbIp = TheSkyXInfos.findOne().ip() ;
  } catch( err ) {
    // do nothing
    tsx_SetServerState(tsx_ServerStates.ip, 'localhost');
    dbIp = 'localhost';
  }
  try {
    dbPort = TheSkyXInfos.findOne().port();
  } catch( err ) {
    // do nothing
    tsx_SetServerState(tsx_ServerStates.port, '3040');
    dbPort = '3040';
  }
  // removing so can start up easier without error.
  tsxLog('         TheSkyX IP',  dbIp );
  tsxLog('       TheSkyX port', dbPort );
}

export function processSettingsJSON() {

  // *******************************
  // is noVNC enabled for use
  if( typeof Meteor.settings.noVNC_enabled === 'undefined' || Meteor.settings.noVNC_password === '') {
    tsx_SetServerState(tsx_ServerStates.isNoVNCEnabled, false);
  }
  else if( Meteor.settings.noVNC_enabled === 'yes' )  {
    tsx_SetServerState(tsx_ServerStates.isNoVNCEnabled, true );
    tsxLog('      noVNC Enabled',  'true' );
  }
  else {
    tsx_SetServerState(tsx_ServerStates.isNoVNCEnabled, false );
  }

  // *******************************
  // is noVNC password set
  if( typeof Meteor.settings.noVNC_password !== 'undefined' && Meteor.settings.noVNC_password !== '') {
    tsx_SetServerState(tsx_ServerStates.noVNCPWD, Meteor.settings.noVNC_password );
  }
  else {
    tsx_SetServerState(tsx_ServerStates.noVNCPWD, '');
  }

  // *******************************
  // is noVNC port set
  if( typeof Meteor.settings.noVNC_port !== 'undefined' && Meteor.settings.noVNC_port !== '') {
    tsx_SetServerState(tsx_ServerStates.noVNCPort, Meteor.settings.noVNC_port );
    tsxLog('         noVNC Port',  Meteor.settings.noVNC_port );
  }
  else {
    tsx_SetServerState(tsx_ServerStates.noVNCPort, '6080');
  }

  // *******************************
  // is INDIGO Web Panel in use
  if( typeof Meteor.settings.indigo_url !== 'undefined' && Meteor.settings.indigo_url !== '') {
    tsx_SetServerState(tsx_ServerStates.indigo_web_panel, Meteor.settings.indigo_url);
    tsxLog('INDIGO WebPanel URL',  Meteor.settings.indigo_url );
  }
  else {
    tsx_SetServerState(tsx_ServerStates.indigo_web_panel, '' );
  }

}

export function processEnvVars() {

  var link = process.env.ROOT_URL;
  var p = process.env.PORT;
  try {
    // console.log(process.env);
    // console.log(link);
    tsx_SetServerState(tsx_ServerStates.tsx_ip, link.split('/')[2].split(':')[0]);
    tsx_SetServerState(tsx_ServerStates.tsx_port, p);
  }
  catch(e) {
    console.log(process.env);
    console.log(' *******************************');
    console.log( ' FAILED: Need to define ENV VAR ROOT_URL and PORT')
    console.log(' *******************************');
    exit(1);
  }

}

export function initServerStates() {

  // Make sure activeMenu is set for startup
  try {
    var chk = TheSkyXInfos.findOne({name: tsx_ServerStates.activeMenu}).value;
    if( typeof chk === 'undefined' || chk === '' ) {
      tsx_SetServerState(tsx_ServerStates.activeMenu, 'Settings');
    }
  }
  catch(e) {
    tsx_SetServerState(tsx_ServerStates.activeMenu, 'Settings');
  }

  tsx_SetServerState(tsx_ServerStates.mntMntDir, '');
  tsx_SetServerState(tsx_ServerStates.mntMntAlt, '');
  tsx_SetServerState(tsx_ServerStates.targetRA, '');
  tsx_SetServerState(tsx_ServerStates.targetDEC, '');
  tsx_SetServerState(tsx_ServerStates.targetALT, '');
  tsx_SetServerState(tsx_ServerStates.targetAZ, '');
  tsx_SetServerState(tsx_ServerStates.targetHA, '');
  tsx_SetServerState(tsx_ServerStates.targetTransit, '');
  tsx_SetServerState(tsx_ServerStates.lastTargetDirection, '');
  tsx_SetServerState(tsx_ServerStates.lastCheckMinSunAlt, '');
  // tsx_SetServerState( tsx_ServerStates.lastFocusPos', '');
  // tsx_SetServerState( tsx_ServerStates.lastFocusTemp', '');
  tsx_SetServerState(tsx_ServerStates.imagingSessionDither, 0);
  tsx_SetServerState(tsx_ServerStates.tool_active, false );
  tsx_SetServerState(tsx_ServerStates.currentSessionReport, '' );
  tsx_SetServerState(tsx_ServerStates.night_plan_reset, true );

  var maxPixel = tsx_GetServerStateValue( tsx_ServerStates.imagingPixelMaximum );
  if( maxPixel == '' || maxPixel ===0 ) {
    tsx_SetServerState(tsx_ServerStates.imagingPixelMaximum, 65504 );
  }
  maxPixel = tsx_GetServerStateValue( tsx_ServerStates.flatbox_imagingPixelMaximumOccurance );
  if( maxPixel == '' ) {
    tsx_SetServerState(tsx_ServerStates.flatbox_imagingPixelMaximumOccurance, 0 );
  }

  // prepare hardware... ensures all works for install
  var mount = TheSkyXInfos.findOne().mount();
  var camera = TheSkyXInfos.findOne().camera();
  var guider = TheSkyXInfos.findOne().guider();
  var rotator = TheSkyXInfos.findOne().rotator();
  var efw = TheSkyXInfos.findOne().efw();
  var focuser = TheSkyXInfos.findOne().focuser();

  // check the setting of the start/stop time initialization
  var startT, stopT;
  try {
    TheSkyXInfos.findOne({name: tsx_ServerStates.defaultUseImagingCooler_enabled}).value;
  }
  catch(e) {
    tsx_SetServerState(tsx_ServerStates.defaultUseImagingCooler_enabled, false);
  }
  try {
    minDefAlt = TheSkyXInfos.findOne({name: tsx_ServerStates.defaultMinAlt}).value;
  }
  catch(e) {
    tsx_SetServerState(tsx_ServerStates.defaultMinAltitude, '45');
  }
  try {
    startT = TheSkyXInfos.findOne({name: tsx_ServerStates.defaultStartTime}).value;
  }
  catch(e) {
    tsx_SetServerState(tsx_ServerStates.defaultStartTime, '21:00');
  }
  try {
    stopT = TheSkyXInfos.findOne({name: tsx_ServerStates.defaultStopTime}).value;
  }
  catch(e) {
    tsx_SetServerState(tsx_ServerStates.defaultStopTime, '5:00');
  }
  try {
    TheSkyXInfos.findOne({name: tsx_ServerStates.defaultFocusExposure}).value;
  }
  catch(e) {
    tsx_SetServerState(tsx_ServerStates.defaultFocusExposure, '1');
  }

  for (var m in tsx_ServerStates){
    var state = tsx_ServerStates[m];
    try {
      var isDefined = TheSkyXInfos.findOne({name: state });
      // force a throw??
      tsxInfo(state, isDefined.value);

    } catch (e) {
      tsxWarn('Initialized: ', state);
      tsx_SetServerState(state, '');
    } finally {
    }
  }
}
