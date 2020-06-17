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
  tsx_GetServerStateValue,
  UpdateStatus,
  UpdateStatusErr,
  tsx_UpdateDevice,
  tsx_UpdateDeviceManufacturer,
  tsx_UpdateDeviceModel,
} from '../imports/api/serverStates.js';

import {
  tsx_Connect,
  tsx_Disconnect,
  tsx_AbortGuider,
  processTargetTakeSeries,
  tsx_isDark,
  isTimeBeforeCurrentTime,
  hasStartTimePassed,
  findCalibrationSession,
  CalibrateAutoGuider,
  tsx_RotateCamera,
  tsx_SlewTargetName,
  tsx_SlewCmdCoords,
  tsx_StopTracking,
} from './run_imageSession.js';

import {
  srvStopScheduler,
  isSchedulerStopped,
} from './run_schedule_process.js'

import {
  tsx_feeder,
  tsxHeader,
  tsxFooter,
  tsx_cmd,
  tsx_has_error,
  tsx_ServerIsOnline,
} from './tsx_feeder.js'

import {
  initServerStates,
  processEnvVars,
  processBuildInfo,
  processTheSkyXnfo,
  processSettingsJSON,
} from './settings.js'

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


Meteor.startup(() => {
  tsxLog(' ##############################', '');
  tsxLog(' ****** TSX_CMD STARTING', '');
  tsxLog('  ', '');

  AppLogsDB.remove({});
  tsx_SetServerState(tsx_ServerStates.runScheduler, '');

  srvStopScheduler();
  // Initialze the server on startup
  processEnvVars();
  initServerStates();

  processBuildInfo();
  tsxLog(' ', '');
  processTheSkyXnfo();
  processSettingsJSON();

  tsxLog(' ', '');
  tsxLog( '            Logfile', logFileForClient() );
  tsxLog( '    DB Backup Files', backupFolder );
  tsxLog( '    SkySafari Files', skySafariFilesFolder );

  tsxLog(' ', '');
  tsxLog('        Browser URL',
    'http://'
    + tsx_GetServerStateValue(tsx_ServerStates.tsx_ip)
    + ':'
    + tsx_GetServerStateValue(tsx_ServerStates.tsx_port)
    + '/'
  );
  tsxLog(' ', '');
  UpdateStatus(' ******* TSX_CMD ONLINE' );
  tsxLog(' ##############################', '');
  tsxLog(' ', '');

  return;

});

// **************************************************************
function tsx_DeviceInfo() {
  // tsxInfo('************************');
  tsxInfo(' *** tsx_DeviceInfo' );

  // tsx_Connect();
  var cmd = tsx_cmd('SkyX_JS_DeviceInfo');
  // cmd = cmd.replace('$000', Number(filterNum) ); // set filter
  // cmd = cmd.replace('$001', Number(exposure) ); // set exposure

  var success;
  var tsx_is_waiting = true;
  var numFilters = -1;
  var numBins = -1;
  var numGuiderBins = -1;

  var notFoundGuider = true;
  var notFoundMount = true;
  var notFoundCamera = true;
  var notFoundEFW = true;
  var notFoundRotator = true;
  var notFoundFocuser = true;

  tsxDebug( '[TSX] SkyX_JS_DeviceInfo' );

  tsx_feeder( String(cmd), Meteor.bindEnvironment((tsx_return) => {
    // e.g.
    // Success|RMS_ERROR=0.00|ROTATOR_POS_ANGLE=-350|ANGLE=349.468|FOCUS_POS=0.000
    tsxDebug(' SkyX_JS_DeviceInfo return: ' + tsx_return );
    if( tsx_has_error(tsx_return) == false ) {
      var results = tsx_return.split('|');
      if( results.length > 0) {
        var result = results[0].trim();
        if( result == 'Success' ) {
          success = true;
          for( var i=1; i<results.length;i++) {
            var token=results[i].trim();
            //
            var param=token.split("=");
            switch( param[0] ) {

              case 'aMan':
                tsx_UpdateDeviceManufacturer( 'guider', param[1] );
                notFoundMount = false;
                break;

              case 'aMod':
                tsx_UpdateDeviceModel( 'guider', param[1] );
                break;

              case 'cMan':
                tsx_UpdateDeviceManufacturer( 'camera', param[1] );
                notFoundCamera = false;
                break;

              case 'cMod':
                tsx_UpdateDeviceModel( 'camera', param[1] );
                UpdateStatus( ' [SETTINGS] Updated Camera Model');
                break;

              case 'efwMan':
                tsx_UpdateDeviceManufacturer( 'efw', param[1] );
                notFoundEFW = false;
                break;

              case 'efwMod':
                tsx_UpdateDeviceModel( 'efw', param[1] );
                UpdateStatus( ' [SETTINGS] Updated EFW Model');
                break;

              case 'focMan':
                tsx_UpdateDeviceManufacturer( 'focuser', param[1] );
                notFoundFocuser = false;
                break;

              case 'focMod':
                tsx_UpdateDeviceModel( 'focuser', param[1] );
                UpdateStatus( ' [SETTINGS] Updated Focuser Model');
                break;

              case 'mntMan':
                tsx_UpdateDeviceManufacturer( 'mount', param[1] );
                notFoundMount = false;
                break;

              case 'mntMod':
                tsx_UpdateDeviceModel( 'mount', param[1] );
                UpdateStatus( ' [SETTINGS] Updated Mount Model');
                break;

              case 'rotMan':
                tsx_UpdateDeviceManufacturer( 'rotator', param[1] );
                notFoundRotator = false;
                break;

              case 'rotMod':
                tsx_UpdateDeviceModel( 'rotator', param[1] );
                UpdateStatus( ' [SETTINGS] Updated Rotator Model');
                break;

              case 'numBins':
                numBins = param[1];
                tsx_SetServerState( 'numberOfBins', numBins );
                UpdateStatus( ' [SETTINGS] Updated Imager binings');
                break;

              case 'numFilters':
                numFilters = param[1];
                tsx_SetServerState( 'numberOfFilters', numFilters );
                UpdateStatus( ' [SETTINGS] Updated number of filters');
                break;

              case 'numGuiderBins':
                numGuiderBins = param[1];
                tsx_SetServerState( 'numGuiderBins', numGuiderBins );
                UpdateStatus( ' [SETTINGS] Updated Guider binnings');
                break;

              default:
                //RunJavaScriptOutput.writeLine(param[0]+' not found.');
            }
          }
          if(notFoundEFW) {
            tsx_SetServerState( 'numberOfFilters', 0 );
            tsx_UpdateDeviceManufacturer( 'efw', 'Not Found' );
            tsx_UpdateDeviceModel( 'efw', 'NotFound' );
            UpdateStatus( ' [SETTINGS] EFW Not Found');
          }
          if(notFoundMount) {
            tsx_UpdateDeviceManufacturer( 'mount', 'Not Found' );
            tsx_UpdateDeviceModel( 'mount', 'NotFound' );
            UpdateStatus( ' [SETTINGS] mount Not Found');
          }
          if(notFoundRotator) {
            tsx_UpdateDeviceManufacturer( 'rotator', 'Not Found' );
            tsx_UpdateDeviceModel( 'rotator', 'NotFound' );
            UpdateStatus( ' [SETTINGS] rotator Not Found');
          }
          if(notFoundFocuser) {
            tsx_UpdateDeviceManufacturer( 'focuser', 'Not Found' );
            tsx_UpdateDeviceModel( 'focuser', 'NotFound' );
            UpdateStatus( ' [SETTINGS] focuser Not Found');
          }
          if(notFoundCamera) {
            tsx_SetServerState( 'numberOfBins', 0 );
            tsx_UpdateDeviceManufacturer( 'camera', 'Not Found' );
            tsx_UpdateDeviceModel( 'camera', 'NotFound' );
            UpdateStatus( ' [SETTINGS] camera Not Found');
          }
          if(notFoundGuider) {
            tsx_UpdateDeviceManufacturer( 'guider', 'Not Found' );
            tsx_UpdateDeviceModel( 'guider', 'NotFound' );
            tsx_SetServerState( 'numGuiderBins', 0 );
            UpdateStatus( ' [SETTINGS] guider Not Found');
          }

          if( numFilters > -1 ) {
            // if too many filters... reduce to matching
            // if not enough then upsert will clean up
            UpdateStatus( ' [SETTINGS] Updated Filters');
            var filters = Filters.find({}, { sort: { slot: 1 } }).fetch();
            if( filters.length > numFilters ) {
              // need to reduce the filters
              for (var i = 0; i < filters.length; i++) {
                if( filters[i].slot > numFilters-1) {
                   Filters.remove(filters[i]._id);
                }
              }
            }

            for( var s=0; s<numFilters; s++ ) {
              var slot = "slot_" +s;
              for( var i=1; i<results.length;i++) {
                var token=results[i].trim();
                var param=token.split("=");
                if( slot == param[0] ) {
                  var name = param[1];
                  let filter = Filters.findOne({name: name });
                  Filters.upsert( {slot: s }, {
                    $set: {
                      name: name,
                    }
                  });
                }
              }
            }
            UpdateStatus( ' [SETTINGS] Updated Filters');
          }
          UpdateStatus( ' [SETTINGS] Devices Updated');
        }
      }
      else {
        tsxWarn(' [SETTINGS] Device update failed: ' + tsx_return);
      }
    }
    Meteor.sleep( 500 ); // needs a sleep before next image
    tsx_is_waiting = false;
  }));
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
   if( isSchedulerStopped() ) {
     tsxInfo(' [SETTINGS] Device Update Stopped');
     tsx_is_waiting = false;
     success = false;
   }
  }
}

// *******************************
// *******************************
// *******************************
// *******************************
Meteor.methods({

  // **************************************************************
  connectToTSX() {
    tsx_SetServerState( tsx_ServerStates.tool_active, true );

    tsxInfo(' ******************************* ');
    UpdateStatus(' [SETTINGS] Refreshing Devices...');
    try {
      var isOnline = tsx_ServerIsOnline();
      tsxInfo('tsx_ServerIsOnline: ' + isOnline);
      // *******************************
      //  GET THE CONNECTED EQUIPEMENT
      tsxInfo(' ******************************* ');
      tsxInfo(' [SETTINGS] Loading devices');
      var out = tsx_DeviceInfo();
    }
    catch( e ) {
      if( e == 'TsxError' ) {
        UpdateStatus(' [SETTINGS] !!! TheSkyX connection is no longer there!');
      }
      console.log(e)
    }
    finally {
      tsx_SetServerState( tsx_ServerStates.tool_active, false );
    }
   },

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
