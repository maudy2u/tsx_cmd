/*
tsx cmd - A web page to send commands to TheSkyX server
    Copyright (C) 2018  Stephen Townsend

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Meteor } from 'meteor/meteor';

import { TargetSessions } from '../imports/api/targetSessions.js';
import { TakeSeriesTemplates } from '../imports/api/takeSeriesTemplates.js';
import { Seriess } from '../imports/api/seriess.js';
import { Filters } from '../imports/api/filters.js';
import { TheSkyXInfos } from '../imports/api/theSkyXInfos.js';
import { scheduler } from '../imports/api/theProcessors.js';
import { FlatSeries } from '../imports/api/flatSeries.js';
import { TargetAngles } from '../imports/api/targetAngles.js';
import { CalibrationFrames } from '../imports/api/calibrationFrames.js';

import { tsxInfo, tsxLog, tsxErr, tsxWarn, tsxDebug,
  logFileForClient, AppLogsDB
} from '../imports/api/theLoggers.js';

import {
  backupFolder,
} from '../imports/api/backups.js';

import {
  skySafariFilesFolder,
} from '../imports/api/skySafariFiles.js';

import {
  tsx_ServerStates,
  tsx_SetServerState,
  tsx_GetServerState,
  tsx_UpdateDevice,
  tsx_GetServerStateValue,
  UpdateStatus,
  UpdateStatusErr,
  postProgressTotal,
  postProgressIncrement,
  postProgressMessage,
  UpdateImagingSesionID,
} from '../imports/api/serverStates.js';

import {
  tsx_Connect,
  tsx_Disconnect,
  tsx_MntPark,
  tsx_AbortGuider,
  prepareTargetForImaging,
  processTargetTakeSeries,
  tsx_ServerIsOnline,
  tsx_isDark,
  isTimeBeforeCurrentTime,
  hasStartTimePassed,
  tsx_MntUnpark,
  tsx_IsParked,
  findCalibrationSession,
  CalibrateAutoGuider,
  tsx_RotateCamera,
  UpdateImagingTargetReport,
  tsx_SlewTargetName,
  tsx_SlewCmdCoords,
  tsx_StopTracking,
  isSchedulerStopped,
} from './run_imageSession.js';

import {
  runSchedulerProcess,
  getSchedulerState,
  setSchedulerState,
  srvStopScheduler,
} from './run_schedule_process.js'

/*
tsx_SetServerState
currentStage: 'currentStage', // this is a status line update for the dashboard
initialFocusTemperature: 'initialFocusTemperature',
mntRA: 'mntRA',
mntDEC: 'mntDEC',
mntMHS: 'mntMHS',
mntMntDir: 'mntMntDir',
mntMntAlt: 'mntMntAlt',
targetRA: 'targetRA',
targetDEC: 'targetDEC',
targetATL: 'targetATL',
targetAZ: 'targetAZ',

currentTargetSession: 'currentTargetSession', // use to report current imaging targets
isCurrentlyImaging: 'isCurrentlyImaging',
*/

function initServerStates() {
  tsx_SetServerState(tsx_ServerStates.activeMenu, 'Settings');
//  tsx_SetServerState(tsx_ServerStates.tsx_total, 1);
//  tsx_SetServerState(tsx_ServerStates.tsx_progress, 0);
//  tsx_SetServerState(tsx_ServerStates.targetName, '');

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
    var chk = TheSkyXInfos.findOne({name: tsx_ServerStates.isNoVNCEnabled}).value;
    if( chk === '' ) {
      tsx_SetServerState(tsx_ServerStates.isNoVNCEnabled, false);
    }
  }
  catch(e) {
    tsx_SetServerState(tsx_ServerStates.isNoVNCEnabled, false);
  }
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

Meteor.startup(() => {
  tsxLog(' ******************************', '');
  tsxLog(' ****** TSX_CMD STARTING', '');

  var link = process.env.ROOT_URL;
  var p = process.env.PORT;
  try {
    console.log(process.env);
    console.log(link);
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

  AppLogsDB.remove({});
  srvStopScheduler();

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
  tsxLog('        Browser URL',
    'http://'
    + tsx_GetServerStateValue(tsx_ServerStates.tsx_ip)
    + ':'
    + tsx_GetServerStateValue(tsx_ServerStates.tsx_port)
    + '/'
  );

  initServerStates();

  // Initialze the server on startup
/*  tsx_UpdateDevice('mount', 'Not connected ', '' );
  tsx_UpdateDevice('camera', 'Not connected ', '' );
  tsx_UpdateDevice('guider', 'Not connected ', '' );
  tsx_UpdateDevice('rotator', 'Not connected ', '' );
  tsx_UpdateDevice('efw', 'Not connected ', '' );
  tsx_UpdateDevice('focuser', 'Not connected ', '' );
*/
  tsxLog( '            Logfile', logFileForClient() );
  tsxLog( '   DB Backup Folder', backupFolder );
  tsxLog( ' SkySafari Settings', skySafariFilesFolder );


  UpdateStatus(' ******* TSX_CMD ONLINE' );
  tsxLog(' ******************************', '');
  tsxLog(' ******************************', '');

  return;

});


// *******************************
// *******************************
// *******************************
// *******************************
Meteor.methods({

  slewPosition( slew, location, dec_az, stopTracking ) {
    tsx_SetServerState( tsx_ServerStates.tool_active, true );
    tsxInfo( '  slew'+slew);
    tsxInfo( '  location'+location);
    tsxInfo( '  dec_az'+dec_az);
    var res = '';
    try {
      if( slew != '' ) {
        UpdateStatus('Slewing');
        if( slew == 'Alt/Az'&& location !='' && dec_az != '') {
          res = tsx_SlewCmdCoords( 'SkyX_JS_SlewAltAz', location, dec_az );
        }
        else if( slew == 'Ra/Dec' && location !='' && dec_az != '') {
          res =tsx_SlewCmdCoords( 'SkyX_JS_SlewRaDec', location, dec_az );
        }
        else if( slew == 'Target name' && location !='') {
          res = tsx_SlewTargetName( location  );

        }
      }
      UpdateStatus(' Slew: ' + res );
    }
    catch( e ) {
      UpdateStatus('Slewing failed');
      res = 'Failed slewing';
      if( e == 'TsxError' ) {
        UpdateStatus('!!! TheSkyX connection is no longer there!');
      }
    }
    finally {
      tsx_SetServerState( tsx_ServerStates.tool_active, false );
      if( stopTracking ) {
        UpdateStatus('Stopping tracking');

        tsx_SetServerState( tsx_ServerStates.tool_active, true );
        let res = '';
        try {
          res = tsx_StopTracking();
          UpdateStatus('Stopped tracking');
        }
        catch (e) {
          UpdateStatus('Stop tracking failed');
          res = 'Stop tracking failed';
          if( e == 'TsxError' ) {
            UpdateStatus('!!! TheSkyX connection is no longer there!');
          }
        }
        finally {
          tsx_SetServerState( tsx_ServerStates.tool_active, false );
        }
        return res;
      }
    }
    return res;
  },

  rotateCamera( cls ) {
    tsx_SetServerState( tsx_ServerStates.tool_active, true );
    try {
      let num = '';
      tsxLog(' Rotating Camera');
      if( cls == 1 ) {
        num  = tsx_GetServerStateValue( tsx_ServerStates.tool_rotator_num );
      }
      else {
        num  = tsx_GetServerStateValue( tsx_ServerStates.tool_rotator_fov );
      }
      var res = tsx_RotateCamera( num, cls ); // tool needs to use CLS use 0
    }
    catch( e ) {
      if( e == 'TsxError' ) {
        UpdateStatus('!!! TheSkyX connection is no longer there!');
      }
    }
    finally {
      tsx_SetServerState( tsx_ServerStates.tool_active, false );
    }
  },

   getUpdateTargetReport(tid) {
     var target = TargetSessions.findOne({_id: tid});

     var rpt = '';
     try {
       tsxLog( ' TargetReport: ' + target.getFriendlyName() );
       rpt = UpdateImagingTargetReport( target )
     }
     catch( e ) {
       if( e == 'TsxError' ) {
         UpdateStatus('!!! TheSkyX connection is no longer there!');
       }
       rpt = {
         ready: false,
       }
     }
     return rpt;
   },

   updateServerState( name, value ) {
     if( typeof name !== 'undefined' && name !== '' ) {
       tsx_SetServerState( name, value );
     }
     tsxInfo(' [Saved] ' +name+':'+value);
   },

   updateTargetState( id, name, value ) {

     var dts = new Date();
    TargetSessions.update( id, {
       $set: {
         [name]: value,
         timestamp: dts,
       },
    });

     console.log(' [Saved] '+ name + '='+ value);
   },

   updateTargetSeriesState( id, sid ) {
     var ser = TakeSeriesTemplates.findOne({_id: sid});
     var dts = new Date();

     TargetSessions.update( id, {
       $set: {
         series: {
             _id: sid,
             name: ser.name,
         },
         timestamp: dts,
       },
    });

     tsxDebug(' [Saved] target assigned:' + ser.name);
   },

   updateSeriesIdWith(
       id,
       name,
       value
      ) {

     tsxInfo(' ******************************* ');
     tsxInfo(' updateSeriesIdWith: ' + id + ', ' + name + ", " + value);
     if( name == 'order ') {
       tsxInfo('1');
       var res = Seriess.update( {_id: id }, {
         $set:{
           order: value,
         }
       });
     }
     else if (name == 'exposure' ) {
       tsxInfo('2');
       var res = Seriess.update( {_id: id }, {
         $set:{
           exposure: value,
         }
       });
     }
     else if (name == 'frame') {
       tsxInfo('3');
       var res = Seriess.update( {_id: id }, {
         $set:{
           frame: value,
         }
       });
     }
     else if (name=='filter') {
       tsxInfo('4');
       var res = Seriess.update( {_id: id }, {
         $set:{
           filter: value,
         }
       });
     }
     else if (name=='repeat') {
       tsxInfo('5');
       var res = Seriess.update( {_id: id }, {
         $set:{
           repeat: value,
         }
       });
     }
     else if (name=='binning') {
       tsxInfo('6');
       var res = Seriess.update( {_id: id }, {
         $set:{
           binning: value,
         }
       });
     }
   },

 });
