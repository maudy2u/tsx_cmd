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
  tsx_feeder,
  tsx_cmd,
  tsx_has_error,
  tsx_ServerIsOnline,
} from './tsx_feeder.js'

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
  tsx_AbortGuider,
  getValidTargetSession,
  prepareTargetForImaging,
  processTargetTakeSeries,
  tsx_isDark,
  findCalibrationSession,
  CalibrateAutoGuider,
  tsx_RotateCamera,
  tsx_SlewTargetName,
  tsx_SlewCmdCoords,
  tsx_StopTracking,
} from './run_imageSession.js';

 import {
   collect_calibration_images,
   calibrate_flatbox_levels,
 } from './run_calibration.js'

 import {
   ParkMount,
   tsx_MntUnpark,
   tsx_MntPark,
 } from './mount.js'

 export function getSchedulerState() {
   var state = tsx_GetServerStateValue( tsx_ServerStates.scheduler_running );
   return state;
 }

 export function setSchedulerState( value ) {
   tsx_SetServerState(tsx_ServerStates.scheduler_running, value);
 }

 export function srvStopScheduler() {
   CleanUpJobs();
   UpdateImagingSesionID( '' );
   tsx_SetServerState(tsx_ServerStates.targetName, 'No Active Target');
   tsx_SetServerState(tsx_ServerStates.scheduler_report, '');
   setSchedulerState('Stop' );
 }

 // *******************************
 export function isSchedulerStopped() {
   tsxInfo(' *** isSchedulerStopped ' );
   var sched = getSchedulerState();
   if( sched !== 'Stop' ) {
     tsxDebug(' [SCHEDULER] scheduler_running: ' + sched);
     return false; // exit
   }
   tsx_SetServerState( tsx_ServerStates.targetName, 'No Active Target');
   tsx_SetServerState( tsx_ServerStates.scheduler_report, '');
   // THis line is needed in the tsx_feeder
   tsx_SetServerState( tsx_ServerStates.imagingSessionId, '');

   return true;
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
   var workers = scheduler.processJobs( tsx_ServerStates.runScheduler,
     function (job, cb) {
       //  ###############################  ');
       // This will only be called if a 'runScheduler' job is obtained
       // THE ONLY SPOT FOR THIS setMethod
       tsxLog( ' ###############################  ');
       setSchedulerState( 'Running' );
       //  ###############################  ');

       tsx_SetServerState(tsx_ServerStates.runScheduler, job);

       UpdateStatus(' [SCHEDULER] STARTED');
       var schedule = job.data;
       tsxDebug( schedule );
       tsxDebug( job.data );

       job.log("Entered the scheduler process",
         {level: 'info'}
       );

       var isParked = '';

       if( schedule.scheduleType === 'calibration' &&
         isSchedulerStopped() == false )
       {
         // *******************************
         collect_calibration_images();
       }

       else if ( schedule.scheduleType === 'flatbox calibration'
       &&
         isSchedulerStopped() == false)
       {
         calibrate_flatbox_levels();
       }
       else {
         // *******************************
         // the job is used to run the scheduler.
         while( isSchedulerStopped() == false ) {
           tsxInfo(" [SCHEDULER]=== Starting imaging targets");

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
             tsxInfo ( ' [SCHEDULER]' + target.targetFindName + ' Preparing target...');

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
                   UpdateStatusErr( ' [SCHEDULER]PAUSING SCHEDULER - Could not prepare target (CLS failed). Checking for clouds.' );
                   ParkMount( isParked );
                   isParked = true;
                 }
                 else {
                   UpdateStatusErr( ' [SCHEDULER]!!! SOMETHING WRONG - human needs to check ');
                   break;
                 }
               }
               catch( e ) {
                 // split may fail
                 UpdateStatusErr( ' [SCHEDULER]!!! SOMETHING WRONG - human needs to check: ' + err );
                 break;
               }
             }
             if( ready ) {
               // target images per Take Series
               tsxInfo ( ' [SCHEDULER]************************1*');
               tsxInfo ( ' [SCHEDULER]' +target.targetFindName  + ': start imaging');
               try {
                 processTargetTakeSeries( target );
                 if( isSchedulerStopped() == true ) {
                   break;
                 }
               }
               catch( err ) {
                 // did we get a CLS Failure???
                 tsxErr( ' [SCHEDULER]!!! Error processing series: ' + err );
                 var res = err.split('|')[0].trim();
                 if( res == 'TSX_ERROR' ) {
                   UpdateStatusErr( ' [SCHEDULER] PAUSING SCHEDULER - CLS failed - checking for clouds.' );
                   ParkMount( isParked );
                   isParked = true;
                 }
                 else {
                   UpdateStatus( ' [SCHEDULER]!!! SOMETHING WRONG - human needs to check ');
                   break;
                 }
               }
               tsxInfo ( ' [SCHEDULER]************************2*');
             }
             // No target found so sleep and try again...
             else {
               UpdateStatus( ' [SCHEDULER] NO TARGETS READY. Will SLEEP and try in a bit.');
               ParkMount( isParked );
               isParked = true;
               sleepScheduler( isParked );
             }
           }
           // Scheduler stopped so park
           else {
             UpdateStatus( ' [SCHEDULER] NO VALID TARGETS. Will sleep and try in a bit.');
             ParkMount( isParked );
             isParked = true;
             // no target found... so sleep and check again...
             // allow a moment to enable a target.
             sleepScheduler( isParked );
           }

           // Check if sun is up and no cal frames
           if( (!isDarkEnough()) && isSchedulerStopped() == false ) {
             tsxLog( ' [SCHEDULER] NOT DARK ENOUGH, or schedule is stopped');
             ParkMount( isParked );
             isParked = true;
             var approachingDawn = isTimeBeforeCurrentTime('3:00');
             tsxInfo( ' [SCHEDULER] Is approachingDawn: ' + approachingDawn);
             // var stillDaytime = isTimeBeforeCurrentTime('15:00');
             // tsxInfo( ' Is stillDaytime: ' + stillDaytime);
             if( approachingDawn ) {
               var defaultFilter = tsx_GetServerStateValue( tsx_ServerStates.defaultFilter );
               var softPark = false;
               tsx_AbortGuider();
               tsx_MntPark(defaultFilter, softPark);
               var defaultMinSunAlt = tsx_GetServerStateValue( tsx_ServerStates.defaultMinSunAlt );
               UpdateStatus( ' [SCHEDULER] STOPPED: sun rose above limit ' + defaultMinSunAlt);
               break;
             }
           }
         }
       }
       // While ended... exit process
       tsxLog( ' [SCHEDULER] STOPPED');
       tsxLog( ' ###############################  ');
       srvStopScheduler();
       tsx_SetServerState(tsx_ServerStates.runScheduler, '');
       job.done();
       cb();
     }
   );
   return scheduler.startJobServer();
}

function sleepScheduler( isParked ) {
  var sleepTime = tsx_GetServerStateValue( tsx_ServerStates.defaultSleepTime );
  tsxDebug( ' [SCHEDULER] SLEEPING.')
  if( isParked == false ) {
    ParkMount( isParked );
  }
  UpdateStatus( ' [SCHEDULER] waiting: '+ sleepTime + ' min');
  var timeout = 0;
  var msSleep = Number(sleepTime); // number of seconds
  postProgressTotal(sleepTime);
  postProgressMessage(' [SCHEDULER] Waiting ~' + sleepTime + 'min.');

  while( timeout < msSleep && isSchedulerStopped() == false ) { //
    var min = 1000*60; // one minute in milliseconds
    Meteor.sleep( min );
    timeout = timeout + 1;
    postProgressIncrement( timeout );
  }
  if( isSchedulerStopped() != false ) {
    UpdateStatus( ' [SCHEDULER] CANCELING SCHEDULER');
  }
  else {
    UpdateStatus(' [SCHEDULER] WAKING UP...');
  }
  postProgressTotal(0);
  postProgressIncrement( 0 );
  postProgressMessage(' [SCHEDULER] Processing');
}

function isDarkEnough() {
  var isDark = tsx_isDark();
  tsxDebug(' [SCHEDULER] Is dark enough for target: ' + isDark );
  if( isDark === false ) {
    tsxDebug( ' [SCHEDULER] Sun is not low enough.' );
    return false;
  }
  return true;
}


function CleanUpJobs() {
  // *******************************
  // Server restarts and it means no session
  // get rid of any old processes/jobs
  scheduler.remove({});
  //  var jobs = scheduler.find().fetch();
  //  var jid = tsx_GetServerStateValue('runScheduler');
  //  scheduler.remove( jid );

  // Clean up the scheduler process collections...
  // Persistence across reboots is not needed at this time.
  // tsxInfo('Number of Jobs found: ' + jobs.length);
  // if( jobs.length > 0 ) {
  //   tsxInfo( ' Cleaning up DB');
  //   for (var i = 0; i < jobs.length; i++) {
  //     if( typeof jobs[i] != 'undefined') {
  //       scheduler.remove(jobs[i]._id);
  //     }
  //   }
  //   tsxInfo(' Cleaned DB');
  // }
  return;
}

// *************************** ***********************************
// Assuming a time/duration in seconds is provided and a Date Object
export function hasTimePassed( duration, timestamp ) {
  // if( typeof timestamp === 'undefined' || duration === '' ) {
  //   return true;
  // }
  var now = new Date();
  var diff = parseInt(now - timestamp)/1000; // Difference in seconds
  if( diff >= duration) {
    return true;
  }
  return false;
}
// *************************** ***********************************
// Assuming a time in seconds is provided and a Date Object
export function howMuchTimeHasPassed( duration, timestamp ) {
  var now = new Date();
  var diff = parseInt(now - timestamp)/1000; // Difference in seconds
  return diff;
}

export function hasStartTimePassed( target ) {
  // tsxInfo('************************');
  tsxInfo(' *** hasStartTimePassed: ' + target.getFriendlyName() );

  var start_time = target.startTime;
  var canStart = isTimeBeforeCurrentTime( start_time );
  // do not start if undefined
  return canStart;
}

export function isDateBeforeCurrentDate( chkDate ) {
  var cur_dts = new Date();
  var cur_time = cur_dts.getHours()+(cur_dts.getMinutes()/60);
  // tsxInfo('Current time: ' + cur_time );

  // add 24 to the morning time so that
  ((cur_time < 8) ? cur_time=cur_time+24 : cur_time);

  chkDate = chkDate.getHours()+(chkDate.getMinutes()/60);


  // tsxInfo('Start time: ' + start_time );
  var hrs = ts.split(':')[0].trim();
  // tsxInfo('Start hrs: ' + hrs );
  var min = ts.split(':')[1].trim();
  // tsxInfo('Start min: ' + min );
  ts = Number(hrs) + Number(min/60);
  ((ts < 8) ? ts=ts+24 : ts);
  // tsxInfo('curtime: ' + cur_time + ' vs ' + ts);
  var curBefore = ((ts < cur_time ) ? true : false);
  return curBefore;

}

// **************************************************************
// #TODO used this for one consistent time comparing function
//
// 24hrs e.g.
// 21:00
// return true if undedefined
export function isTimeBeforeCurrentTime( ts ) {
  // tsxInfo('************************');
  tsxInfo(' *** isTimeBeforeCurrentTime: ' + ts );

  if( typeof ts === 'undefined') {
    tsxWarn( ' isTimeBeforeCurrentTime FAILED - target start is undefined')
    return true; // as undefined....
  }

  var cur_dts = new Date();
  var cur_time = Number(cur_dts.getHours())+Number((cur_dts.getMinutes()/60));
  // tsxInfo('Current time: ' + cur_time );

  // add 24 to the morning time so that
  ((cur_time < 8) ? cur_time=cur_time+24 : cur_time);

  // tsxInfo('Start time: ' + start_time );
  var hrs = ts.split(':')[0].trim();
  // tsxInfo('Start hrs: ' + hrs );
  var min = ts.split(':')[1].trim();
  // tsxInfo('Start min: ' + min );
  ts = Number(hrs) + Number(min/60);
  ((ts < 8) ? ts=ts+24 : ts);
  // tsxInfo('curtime: ' + cur_time + ' vs ' + ts);
  var curBefore = ((ts < cur_time ) ? true : false);
  return curBefore;
}


Meteor.methods({

  // the question with the scheduler is...
  // how to pause the "takeseries"
  // and allow the other functions to run...
  // do I need to create other "Jobs"
  // 1. CLS?
  // 2. focus?
  // 3. autoguide?
  // 4. start/end checks... ???
  // or KISS and one big sequenital function...
  startScheduler() {
    tsxInfo(' ***********************2*');
    // tsxLog('Found scheduler state: ' + getSchedulerState() );
    if(
      getSchedulerState() == 'Running'
    ) {
      tsxInfo("Running found");
      tsxLog('Scheduler is alreadying running. Nothing to do.');
      return;
    }
    else if(
       getSchedulerState() == 'Stop'
     ) {
       tsxDebug("Stop found");

       // Confirm whether the there is a script running...
       if( !tsx_ServerIsOnline() ) {
         UpdateStatus('Check TSX... is another script running, or is server not online.');
         return;
       }

       runSchedulerProcess();

       tsxDebug( ' @@ creating job' );
       // Create a job:
       var job = new Job(scheduler, tsx_ServerStates.runScheduler, // type of job
         // Job data that you define, including anything the job
         // needs to complete. May contain links to files, etc...
         {
           startTime: new Date(),
           scheduleType: 'imaging',
         }
       );
       tsxDebug( ' @@ Job created' );

       // Set some properties of the job and then submit it
       // the same submit the start time to the scheduler...
       // at this time could add a tweet :)
       job.priority('normal');
       // .retry({ retries: 5,
       //   wait: 5*60*1000 }) //15*60*1000 })  // 15 minutes between attempts
       // .delay(0);// 60*60*1000)     // Wait an hour before first try

       var jid = job.save();               // Commit it to the server
       tsxDebug( ' @@ Job submitted' );

       // tsxLog('Job id: ' + jid);
       return;
    }
    else {
      tsxErr("Invalid state found for scheduler.");
      // logCon.error('Invalid state found for scheduler.');
    }
  },

  stopScheduler() {
    if( getSchedulerState() != 'Stop' ) {
      UpdateStatus(' [SCHEDULER] MANUALLY Stopping');
      srvStopScheduler();
    }
    else {
      tsxInfo('Do nothing - Already Stopped');
    }
  },

});
