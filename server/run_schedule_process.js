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

import {
  tsxInfo,
  tsxLog,
  tsxErr,
  tsxWarn,
  tsxDebug,
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
  getValidTargetSession,
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
   collect_calibration_images,
 } from './run_calibration.js'

 import {
   ParkMount,
 } from './mount.js'

 import {
   srvStopScheduler,
 } from './main.js'

 export function getSchedulerState() {
   var state = tsx_GetServerStateValue( tsx_ServerStates.scheduler_running );
   return state;
 }

 export function setSchedulerState( value ) {
   tsx_SetServerState(tsx_ServerStates.scheduler_running, value);
 }

 export function runSchedulerProcess() {
   // *******************************
   //   Imaging processs
   // *******************************
   // Assumed balanced RA/DEC
   // Assumed Date/Time/Long/Lat correct
   // Assumed Homed
   // Assume Polar aligned (rough, or with Polemaster)
   // Assumed initial focus is done
   // Assume TPoint recalibration done
   // Assumed Accurate Polar Alignment (APA) done
   // Do not assume Autoguider calibrated, will be done once guide star found
   var workers = scheduler.processJobs( 'runScheduler',
     function (job, cb) {
       tsxLog( '  ###############################  ');
       //  ###############################  ');
       // This will only be called if a 'runScheduler' job is obtained

       // THE ONLY SPOT FOR THIS setMethod
       setSchedulerState( 'Running' );
       //  ###############################  ');

       tsx_SetServerState(tsx_ServerStates.runScheduler, job);

       UpdateStatus(' SCHEDULER STARTED');
       var schedule = job.data;
       tsxDebug( schedule );
       tsxDebug( job.data );

       job.log("Entered the scheduler process",
         {level: 'info'}
       );

       var isParked = '';

       if( schedule.scheduleType == 'calibration' &&
         isSchedulerStopped() == false )
       {
         // *******************************
           collect_calibration_images();
       }
       else {
         // *******************************
         // the job is used to run the scheduler.
         while( isSchedulerStopped() == false ) {
           tsxInfo(" === Starting imaging targets");

           tsx_MntUnpark();
           isParked = false;
           if( isSchedulerStopped() != false ) {
             break;
           }

           // Find a session
           // Get the target to shoot
           // tsxInfo( ' Validating Targets...');

           /* #TODO
           So working on the cloud detection to PAUSE.

           1.  getValidTargetSession returns a target.
               It needs to a add a check that if isCloudy = false then it is skipped
           2.  prepareTargetForImaging can return false.. meaning the chosen target
               could not be prepared... CLS failed. If so then market the target as FAILED
               (The start of the job needs to "reset" all targets as isCloudy = false.)

           */

           // Process Targets
           var target = getValidTargetSession(); // no return
           // if no valid target then check for calibration sessions...
           // how to detect calibation sessions...
           // Create Calibration sessions similar to Targets..
           // New database... uses calibration images...
           // Means there are edits... i.e. assign/copy a series
           // anything else? enable/disable... Flat/Dark/Bias
           // remove dark/bias/flat from targets...

           if (typeof target !== 'undefined' && isSchedulerStopped() == false ) {
             tsxInfo ( ' ' + target.targetFindName + ' Preparing target...');

             // Point, Focus, Guide
             var ready = false;
             // Get a target, if CLS fails - assumed cloudy
             try {
               // First true = do the rotator
               // Second true = do the calibration
               // Check the prepareTargetForImaging and see where the rotate is
               ready = prepareTargetForImaging( target, true, true );
               if( isSchedulerStopped() == true ) {
                 break;
               }
             }
             catch( err ) {
               // did we get a CLS Failure???
               var res = '';
               try {
                 res = err.split('|')[0].trim();
                 if( res == 'TSX_ERROR' ) {
                   UpdateStatusErr( ' PAUSING SCHEDULER - Could not prepare target (CLS failed). Checking for clouds.' );
                   ParkMount( isParked );
                   isParked = true;
                 }
                 else {
                   UpdateStatusErr( ' !!! SOMETHING WRONG - human needs to check ');
                   break;
                 }
               }
               catch( e ) {
                 // split may fail
                 UpdateStatusErr( ' !!! SOMETHING WRONG - human needs to check: ' + err );
                 break;
               }
             }
             if( ready ) {
               // target images per Take Series
               tsxInfo ( ' ************************1*');
               tsxInfo ( ' ' +target.targetFindName  + ': start imaging');
               try {
                 processTargetTakeSeries( target );
                 if( isSchedulerStopped() == true ) {
                   break;
                 }
               }
               catch( err ) {
                 // did we get a CLS Failure???
                 tsxErr( ' !!! Error processing series: ' + err );
                 var res = err.split('|')[0].trim();
                 if( res == 'TSX_ERROR' ) {
                   UpdateStatusErr( ' PAUSING SCHEDULER - CLS failed - checking for clouds.' );
                   ParkMount( isParked );
                   isParked = true;
                 }
                 else {
                   UpdateStatus( ' !!! SOMETHING WRONG - human needs to check ');
                   break;
                 }
               }
               tsxInfo ( ' ************************2*');
             }
             // No target found so sleep and try again...
             else {
               UpdateStatus( ' NO TARGETS READY. Will SLEEP and try in a bit.');
               ParkMount( isParked );
               isParked = true;
               sleepScheduler( isParked );
             }
           }
           // Scheduler stopped so park
           else {
             UpdateStatus( ' NO VALID TARGETS. Will sleep and try in a bit.');
             ParkMount( isParked );
             isParked = true;
             // no target found... so sleep and check again...
             // allow a moment to enable a target.
             sleepScheduler( isParked );
           }

           // Check if sun is up and no cal frames
           if( (!isDarkEnough()) && isSchedulerStopped() == false ) {
             tsxLog( ' NOT DARK ENOUGH, or schedule is stopped');
             ParkMount( isParked );
             isParked = true;
             var approachingDawn = isTimeBeforeCurrentTime('3:00');
             tsxInfo( ' Is approachingDawn: ' + approachingDawn);
             // var stillDaytime = isTimeBeforeCurrentTime('15:00');
             // tsxInfo( ' Is stillDaytime: ' + stillDaytime);
             if( approachingDawn ) {
               var defaultFilter = tsx_GetServerStateValue( tsx_ServerStates.defaultFilter );
               var softPark = false;
               tsx_AbortGuider();
               tsx_MntPark(defaultFilter, softPark);
               var defaultMinSunAlt = tsx_GetServerStateValue( tsx_ServerStates.defaultMinSunAlt );
               UpdateStatus( ' Scheduler stopped: sun rose above limit ' + defaultMinSunAlt);
               break;
             }
           }
         }
       }
       // While ended... exit process
       srvStopScheduler();
       tsxLog( ' SCHEDULER STOPPED');
       tsxLog( ' ###############################  ');
       job.done();
       cb();
     }
   );
   return scheduler.startJobServer();
}

function sleepScheduler( isParked ) {
  var sleepTime = tsx_GetServerStateValue( tsx_ServerStates.defaultSleepTime );
  tsxDebug( ' SLEEPING.')
  if( isParked == false ) {
    ParkMount( isParked );
  }
  UpdateStatus( ' Parked mount, waiting: '+ sleepTime + ' min');
  var timeout = 0;
  var msSleep = Number(sleepTime); // number of seconds
  postProgressTotal(sleepTime);
  postProgressMessage('Waiting ~' + sleepTime + 'min.');

  while( timeout < msSleep && isSchedulerStopped() == false ) { //
    var min = 1000*60; // one minute in milliseconds
    Meteor.sleep( min );
    timeout = timeout + 1;
    postProgressIncrement( timeout );
  }
  if( isSchedulerStopped() != false ) {
    UpdateStatus( ' CANCELING SCHEDULER');
  }
  else {
    UpdateStatus(' WAKING UP...');
  }
  postProgressTotal(0);
  postProgressIncrement( 0 );
  postProgressMessage(' Processing');
}

function isDarkEnough() {
  var isDark = tsx_isDark();
  tsxDebug(' Is dark enough for target: ' + isDark );
  if( isDark === false ) {
    tsxDebug( ' Sun is not low enough.' );
    return false;
  }
  return true;
}
