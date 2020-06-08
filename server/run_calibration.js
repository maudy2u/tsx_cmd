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
  tsx_cmd,
  tsx_feeder,
} from './tsx_feeder.js'

import {
  imageReportMaxPixel,
  imageReportFilename,
} from '../imports/api/imagingSessionLogs.js';

import {
  runSchedulerProcess,
  getSchedulerState,
  setSchedulerState,
  srvStopScheduler,
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
  UpdateStatusWarn,
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
    tsxLog( ' [CALIBRATION] Flatbox: turned off by default')
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
      for( var sub=0; sub<cal.quantity; sub++) {
        if( isSchedulerStopped() == false ) {
          var inc = sub+1;
          UpdateStatus( ' [CALIBRATION] frame: ' + cal.subFrameTypes + ' ' +  cal.filter + ' ' + cal.exposure + ' sec: '  +inc+'/' + cal.quantity    );
          var iid = takeCalibrationImage( cal );
          // *******************************
          // MONITOR for MAX PIXEL and if max value decrease by one
          // *******************************
          const MONITOR_PIXEL = tsx_GetServerStateValue( tsx_ServerStates.flatbox_monitor_max_pixel); // TheSkyX's 16 bit maximumm value
          if( fp_enabled == true
            && (cal.subFrameTypes === 'Flat'
            && MONITOR_PIXEL )
           )
           {
            const MAX_VALUE = tsx_GetServerStateValue( tsx_ServerStates.imagingPixelMaximum); // TheSkyX's 16 bit maximumm value
            const MAXIMUM_PIXEL_OCCURANCE = tsx_GetServerStateValue( tsx_ServerStates.imagingPixelMaximumOccurance); // TheSkyX's 16 bit maximumm value

            maxPix = imageReportMaxPixel( iid );
            tsxLog( ' [CALIBRATION] Maximum pixel value: ' + maxPix + ', vs. MAX ALLOWED: ' + MAX_VALUE );
            if( Number(maxPix) >= Number(MAX_VALUE) ) {
              numMaxPixs++;
              var file = imageReportFilename( iid );
              tsx_RemoveImage( file );
              sub--;
            }
            else {
              numMaxPixs = 0;
            }
            if( numMaxPixs > MAXIMUM_PIXEL_OCCURANCE ) {
              cal.level = cal.level - 1;
              if( cal.level < 0 ) {
                cal.level = 0;
                throw( ' CALIBRATION] ERROR - MAX PIXEL at Flatpanel LEVEL 0');
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
      tsxErr( err )
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

/*
  1. After calibration frame check if max pixel ok, return number of fails
    i.e. 0 = no fail, 1 = is one fail so skipped lowering
  2. If okay CONTINUE,
  3. if not okay... then redo, and lowerLevel


  var upperLevel = calibrationItem.level;
  var lowerLevel = 0; //Math.floor(calibrationItem.level/2);

*/
function findFilterLevel( calibrationItem, upperLevel, lowerLevel ) {
  // *******************************
  // MONITOR for MAX PIXEL and if max value decrease by one
  // *******************************
  const FP_ENABLED = tsx_GetServerStateValue( tsx_ServerStates.flatbox_enabled);
  const MAX_VALUE = tsx_GetServerStateValue( tsx_ServerStates.imagingPixelMaximum); // TheSkyX's 16 bit maximumm value
  const MAXIMUM_PIXEL_OCCURANCE = tsx_GetServerStateValue( tsx_ServerStates.imagingPixelMaximumOccurance); // TheSkyX's 16 bit maximumm value
  const MONITOR_PIXEL_ENABLED = tsx_GetServerStateValue( tsx_ServerStates.flatbox_monitor_max_pixel); // TheSkyX's 16 bit maximumm value

  if(
      FP_ENABLED
    && MONITOR_PIXEL_ENABLED
    && calibrationItem.subFrameTypes === 'Flat'
   )
   {

    var not_found = true;
    while( Number(maxPix) >= Number(MAX_VALUE) || not_found ) {
      console.log( ' test - start ' )
      flatbox_level( calibrationItem.level )
      var iid = takeCalibrationImage( calibrationItem );
      var maxPix = imageReportMaxPixel( iid );
      UpdateStatus( ' [CALIBRATION] Max pixel level: ' + maxPix );

      var prev_level = Number(calibrationItem.level);
      console.log( '### Upper:   ' + upperLevel );
      console.log( '### current: ' + prev_level );
      console.log( '### Lower:   ' + lowerLevel );
      if( Number(maxPix) >= Number(MAX_VALUE) ) {
        upperLevel = Number(prev_level);
        calibrationItem.level = Number(upperLevel) - Math.floor((Number(prev_level)-Number(lowerLevel))/2);
        UpdateStatus( ' [CALIBRATION] LOWER panel level' );
        updateCalibrationFrame(
          calibrationItem._id,
          'level',
          calibrationItem.level,
        );
      }

      if( Number(maxPix) < Number(MAX_VALUE) ) {
        lowerLevel = Number(calibrationItem.level);
        calibrationItem.level = Number(prev_level) + Math.floor((Number(upperLevel)-Number(prev_level))/2);
        UpdateStatus( ' [CALIBRATION] HIGHER panel level' );
        updateCalibrationFrame(
          calibrationItem._id,
          'level',
          calibrationItem.level,
        );
      }

      if( calibrationItem.level < 0 ) {
        calibrationItem.level = 0;
        tsxDebug( ' calibrationItem.level set to zero...')
        throw( ' [CALIBRATION] ERROR - MAX PIXEL at Flatpanel LEVEL 0');
      }

      console.log( '### Revised Upper:   ' + upperLevel );
      console.log( '### Revised current: ' + calibrationItem.level );
      console.log( '### Revised Lower:   ' + lowerLevel );

      if( Number(calibrationItem.level) === Number(prev_level) ) {
        tsxDebug( ' level match exiting...')
        not_found = false;
        break;
      }

      if( isSchedulerStopped() ) {
        tsxDebug( ' [CALIBRATION] scheduler stopped. exiting');
        break;
      }


      console.log( ' test2 ' )
      var file = imageReportFilename( iid );
  //      tsx_RemoveImage( file );

    }

  }
  return true;
  // *******************************
}

function tsx_RemoveImage( fullPath ) {
  tsxInfo(' CALIBRATION] tsx_RemoveImage' );

  var success = false;
  var filename = fullPath.replace(/^.*[\\\/]/, '')
  var path = fullPath.split(filename);

  const fs = require('fs');
  fs.unlinkSync(fullPath, function (err) {
    if( err  ) {
      tsxErr( ' [CALIBRATION] File to remove is not a valid directory: ' + filename );
    }
    else {
      console.log( fileName );
      console.log( path );
      UpdateStatusWarn(" [CALIBRATION]  Removed file, Max Pixel detected: " + filename );
      return true;
    }
  });

  return success;

  // //
  // // var success = false;
  // // import shelljs from 'shelljs';
  // // // this is equivalent to the standard node require:
  // // const Shelljs = require('shelljs');
  // // var filename = fullPath.replace(/^.*[\\\/]/, '')
  // // var path = fullPath.split(filename);
  // // let err = Shelljs.test( '-e', path ); // -e tests for valid path, -d tests for directory, -f for just file
  // // if( err !== true ) {
  // //    tsxErr( ' [CALIBRATION] File to remove is not a valid directory: ' + filename );
  // // }
  // // else {
  // //   console.log( fileName );
  // //   console.log( path );
  // //   success = Shelljs.rm( '-rf', filename ); // -e tests for valid path, -d tests for directory
  // //   UpdateStatusWarn(" [CALIBRATION]  Removed file, Max Pixel detected: " + filename );
  // //   return true;
  // // }
  //
  // return success;
}

//var aFrame = $002; //  cdLight =1, cdBias, cdDark, cdFlat
function takeCalibrationImage( cal ) {

  var frame = getFrameNumber(cal.subFrameTypes);
  var tName = cal.subFrameTypes;

  if( cal.subFrameTypes === 'Flat' ) {
    UpdateStatusWarn( ' [CALIBRATION] Work around - Flat as Light to monitor max pixel');
    frame = getFrameNumber('Light');
    tName = 'Flat';
  }

  var filter = getFilterSlot( cal.filter );
  var exposure = cal.exposure;
  var delay = tsx_GetServerStateValue( tsx_ServerStates.flatbox_camera_delay );
  var binning =cal.binning;
  var ccdTemp = '';
  if( typeof cal.ccdTemp !== 'undefined' ) {
    ccdTemp = cal.ccdTemp;
  }
  tsxDebug( ' [CALIBRATION] filter=' + filter +', exposure=' + exposure +', frame=' + frame +', name=' + tName + ', delay=' + delay+ ', binning=' + binning+ ', ccdTemp=' + ccdTemp);
  var res = tsx_takeImage( filter, exposure, frame, tName, delay, binning, ccdTemp );
  return res;
}

Meteor.methods({

  findFilterLevels() {
    var res = '';
//    try{
      setSchedulerState( 'Running' );
      tsx_SetServerState( tsx_ServerStates.tool_active, true );
      flatbox_connect();
      flatbox_on();

      var cf = CalibrationFrames.find({ on_enabled: true }, { sort: { order: 1 } }).fetch();
      for( var i=0; i < cf.length; i ++ ) {
        findFilterLevel( cf[i], 254, 0 );
      }
      res = 'DONE';
    // }
    // catch( e ) {
    //   console.log( e )
    //   res = e;
    // }
    // finally {
    //   flatbox_disconnect();
     srvStopScheduler();
     tsx_SetServerState( tsx_ServerStates.tool_active, false );
    // }
    console.log( res )
    return res;
  },

  processCalibrationTargets( ) {
    if(
      getSchedulerState() == 'Running'
    ) {
      tsxInfo(" [CALIBRATION] Running found");
      tsxLog(' [CALIBRATION] Scheduler is alreadying running. Nothing to do.');
      return;
    }
    else if( getSchedulerState() == 'Stop' ) {
      tsx_SetServerState( tsx_ServerStates.tool_active, true );
      tsxInfo(" [CALIBRATION]  File Processes");
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
        tsxErr(" [CALIBRATION] Invalid state found for scheduler.");
        // logCon.error('Invalid state found for scheduler.');
      }
  },


  calibrateGuider( slew, location, dec_az ) {
    tsxInfo(' [AUTOGUIDER] tsx_CalibrateAutoGuide' );
    var enabled = tsx_GetServerStateValue( tsx_ServerStates.isCalibrationEnabled );
    if( !enabled ) {
      UpdateStatus(' [AUTOGUIDER] Calibration disabled - enable to continue');
      return false;
    }

    UpdateStatus(' [AUTOGUIDER] TOOLBOX: Autoguider Calibration STARTED');
    tsx_SetServerState( tsx_ServerStates.tool_active, true );
    try {
      let res = true;
      if( slew != '' ) {
        if( slew == 'Alt/Az'&& location !='' && dec_az != '') {
          UpdateStatus(' [AUTOGUIDER] slewing to Alt/Az: ' + location + '/' + dec_az );
          res = tsx_SlewCmdCoords( 'SkyX_JS_SlewAltAz', location, dec_az );
        }
        else if( slew == 'Ra/Dec' && location !='' && dec_az != '') {
          UpdateStatus(' [AUTOGUIDER] slewing to Ra/Dec: ' + location + '/' + dec_az );
          res = tsx_SlewCmdCoords( 'SkyX_JS_SlewRaDec', location, dec_az );
        }
        else if( slew == 'Target name' && location !='') {
          UpdateStatus(' [AUTOGUIDER] Tool: slewing to target: ' + location );
          res = tsx_SlewTargetName( location  );
        }
        UpdateStatus(' [AUTOGUIDER] slew finished');
      }
      else {
        UpdateStatus(' [AUTOGUIDER] no slew, using current position');
      }
      if( res = true ) {
        tsxLog(' [AUTOGUIDER] calibrating autoGuider');
        CalibrateAutoGuider();
      }
    }
    catch( e ) {
      if( e == 'tsxErr' ) {
        UpdateStatus(' [AUTOGUIDER]!!! TheSkyX connection is no longer there!');
      }
    }
    finally {
      UpdateStatus(' [AUTOGUIDER] TOOLBOX: Autoguider Calibration FINISHED');
      tsx_SetServerState( tsx_ServerStates.tool_active, false );
    }
  },

});
