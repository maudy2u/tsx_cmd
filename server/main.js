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

import { tsxInfo, tsxLog, tsxErr, tsxWarn, tsxDebug } from '../imports/api/theLoggers.js';

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
} from './run_imageSession.js';

import { tsx_feeder, stop_tsx_is_waiting } from './tsx_feeder.js';

import {shelljs} from 'meteor/akasha:shelljs';

var schedulerRunning = 'Stop';

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
  tsx_SetServerState('mntMntDir', '');
  tsx_SetServerState('mntMntAlt', '');
  tsx_SetServerState('targetRA', '');
  tsx_SetServerState('targetDEC', '');
  tsx_SetServerState('targetALT', '');
  tsx_SetServerState('targetAZ', '');
  tsx_SetServerState('targetHA', '');
  tsx_SetServerState('targetTransit', '');
  tsx_SetServerState('lastTargetDirection', '');
  tsx_SetServerState('lastCheckMinSunAlt', '');
  tsx_SetServerState('lastFocusPos', '');
  tsx_SetServerState('lastFocusTemp', '');
  tsx_SetServerState('initialFocusTemperature', '');
  tsx_SetServerState('imagingSessionDither', 0);

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

  // Clean up the scheduler process collections...
  // Persistence across reboots is not needed at this time.
  tsxDebug('Number of Jobs found: ' + jobs.length);
  if( jobs.length > 0 ) {
    UpdateStatus( ' Cleaning up DB.');
  }
  for (var i = 0; i < jobs.length; i++) {
    if( typeof jobs[i] != 'undefined') {
      scheduler.remove(jobs[i]._id);
    }
  }
}

Meteor.startup(() => {
  // code to run on server at startup
  tsxLog(' ******************', '');
  tsxLog(' STARTED', '');
  tsxLog(' ******************', '');

  CleanUpJobs();

  initServerStates();

  // Initialze the server on startup
  tsx_UpdateDevice('mount', 'Not connected ', '' );
  tsx_UpdateDevice('camera', 'Not connected ', '' );
  tsx_UpdateDevice('guider', 'Not connected ', '' );
  tsx_UpdateDevice('rotator', 'Not connected ', '' );
  tsx_UpdateDevice('efw', 'Not connected ', '' );
  tsx_UpdateDevice('focuser', 'Not connected ', '' );

  var dbIp = TheSkyXInfos.findOne().ip() ;
  var dbPort = TheSkyXInfos.findOne().port();
  // removing so can start up easier without error.
  // var dbMinAlt = TheSkyXInfos.findOne().defaultMinAltitude();
  if( (typeof dbIp != 'undefined') && (typeof dbPort != 'undefined') ) {
    tsxLog(' TSX server   IP: ',  dbIp );
    tsxLog(' TSX server port: ', dbPort );

  };
  tsxLog(' ******* TSX_CMD ONLINE ******', '');


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
      var schedule = job.data; // Only one email per job

      // This will only be called if a 'runScheduler' job is obtained
      setSchedulerState('Running' );
      tsx_SetServerState('currentJob', job);
      UpdateStatus(' Scheduler Started');

      job.log("Entered the scheduler process",
        {level: 'info'}
      );

      var isParked = '';
      // #TODO  reset all targets as isCloudy = false.

      while(
        // the job is used to run the scheduler.
        tsx_GetServerStateValue('currentJob') != ''
        // THis is used for the session... not for the job.
        //        && tsx_GetServerStateValue( tsx_ServerStates.imagingSessionId ) != ''
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

          var target = getValidTargetSession(); // no return

          if (typeof target != 'undefined') {
            tsxLog ( ' =========================');
            tsxDebug ( ' ' + target.targetFindName + ' Preparing target...');

            // Point, Focus, Guide
            var ready = prepareTargetForImaging( target );
            if( ready ) {
              // target images per Take Series
              tsxLog ( ' =========================');
              tsxLog ( ' *************************');
              UpdateStatus ( ' *** Start imaging: ' + target.targetFindName );
              processTargetTakeSeries( target );
              tsxLog ( ' *************************');
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
          if( !isDarkEnough() ) {
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
  // *******************************
  //   update client reports/status
  // *******************************
  workers = scheduler.processJobs( 'updateClientData',
    function (job, cb) {
      var info = job.data; // Only one email per job
      // This will only be called if a
      // 'runScheduler' job is obtained
      // tsxLog('updateClientData');
      job.log("Entered updateClientData",
        {level: 'info'});

      // While ended... exit process
      UpdateStatus( ' ' + info.status );
      // tsx_Disconnect();
      job.done();

      // Be sure to invoke the callback
      // when work on this job has finished
      cb();
    }
  );
  workers = scheduler.processJobs( 'updateProgressMessage',
    function (job, cb) {
      var info = job.data; // Only one email per job
      tsx_SetServerState('tsx_message', info.message );
      // tsxLog('updateProgressMessage');
      // tsx_Disconnect();
      job.done();

      // Be sure to invoke the callback
      // when work on this job has finished
      cb();
    }
  );
  workers = scheduler.processJobs( 'updateProgressIncrement',
    function (job, cb) {
      var info = job.data; // Only one email per job
      tsx_SetServerState('tsx_progress', info.progress );
      // tsxLog('updateProgressIncrement');
      job.done();

      // Be sure to invoke the callback
      // when work on this job has finished
      cb();
    }
  );
  workers = scheduler.processJobs( 'updateProgressTotal',
    function (job, cb) {
      var info = job.data; // Only one email per job
      tsx_SetServerState('tsx_total', info.total );
      // tsxLog('updateProgressTotal');
      // tsx_Disconnect();
      job.done();

      // Be sure to invoke the callback
      // when work on this job has finished
      cb();
    }
  );
  // *******************************
  //   Manage Cooling and Warming camera
  // *******************************
  workers = scheduler.processJobs( 'manageCameraTemp',
    function (job, cb) {
      var schedule = job.data; // Only one email per job
      // This will only be called if a
      // 'manageCameraTemp' job is obtained
      // tsxLog('manageCameraTemp');
      // job.log("Entered manageCameraTemp",
      //   {level: 'info'});

      // tsx_Disconnect();
      job.done();

      // Be sure to invoke the callback
      // when work on this job has finished
      cb();
    }
  );
  workers = scheduler.processJobs( 'PostImageProcessUpdate',
    function (job, cb) {
      var schedule = job.data; // Only one email per job
      // This will only be called if a
      // 'runScheduler' job is obtained
      tsxDebug('PostImageProcessUpdate');
      // job.log("Entered PostImageProcessUpdate",
        // {level: 'info'});


      // tsx_Disconnect();
      job.done();

      // Be sure to invoke the callback
      // when work on this job has finished
      cb();
    }
  );

  // *******************************
  //   Start processes
  // *******************************
  // start server for scheduler and wait
  UpdateStatus( ' idle');
  return scheduler.startJobServer();

});

function getSchedulerState() {
  return schedulerRunning;
}

function setSchedulerState( value ) {
  schedulerRunning = value;
}

// The pause method should cancel the currentJob
// and recreate a new job...
export function srvPauseScheduler() {
  var jid = tsx_GetServerStateValue('currentJob');
  scheduler.getJob(jid, function (err, job) {
    job.pause(function (err, result) {
      tsxDebug('scheduler Paused job');
      if (result) {
        // Status updated
        tsxDebug('Result ' + result);
      }
      if (err) {
        // Status updated
        tsxDebug('Error ' + err);
      }
    }); // assumes it is the take series that is being PAUSED

   });

  setSchedulerState('Pause' );
  tsxDebug('Manually PAUSED scheduler');
}

export function srvStopScheduler() {
  var dummyVar;
  // Any job document from myJobs can be turned into a Job object
  CleanUpJobs();
  setSchedulerState('Stop' );
  tsx_SetServerState('SchedulerStatus', 'Stop');
  tsx_SetServerState('currentJob', '');
  UpdateImagingSesionID( '' );
  tsx_AbortGuider();
  UpdateStatus(' *** Manually STOPPED scheduler ***');
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
     tsxLog(' ************************');
     // tsxLog('Found scheduler state: ' + getSchedulerState() );
     if(
       // If PAUSED... reset state to Running
       getSchedulerState() == 'Pause'
     ) {
       var job = new Job(scheduler, scheduler.findOne({}));
       job.resume();
       setSchedulerState( 'Running' );
       return;
     }
      // if already running, just return and update state
     else if(
       getSchedulerState() == 'Running'
     ) {
       tsxLog('Scheduler is alreadying running. Nothing to do.');
       return;
     }
     else if(
        getSchedulerState() == 'Stop'
      ) {

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
       logCon.error('Invalid state found for scheduler.');
     }
   },

   pauseScheduler() {
     if( getSchedulerState() != 'Stop') {
       tsxDebug('Pausing');
       srvPauseScheduler();
     }
     else {
       tsxDebug('Do nothing - not Paused');
     }
   },

   stopScheduler() {
     // if( getSchedulerState() != 'Stop' ) {
       tsxDebug('Stopping');
       srvStopScheduler();
     // }
     // else {
       // tsxDebug('Do nothing - not Stopped');
     // }
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
