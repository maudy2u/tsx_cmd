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

import { tsxInfo, tsxLog, tsxErr, tsxWarn, tsxDebug, logFileForClient, AppLogsDB } from '../imports/api/theLoggers.js';

import {
  tsx_ServerStates,
  tsx_SetServerState,
  tsx_GetServerState,
  tsx_UpdateDevice,
  tsx_GetServerStateValue,
  UpdateStatus,
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
} from './run_imageSession.js';

import { tsx_feeder, stop_tsx_is_waiting } from './tsx_feeder.js';

import {shelljs} from 'meteor/akasha:shelljs';

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
  tsx_SetServerState('activeMenu', 'Settings');
  tsx_SetServerState('mntMntDir', '');
  tsx_SetServerState('mntMntAlt', '');
  tsx_SetServerState('targetRA', '');
  tsx_SetServerState('targetDEC', '');
  tsx_SetServerState('targetALT', '');
  tsx_SetServerState('targetAZ', '');
  tsx_SetServerState('targetHA', '');
  tsx_SetServerState('targetTransit', '');
  tsx_SetServerState('targetName', 'No Active Target');
  tsx_SetServerState('scheduler_report', '');
  tsx_SetServerState('lastTargetDirection', '');
  tsx_SetServerState('lastCheckMinSunAlt', '');
  tsx_SetServerState('lastFocusPos', '');
  tsx_SetServerState('lastFocusTemp', '');
  tsx_SetServerState('initialFocusTemperature', '');
  tsx_SetServerState('imagingSessionDither', 0);
  tsx_SetServerState('currentJob', '');
  tsx_SetServerState('scheduler_running', 'Stop');

  for (var m in tsx_ServerStates){
    var state = tsx_ServerStates[m];
    try {
      var isDefined = TheSkyXInfos.findOne({name: state });
      tsxDebug(state, isDefined.value);

    } catch (e) {
      tsxWarn('Initialized: ', state);
      tsx_SetServerState(state, '');
    } finally {
    }
  }
}

function ParkMount( isParked ) {
  if( !isParked ) {
    UpdateStatus(' No valid sessions - parking...');
    var defaultFilter = tsx_GetServerStateValue('defaultFilter');
    var softPark = Boolean(tsx_GetServerStateValue('defaultSoftPark'));
    tsx_AbortGuider();
    tsx_MntPark(defaultFilter, softPark);
  }
  isParked = true;
  var sleepTime = tsx_GetServerStateValue('defaultSleepTime');
  UpdateStatus( ' No valid target, waiting: '+ sleepTime + ' min');
  var timeout = 0;
  var msSleep = Number(sleepTime); // number of seconds
  postProgressTotal(sleepTime);
  postProgressMessage('Waiting ~' + sleepTime + 'min.');
  while( timeout < msSleep && tsx_GetServerStateValue('currentJob') != '') { //
    var min = 1000*60; // one minute in milliseconds
    Meteor.sleep( min );
    timeout = timeout + 1;
    postProgressIncrement( timeout );
  }
  if( tsx_GetServerStateValue('currentJob') == '' ) {
    UpdateStatus( ' Canceled sessions');
    tsx_SetServerState('targetName', 'No Active Target');
    tsx_SetServerState('scheduler_report', '');
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

function CleanUpJobs() {
  // *******************************
  // Server restarts and it means no session
  // get rid of any old processes/jobs
  var jobs = scheduler.find().fetch();
  var jid = tsx_GetServerStateValue('currentJob');
  scheduler.remove( jid );
  tsx_SetServerState('currentJob', '');
  UpdateImagingSesionID( '' );
  tsx_SetServerState('targetName', 'No Active Target');
  tsx_SetServerState('scheduler_report', '');

  // Clean up the scheduler process collections...
  // Persistence across reboots is not needed at this time.
  tsxDebug('Number of Jobs found: ' + jobs.length);
  if( jobs.length > 0 ) {
    UpdateStatus( ' Cleaning up DB');
    for (var i = 0; i < jobs.length; i++) {
      if( typeof jobs[i] != 'undefined') {
        scheduler.remove(jobs[i]._id);
      }
    }
    UpdateStatus( ' Cleaned DB');
  }
  return;
}

function startServerProcess() {
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
      UpdateStatus(' Scheduler Started');
      var schedule = job.data; // Only one email per job

      // This will only be called if a 'runScheduler' job is obtained
      setSchedulerState('Running' );
      tsx_SetServerState('currentJob', job);

      job.log("Entered the scheduler process",
        {level: 'info'}
      );

      var isParked = '';
      // #TODO  reset all targets as isCloudy = false.

      while(
        // the job is used to run the scheduler.
        tsx_GetServerStateValue('currentJob') != ''
       ) {

         // tsxDebug('@6');
          tsx_MntUnpark();
          isParked = false;
          // tsxDebug('@7');

          // Find a session
          // Get the target to shoot
          tsxInfo( ' Validating Targets...');

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

          if (typeof target != 'undefined' && tsx_GetServerStateValue('currentJob') != '' ) {
            tsxLog ( ' =========================');
            tsxDebug ( ' ' + target.targetFindName + ' Preparing target...');

            // Point, Focus, Guide
            var ready = prepareTargetForImaging( target );
            if( ready ) {
              // target images per Take Series
              tsxLog ( ' =========================');
              tsxLog ( ' ************************1*');
              UpdateStatus ( ' *** Start imaging: ' + target.targetFindName );
              processTargetTakeSeries( target );
              tsxLog ( ' ************************2*');
            }
            else {
              ParkMount( isParked );
              isParked = true;
            }
          }
          else {
            ParkMount( isParked );
            isParked = true;
          }

          // See if there are calibration frames to do (Bias/Darl/Flats)
          var calFrames = findCalibrationSession(); // temp var

          // Check if sun is up and no cal frames
          if( (!isDarkEnough()) && (calFrames == '') && tsx_GetServerStateValue('currentJob') != '' ) {
            ParkMount( isParked );
            isParked = true;
            var approachingDawn = isTimeBeforeCurrentTime('3:00');
            tsxDebug( ' Is approachingDawn: ' + approachingDawn);
            // var stillDaytime = isTimeBeforeCurrentTime('15:00');
            // tsxDebug( ' Is stillDaytime: ' + stillDaytime);
            if( approachingDawn ) {
              var defaultFilter = tsx_GetServerStateValue('defaultFilter');
              var softPark = false;
              tsx_AbortGuider();
              tsx_MntPark(defaultFilter, softPark);
              UpdateStatus( ' Scheduler stopped: not dark.');
              UpdateStatus( ' ^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
              break;
            }
          }
          // check of cal frames and no target
          else if ( calFrames != '' && (typeof target == 'undefined') && tsx_GetServerStateValue('currentJob') != '' ) {
            for( var i = 0; i < calFrames.length; i++ ) {
                // process the
                // Need to prompt user to continuw...
                // If flat... put on panel
                // if Dark put on lense cover...
                processTargetTakeSeries( calFrames[i] );
            }
          }
      }

      tsxLog( ' Scheduler exited.');
      // While ended... exit process
      setSchedulerState('Stop' );
      UpdateStatus( ' Idle');
      // tsx_Disconnect();
      job.done();

      // Be sure to invoke the callback
      // when work on this job has finished
      cb();
    }
  );
  return scheduler.startJobServer();
}

Meteor.startup(() => {
  // code to run on server at startup
  // var logsItems = AppLogsDB.find({}).fetch();
  // for (var i in logsItems ) {
  //   var obj =  i;
  //   // Meteor._debug(obj);
    AppLogsDB.remove({});
  // }

  tsxLog(' ******* STARTED ******', '');

  var version_dat = {};
  version_dat = JSON.parse(Assets.getText('version.json'));
  if( version_dat.version != '') {
    tsx_SetServerState('tsx_version', version_dat.version);
    tsxLog(' Version', version_dat.version);
  }
  if( version_dat.date != '') {
    tsx_SetServerState('tsx_date', version_dat.date);
    tsxLog(' Date', version_dat.date);
  }
  tsxLog(' ', '');

  var dbIp = '';
  var dbPort = '';
  try {
    dbIp = TheSkyXInfos.findOne().ip() ;
  } catch( err ) {
    // do nothing
    tsx_SetServerState('ip', 'localhost');
    dbIp = 'localhost';
  }
  try {
    dbPort = TheSkyXInfos.findOne().port();
  } catch( err ) {
    // do nothing
    tsx_SetServerState('port', '3040');
    dbPort = '3040';
  }

  // removing so can start up easier without error.
  // var dbMinAlt = TheSkyXInfos.findOne().defaultMinAltitude();
  tsxLog('   IP',  dbIp );
  tsxLog(' port', dbPort );

  tsxLog(' ******* TSX_CMD ONLINE ******', '');
  CleanUpJobs();
  initServerStates();

  // Initialze the server on startup
  tsx_UpdateDevice('mount', 'Not connected ', '' );
  tsx_UpdateDevice('camera', 'Not connected ', '' );
  tsx_UpdateDevice('guider', 'Not connected ', '' );
  tsx_UpdateDevice('rotator', 'Not connected ', '' );
  tsx_UpdateDevice('efw', 'Not connected ', '' );
  tsx_UpdateDevice('focuser', 'Not connected ', '' );

  tsxLog( ' Logfile: ' + logFileForClient() );
  UpdateStatus( ' idle');
  tsxLog(' ******************', '');

  return;

});

function getSchedulerState() {
  var state = tsx_GetServerStateValue('scheduler_running');
  return state;
}

function setSchedulerState( value ) {
  tsx_SetServerState('scheduler_running', value);
}

export function srvStopScheduler() {
  CleanUpJobs();
  UpdateImagingSesionID( '' );
  tsx_SetServerState('SchedulerStatus', 'Stop');
  tsx_SetServerState('targetName', 'No Active Target');
  tsx_SetServerState('scheduler_report', '');
  tsx_AbortGuider();
  UpdateStatus(' *** Manually STOPPED scheduler ***');
  setSchedulerState('Stop' );
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
     tsxLog(' ***********************2*');
     // tsxLog('Found scheduler state: ' + getSchedulerState() );
     if(
       getSchedulerState() == 'Running'
     ) {
       tsxDebug("Running found");
       tsxLog('Scheduler is alreadying running. Nothing to do.');
       return;
     }
     else if(
        getSchedulerState() == 'Stop'
      ) {
        tsxDebug("Stop found");
        startServerProcess();

        // Confirm whether the there is a script running...
        if( !tsx_ServerIsOnline() ) {
          tsxLog('Check TSX... script running');
          UpdateStatus('Check TSX... script running');
          return;
        }

        tsxDebug( '@@ Start1' );
        // Create a job:
        var job = new Job(scheduler, 'runScheduler', // type of job
          // Job data that you define, including anything the job
          // needs to complete. May contain links to files, etc...
          {
            startTime: new Date(),
          }
        );
        tsxDebug( '@@ Start2' );

        // Set some properties of the job and then submit it
        // the same submit the start time to the scheduler...
        // at this time could add a tweet :)
        job.priority('normal');
        // .retry({ retries: 5,
        //   wait: 5*60*1000 }) //15*60*1000 })  // 15 minutes between attempts
        // .delay(0);// 60*60*1000)     // Wait an hour before first try

        var jid = job.save();               // Commit it to the server
        tsxDebug( '@@ Start1' );

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
       tsxDebug('Stopping');
       srvStopScheduler();
     }
     else {
       tsxInfo('Do nothing - Already Stopped');
     }
   },

   calibrateGuider() {
     tsxLog(' Calibrating AutoGuider');
     CalibrateAutoGuider();
   },

   rotateCamera() {
     tsxLog(' Rotating Camera');
     var num  = tsx_GetServerStateValue('tool_rotator_num');

     var res = tsx_RotateCamera( num );
     UpdateStatus( ' ' + res );

   },

   getUpdateTargetReport(target) {
     tsxLog( ' TargetReport: ' + target.targetFindName );
     var rpt = UpdateImagingTargetReport( target )
     return rpt;
   },

   updateServerState( name, value ) {
     var id = TheSkyXInfos.upsert( {name: name }, {
       $set: { value: value }
     })
     tsxInfo(' [Saved] ' +name+':'+value);
   },

   updateSeriesIdWith(
       id,
       name,
       value
      ) {

     tsxDebug(' ******************************* ');
     tsxDebug(' updateSeriesIdWith: ' + id + ', ' + name + ", " + value);
     if( name == 'order ') {
       tsxDebug('1');
       var res = Seriess.update( {_id: id }, {
         $set:{
           order: value,
         }
       });
     }
     else if (name == 'exposure' ) {
       tsxDebug('2');
       var res = Seriess.update( {_id: id }, {
         $set:{
           exposure: value,
         }
       });
     }
     else if (name == 'frame') {
       tsxDebug('3');
       var res = Seriess.update( {_id: id }, {
         $set:{
           frame: value,
         }
       });
     }
     else if (name=='filter') {
       tsxDebug('4');
       var res = Seriess.update( {_id: id }, {
         $set:{
           filter: value,
         }
       });
     }
     else if (name=='repeat') {
       tsxDebug('5');
       var res = Seriess.update( {_id: id }, {
         $set:{
           repeat: value,
         }
       });
     }
     else if (name=='binning') {
       tsxDebug('6');
       var res = Seriess.update( {_id: id }, {
         $set:{
           binning: value,
         }
       });
     }
   },

 });
