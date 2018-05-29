import { Meteor } from 'meteor/meteor';

import { Logger }     from 'meteor/ostrio:logger';
import { LoggerFile } from 'meteor/ostrio:loggerfile';

import { TargetSessions } from '../imports/api/targetSessions.js';
import { TakeSeriesTemplates } from '../imports/api/takeSeriesTemplates.js';
import { Seriess } from '../imports/api/seriess.js';
import { Filters } from '../imports/api/filters.js';
import { TheSkyXInfos } from '../imports/api/theSkyXInfos.js';
import { scheduler } from '../imports/api/theProcessors.js';

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
  // tsx_SetServerState('targetName', '');
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
  tsx_SetServerState('imagingSessionDither', 0);

  for (var m in tsx_ServerStates){
    var state = tsx_ServerStates[m];
    try {
      var isDefined = TheSkyXInfos.findOne({name: state });
      Meteor._debug(state +'='+ isDefined.value);
    } catch (e) {
        Meteor._debug('Initialized: ' + state);
        tsx_SetServerState(state, '');
    } finally {
    }
  }
}

Meteor.startup(() => {
  // code to run on server at startup
  Meteor._debug(' ******************');

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
  Meteor._debug('Number of Jobs found: ' + jobs.length);
  for (var i = 0; i < jobs.length; i++) {
    if( typeof jobs[i] != 'undefined') {
      scheduler.remove(jobs[i]._id);
      // jobs[i].remove(function (err, result) {
      //   if (result) {
      //     // Job removed from server.
      //     Meteor._debug('job removed');
      //   }
      // });
    }
  }

  initServerStates();

  // Initialze the server on startup
  UpdateStatus( 'idle');
  tsx_UpdateDevice('mount', 'Not connected ', '' );
  tsx_UpdateDevice('camera', 'Not connected ', '' );
  tsx_UpdateDevice('guider', 'Not connected ', '' );
  tsx_UpdateDevice('rotator', 'Not connected ', '' );
  tsx_UpdateDevice('efw', 'Not connected ', '' );
  tsx_UpdateDevice('focuser', 'Not connected ', '' );

  var dbIp = TheSkyXInfos.findOne().ip() ;
  var dbPort = TheSkyXInfos.findOne().port();
  var dbMinAlt = TheSkyXInfos.findOne().defaultMinAltitude();
  if( (typeof dbIp != 'undefined') && (typeof dbPort != 'undefined') ) {
    Meteor._debug('TSX server set to IP: ' + dbIp );
    Meteor._debug('TSX server set to port: ' + dbPort );

  };
  Meteor._debug(' RESTARTED');
  Meteor._debug(' ******************');


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
      // This will only be called if a
      // 'runScheduler' job is obtained
      setSchedulerState('Running' );
      Meteor._debug('Scheduler is running.');
      job.log("Entered the scheduler process",
        {level: 'info'});

      var isParked = false;
      // tsx_Connect();
      while(
        // the job is used to run the scheduler.
        tsx_GetServerStateValue('currentJob') != ''
        // THis is used for the session... not for the job.
        //        && tsx_GetServerStateValue( tsx_ServerStates.imagingSessionId ) != ''
       ) {
        // Find a session
        Meteor._debug('Seeking target');

        // Get the target to shoot
        UpdateStatus( ' Checking Targets...');
        var target = getValidTargetSession(); // no return

        if (typeof target != 'undefined') {
          isParked = false;
          UpdateStatus ( ' Preparing target...');

          // Point, Focus, Guide
          var ready = prepareTargetForImaging( target );
          if( ready ) {
            // target images per Take Series
            UpdateStatus ( ' Starting imaging...');
            processTargetTakeSeries( target );
          }
          else {

          }
        }
        else {
          if( !isParked ) {
            Meteor._debug('No valid sessions - parking');
            var defaultFilter = tsx_GetServerStateValue('defaultFilter');
            var softPark = Boolean(tsx_GetServerStateValue('defaultSoftPark'));
            UpdateStatus( 'Parking...');
            tsx_AbortGuider();
            tsx_MntPark(defaultFilter, softPark);
          }
          isParked = true;
          var sleepTime = tsx_GetServerStateValue('defaultSleepTime');
          UpdateStatus( '  No valid target, waiting...');
          Meteor._debug( ' Waiting...: ' + sleepTime + 'min');
          var timeout = 0;
          var msSleep = Number(sleepTime); // number of seconds
          postProgressTotal(sleepTime);
          postProgressMessage('Waiting ~' + sleepTime + 'min.');
          while( timeout < msSleep) { //
            if( tsx_GetServerStateValue('currentJob') == '' ) {
              UpdateStatus( ' Canceled sessions');
              break;
            }
            var min = 1000*60; // one minute in milliseconds
            Meteor.sleep( min );
            timeout = timeout + 1;
            postProgressIncrement( timeout );
          }
          postProgressTotal(0);
          postProgressIncrement( 0 );
          postProgressMessage('Processing');
          Meteor._debug('Finished sleep');
        }
      }

      // While ended... exit process
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
      // Meteor._debug('updateClientData');
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
      // Meteor._debug('updateProgressMessage');
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
      // Meteor._debug('updateProgressIncrement');
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
      // Meteor._debug('updateProgressTotal');
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
      // 'runScheduler' job is obtained
      // Meteor._debug('manageCameraTemp');
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
      Meteor._debug('PostImageProcessUpdate');
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
  return scheduler.startJobServer();
});

function getSchedulerState() {
  return schedulerRunning;
}

function setSchedulerState( value ) {
  schedulerRunning = value;
}

export function srvPlayScheduler ( callback ) {
  Meteor._debug('Scheduler STARTING' );
  callback();
}

// The pause method should cancel the currentJob
// and recreate a new job...
export function srvPauseScheduler() {
  var jid = tsx_GetServerStateValue('currentJob');
  scheduler.getJob(jid, function (err, job) {
    job.pause(function (err, result) {
      Meteor._debug('scheduler Paused job');
      if (result) {
        // Status updated
        Meteor._debug('Result ' + result);
      }
      if (err) {
        // Status updated
        Meteor._debug('Error ' + err);
      }
    }); // assumes it is the take series that is being PAUSED

   });

  setSchedulerState('Pause' );
  Meteor._debug('Manually PAUSED scheduler');
}

export function srvStopScheduler() {
  var dummyVar;
  // Any job document from myJobs can be turned into a Job object
  setSchedulerState('Stop' );
  tsx_SetServerState('SchedulerStatus', 'Stop');
  var jid = tsx_GetServerStateValue('currentJob');
  scheduler.remove( jid );
  tsx_SetServerState('currentJob', '');
  UpdateImagingSesionID( '' );

  Meteor._debug('Manually STOPPED scheduler');
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
     Meteor._debug('************************');
     Meteor._debug('Found scheduler state: ' + getSchedulerState() );
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
       Meteor._debug('Scheduler is alreadying running. Nothing to do.');
       return;
     }
     else if(
        getSchedulerState() == 'Stop'
      ) {

        // Confirm whether the there is a script running...
        if( !tsx_ServerIsOnline() ) {
          Meteor._debug('Check TSX... script running');
          UpdateStatus('Check TSX... script running');
          return;
        }

        // Create a job:
        var job = new Job(scheduler, 'runScheduler', // type of job
          // Job data that you define, including anything the job
          // needs to complete. May contain links to files, etc...
          {
            startTime: new Date(),
          }
        );

        // Set some properties of the job and then submit it
        // the same submit the start time to the scheduler...
        // at this time could add a tweet :)
        job.priority('normal');
        // .retry({ retries: 5,
        //   wait: 5*60*1000 }) //15*60*1000 })  // 15 minutes between attempts
        // .delay(0);// 60*60*1000)     // Wait an hour before first try
        var jid = job.save();               // Commit it to the server

        Meteor._debug('Job id: ' + jid);
        tsx_SetServerState('currentJob', jid);
        Meteor._debug('Scheduler Started');
        UpdateStatus('Scheduler Started');
        return;
     }
     else {
       Meteor._debug('Invalid state found for scheduler.');
     }
   },

   pauseScheduler() {
     if( getSchedulerState() != 'Stop') {
       Meteor._debug('Pausing');
       srvPauseScheduler();
     }
     else {
       Meteor._debug('Do nothing - not Paused');
     }
   },

   stopScheduler() {
     // if( getSchedulerState() != 'Stop' ) {
       Meteor._debug('Stopping');
       srvStopScheduler();
     // }
     // else {
       // Meteor._debug('Do nothing - not Stopped');
     // }
   },

   updateServerState( name, value ) {
     var id = TheSkyXInfos.upsert( {name: name }, {
       $set: { value: value }
     })
     // Meteor._debug('updated: ' +name+':'+value);
   },

   updateSeriesIdWith(
       id,
       name,
       value
      ) {

     Meteor._debug(' ******************************* ');
     Meteor._debug(' updateSeriesIdWith: ' + id + ', ' + name + ", " + value);
     if( name == 'order ') {
       Meteor._debug('1');
       var res = Seriess.update( {_id: id }, {
         $set:{
           order: value,
         }
       });
     }
     else if (name == 'exposure' ) {
       Meteor._debug('2');
       var res = Seriess.update( {_id: id }, {
         $set:{
           exposure: value,
         }
       });
     }
     else if (name == 'frame') {
       Meteor._debug('3');
       var res = Seriess.update( {_id: id }, {
         $set:{
           frame: value,
         }
       });
     }
     else if (name=='filter') {
       Meteor._debug('4');
       var res = Seriess.update( {_id: id }, {
         $set:{
           filter: value,
         }
       });
     }
     else if (name=='repeat') {
       Meteor._debug('5');
       var res = Seriess.update( {_id: id }, {
         $set:{
           repeat: value,
         }
       });
     }
     else if (name=='binning') {
       Meteor._debug('6');
       var res = Seriess.update( {_id: id }, {
         $set:{
           binning: value,
         }
       });
     }
   },

 });
