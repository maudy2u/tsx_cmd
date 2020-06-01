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

import { Filters } from '../imports/api/filters.js';
import { TheSkyXInfos } from '../imports/api/theSkyXInfos.js';
import { scheduler } from '../imports/api/theProcessors.js';
import { TargetAngles } from '../imports/api/targetAngles.js';

import { tsxInfo, tsxLog, tsxErr, tsxWarn, tsxDebug,
  logFileForClient, AppLogsDB
} from '../imports/api/theLoggers.js';

import {
  imageReportMaxPixel,
} from '../imports/api/imagingSessionLogs.js';

import {
  runSchedulerProcess,
  getSchedulerState,
} from './run_schedule_process.js'

import {
  getFilterName,
  getFrameNumber,
  getFrameName,
  getFilterSlot,
} from './filter_wheel.js'

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
  tsx_takeImage,
  tsx_ServerIsOnline,
  tsx_SlewTargetName,
  tsx_SlewCmdCoords,
  tsx_StopTracking,
  isSchedulerStopped,
} from './run_imageSession.js';

import {
  flatbox_connect,
  flatbox_disconnect,
  flatbox_on,
  flatbox_off,
  flatbox_status,
  flatbox_level,
  flatbox_setup,
} from './artesky_flatbox.js'

import {
  CalibrationFrames,
  calibrationTypes,
  addCalibrationFrame,
  updateCalibrationFrame,
 } from '../imports/api/calibrationFrames.js';

const settlePanel = 3*1000; // seconds

export function collect_calibration_images() {
  tsxLog(" [CALIBRATION] *******************************");
  UpdateStatus(" [CALIBRATION] STARTED");

  tsx_SetServerState( tsx_ServerStates.tool_active, true );

  // Confirm TheSkyX is running
  // if( tsx_Connect() != true ) {
  //   UpdateStatusErr( ' FAILED CALIBRATION SESSION: is TkeSkyX running?' );
  //   return;
  // }

  // Confirm TheSkyX is Running
  let cf; // get the enabled calibration calibrations
  cf = CalibrationFrames.find({ on_enabled: true }, { sort: { order: 1 } }).fetch();
  var fp_enabled = tsx_GetServerStateValue( tsx_ServerStates.flatbox_enabled);
  if( typeof fp_enabled === 'undefined' || fp_enabled === '' ) {
    fp_enabled = false;
    tsx_SetServerState( tsx_ServerStates.flatbox_enabled, false);
    tsxLog( ' Flatbox: turned off by default')
  }
  tsxLog( ' [CALIBRATION] calibration frame(s): ' + cf.length );

  // for loop for Quantity
  for( var i=0; i < cf.length; i ++ ) {
    if( isSchedulerStopped() != false ) {
      tsxLog( ' [CALIBRATION] EXIT: Manually stopped' );
      break;
    }
    cal = cf[i];
    // what is the FOV position??
    tsxLog( ' [CALIBRATION] DEPRECATED>> Rotator disabled: ' + cal.rotation );

    // ensure valid level
    if( cal.level < 0 || cal.level > 255 ) {
      cal.level = 0;
    }

    // disconnect to turn off in case of darks
    if( fp_enabled == true && cal.subFrameTypes === 'Flat' ) {
      flatbox_connect();
      flatbox_on();
      flatbox_level( cal.level );
    }
    else if( fp_enabled == true && (cal.subFrameTypes === 'Dark' || cal.subFrameTypes === 'Bias' ) ) {
      flatbox_disconnect();
    }

    // take_image to actually take the picture
    try {
      var maxPix = 0;
      var numMaxPixs = 0;
      var MAXIMUM_OCCURANCE = 2;
      const MAX_VALUE = 65536; // TheSkyX's 16 bit maximumm value
      for( var sub=0; sub<cal.quantity; sub++) {
        if( isSchedulerStopped() == false ) {
          var inc = sub+1;
          UpdateStatus( ' [CALIBRATION] frame: ' + cal.subFrameTypes + ' ' +  cal.filter + ' ' + cal.exposure + ' sec: '  +inc+'/' + cal.quantity    );
          var iid = takeCalibrationImage( cal );

          // *******************************
          // MONITOR for MAX PIXEL and if max value decrease by one
          // *******************************
          if( fp_enabled == true && cal.subFrameTypes === 'Flat' ) {
            maxPix = imageReportMaxPixel( iid );
            tsxLog( ' [CALIBRATION] Maximum pixel value: ' + maxPix );
            if( maxPix >= MAX_VALUE ) {
              numMaxPixs++;
            }
            else {
              numMaxPixs = 0;
            }
            if( numMaxPixs > MAXIMUM_OCCURANCE ) {
              cal.level = cal.level - 1;
              if( cal.level < 0 ) {
                cal.level = 0;
              }
              flatbox_level( cal.level );
              updateCalibrationFrame(
                cal._id,
                'level',
                cal.level,
              );
            }
          }
          // *******************************

        }
        else {
          UpdateStatus( " [CALIBRATION] Manually stopped.");
        }
      }
    }
    catch( err ) {
      tsxError( err )
      UpdateStatusErr( ' [CALIBRATION] *** UNKNOWN ERROR - Calibrating failed.' );
    }
  }
  if( fp_enabled ) {
    flatbox_off();
    flatbox_disconnect();
  }

  tsx_SetServerState( tsx_ServerStates.tool_active, false );
  UpdateStatus(" [CALIBRATION] Finished");
  tsxLog(" [CALIBRATION] *******************************");
}

//var aFrame = $002; //  cdLight =1, cdBias, cdDark, cdFlat
function takeCalibrationImage( cal ) {
  var frame = getFrameNumber(cal.subFrameTypes);
  var filter = getFilterSlot( cal.filter );
  var exposure = cal.exposure;
  var tName = cal.subFrameTypes;
  var delay = tsx_GetServerStateValue( tsx_ServerStates.flatbox_camera_delay );
  var binning =cal.binning;
  var ccdTemp = cal.ccdTemp;
  tsxDebug( ' [CALIBRATION] filter=' + filter +', exposure=' + exposure +', frame=' + frame +', name=' + tName + ', delay=' + delay+ ', binning=' + binning+ ', ccdTemp=' + ccdTemp);
  return tsx_takeImage( filter, exposure, frame, tName, delay, binning, ccdTemp );
}

Meteor.methods({

  testArteskyConnection() {
    var err = flatbox_connect();
    console.log( ' [ARTESKY] connect: ' + err )
    err = flatbox_status();
    console.log( ' [ARTESKY] status: ' + err )
    return err;
  },

  artesky_off() {
    var err = flatbox_connect();
    console.log( ' [ARTESKY] connect: ' + err )
    err = flatbox_off();
    console.log( ' [ARTESKY] on: ' + err )
    err = flatbox_disconnect();
    console.log( ' [ARTESKY] on: ' + err )
  },

  processCalibrationTargets( ) {
    if(
      getSchedulerState() == 'Running'
    ) {
      tsxInfo("Running found");
      tsxLog('Scheduler is alreadying running. Nothing to do.');
      return;
    }
    else if( getSchedulerState() == 'Stop' ) {
      tsx_SetServerState( tsx_ServerStates.tool_active, true );
      tsxInfo(" Calibration File Processes");
      runSchedulerProcess();
      // Create a job:
      var job = new Job(scheduler, tsx_ServerStates.runScheduler, // type of job
        // Job data that you define, including anything the job
        // needs to complete. May contain links to files, etc...
        {
          startTime: new Date(),
          scheduleType: 'calibration',
        }
      );
      job.priority('normal');
      var jid = job.save();               // Commit it to the server
    } else {
        tsxErr("Invalid state found for scheduler.");
        // logCon.error('Invalid state found for scheduler.');
      }
  },


  calibrateGuider( slew, location, dec_az ) {
    tsxInfo(' *** tsx_CalibrateAutoGuide' );
    var enabled = tsx_GetServerStateValue( tsx_ServerStates.isCalibrationEnabled );
    if( !enabled ) {
      UpdateStatus(' *** Calibration disabled - enable to continue');
      return false;
    }

    UpdateStatus(' TOOLBOX: Autoguider Calibration STARTED');
    tsx_SetServerState( tsx_ServerStates.tool_active, true );
    try {
      let res = true;
      if( slew != '' ) {
        if( slew == 'Alt/Az'&& location !='' && dec_az != '') {
          UpdateStatus(' --- slewing to Alt/Az: ' + location + '/' + dec_az );
          res = tsx_SlewCmdCoords( 'SkyX_JS_SlewAltAz', location, dec_az );
        }
        else if( slew == 'Ra/Dec' && location !='' && dec_az != '') {
          UpdateStatus(' --- slewing to Ra/Dec: ' + location + '/' + dec_az );
          res = tsx_SlewCmdCoords( 'SkyX_JS_SlewRaDec', location, dec_az );
        }
        else if( slew == 'Target name' && location !='') {
          UpdateStatus(' Tool: slewing to target: ' + location );
          res = tsx_SlewTargetName( location  );
        }
        UpdateStatus(' --- slew finished');
      }
      else {
        UpdateStatus(' --- no slew, using current position');
      }
      if( res = true ) {
        tsxLog(' --- calibrating autoGuider');
        CalibrateAutoGuider();
      }
    }
    catch( e ) {
      if( e == 'TsxError' ) {
        UpdateStatus('!!! TheSkyX connection is no longer there!');
      }
    }
    finally {
      UpdateStatus(' TOOLBOX: Autoguider Calibration FINISHED');
      tsx_SetServerState( tsx_ServerStates.tool_active, false );
    }
  },

});
