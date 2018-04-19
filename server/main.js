import { Meteor } from 'meteor/meteor';
import { JobCollection } from 'meteor/vsivsi:job-collection';

import { TargetSessions } from '../imports/api/targetSessions.js';
import { TakeSeriesTemplates } from '../imports/api/takeSeriesTemplates.js';
import { Seriess } from '../imports/api/seriess.js';
import { Filters } from '../imports/api/filters.js';
import { TheSkyXInfos } from '../imports/api/theSkyXInfos.js';

import {
  tsx_ServerStates,
  tsx_SetServerState,
  tsx_GetServerState,
  tsx_UpdateDevice,
  tsx_GetServerStateValue,
} from '../imports/api/serverStates.js';

import {
  tsx_Connect,
  tsx_Disconnect,
  tsx_MntPark,
  getValidTargetSession,
  prepareTargetForImaging,
  processTargetTakeSeries,
} from './run_imageSession.js';

import { tsx_feeder, stop_tsx_is_waiting } from './tsx_feeder.js';

import {shelljs} from 'meteor/akasha:shelljs';

var tsxHeader =  '/* Java Script *//* Socket Start Packet */';
var tsxFooter = '/* Socket End Packet */';

var schedulerRunning = 'Stop';
var isSchedulerRunning = true;

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
  for (var m in tsx_ServerStates){
    var state = tsx_ServerStates[m];
    try {
      var isDefined = TheSkyXInfos.findOne({name: state });
      console.log(state +'='+ isDefined.value);
    } catch (e) {
        console.log('Initialized: ' + state);
        tsx_SetServerState(state, '');
    } finally {
      // console.log('Ready: ' + state);
      tsx_SetServerState('targetName', '');
      tsx_SetServerState('targetRA', '');
      tsx_SetServerState('targetDEC', '');
      tsx_SetServerState('targetALT', '');
      tsx_SetServerState('targetAZ', '');
      tsx_SetServerState('targetHA', '');
      tsx_SetServerState('targetTransit', '');
    }
  }
}

// *******************************
// Create the scheduler Queue
var scheduler = JobCollection('theScheduler');
//scheduler.setLogStream(process.stdout);

Meteor.startup(() => {
  // code to run on server at startup
  console.log(' ******************');

  initServerStates();
  console.log(' RESTARTED');
  console.log(' ******************');

  // Initialze the server on startup
  tsx_SetServerState(tsx_ServerStates.currentStage, 'idle');
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
    console.log('TSX server set to IP: ' + dbIp );
    console.log('TSX server set to port: ' + dbPort );

  };

  // get rid of any old processes/jobs
  var jobs = scheduler.find().fetch();
  console.log('Number of Jobs found: ' + jobs.length);
  for (var i = 0; i < jobs.length; i++) {
    if( typeof jobs[i] != 'undefined') {
      // JobCollection.remove(jobs[i]._id);
      // jobs[i].cancel();
      // jobs[i].remove();
    }
  }

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
      console.log('Scheduler is running.');
      job.log("Entered the scheduler process",
        {level: 'warning'});
      /*
      // Start up the scheduler's search for something to do
      // This is a sample of the returning issues if the scheduler
      // fails. The assumption is the scheduler processing the
      // tsx_ functions.
      // runScheduler(schedule.startTime,
      //   function(err) {
      //     if (err) {
      //       job.log("Sending failed with error" + err,
      //         {level: 'warning'});
      //       job.fail("" + err);
      //     } else {
      //       job.done();
      //     }
      Question: how to handle processing and waiting for a validSession...

      */
      var isParked = false;
      while(
        getSchedulerState() == 'Running'
      ) {
        // Find a session
        console.log('Scheduler seeking valid targetSession');
        // console.log('job: ' + job.doc.created);
        job.log("Started the scheduler",
          {level: 'warning'});

        // Get the target to shoot
        tsx_SetServerState(tsx_ServerStates.currentStage, ' Checking Targets...');
        tsx_Connect();
        var target = getValidTargetSession(); // no return

        if (typeof target != 'undefined') {
          isParked = false;
          tsx_SetServerState(tsx_ServerStates.currentStage, ' Found...');

          // Point, Focus, Guide
          prepareTargetForImaging( target );

          // target images per Take Series
          processTargetTakeSeries( target );

        }
        else {
          if( !isParked ) {
            console.log('No valid sessions - parking');
            var defaultFilter = tsx_GetServerStateValue('defaultFilter');
            var softPark = Boolean(tsx_GetServerStateValue('defaultSoftPark'));
            tsx_SetServerState(tsx_ServerStates.currentStage, 'Parking...');
            tsx_MntPark(defaultFilter, softPark);
            tsx_Disconnect();
          }
          isParked = true;
          console.log('about to sleep');
          var sleepTime = tsx_GetServerStateValue('defaultSleepTime');
          console.log('Waiting...: ' + sleepTime);
          tsx_SetServerState(tsx_ServerStates.currentStage, 'Waiting...');
          Meteor.sleep(sleepTime*60*1000); // Sleep for ms
          console.log('Finished sleep');
          tsx_SetServerState(tsx_ServerStates.currentStage, 'Checking...');
        }
      }

      // While ended... exit process
      job.done();

      // Be sure to invoke the callback
      // when work on this job has finished
      cb();
    }
  );


  var javx = new Job(scheduler, 'cleanup', {})
       .repeat({ schedule: scheduler.later.parse.text("every 5 minutes") })
       .save({cancelRepeats: true});

  var cleaning = scheduler.processJobs( 'cleanup', { pollInterval: false, workTimeout: 60*1000 },
    function (job, cb) {
       var current = new Date();
       current.setMinutes(current.getMinutes() - 5);
       var ids = scheduler.find({
          status: Job.jobStatusRemovable,
          updated: current},
          {fields: { _id: 1 }}).map((d) =>{
            return d._id;
          });
       if (ids.length > 0) {
         scheduler.removeJobs(ids)
       }
       //console.warn "Removed #{ids.length} old jobs"
       job.done("Removed #{ids.length} old jobs");
       cb();
  });
  scheduler.find({ type: 'cleanup', status: 'ready' })
       .observe
          added: () =>
             q.trigger();

  // start server for scheduler and wait
  return scheduler.startJobServer();

});

function getSchedulerState() {
  return schedulerRunning;
}

function setSchedulerState( value ) {
  schedulerRunning = value;
}

function isSchedulerRunning() {
  return isSchedulerRunning;
}

export function srvPlayScheduler ( callback ) {
  console.log('Scheduler STARTING' );
  callback();
}

export function srvPauseScheduler() {
  var jid = tsx_GetServerState('currentJob');
  scheduler.getJob(jid, function (err, job) {
    job.pause(function (err, result) {
      console.log('scheduler Paused job');
      if (result) {
        // Status updated
        console.log('Result ' + result);
      }
      if (err) {
        // Status updated
        console.log('Error ' + err);
      }
    }); // assumes it is the take series that is being PAUSED

   });

  setSchedulerState('Pause' );
  console.log('Manually PAUSED scheduler');
}

export function srvStopScheduler() {
  var dummyVar;
  // Any job document from myJobs can be turned into a Job object
  setSchedulerState('Stop' );
  tsx_SetServerState('SchedulerStatus', 'Stop');
  var jid = tsx_GetServerState('currentJob');
  scheduler.getJob(jid, function (err, job) {
    job.cancel(function (err, result) {
      console.log('scheduler canceled job');
      if (result) {
        // Status updated
        console.log('Cancel Result ' + result);
      }
      if (err) {
        // Status updated
        console.log('Cancel Error ' + err);
      }
    });
    job.remove(function (err, result) {
      console.log('scheduler removed job');
      if (result) {
        // Status updated
        console.log('Remove Result ' + result);
      }
      if (err) {
        // Status updated
        console.log('Remove Error ' + err);
      }
      // Now remove the job id from scheduler
      // we should not be running anything
      var jid = tsx_SetServerState('currentJob', '');
    });
    // force tsx_feeder to stop...
    stop_tsx_is_waiting();

   });
  console.log('Manually STOPPED scheduler');
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
     console.log('Found scheduler state: ' + isSchedulerRunning );
     if(
       // If PAUSED... reset state to Running
       getSchedulerState() == 'Pause'
       && isSchedulerRunning == true
     ) {
       var job = new Job(scheduler, scheduler.findOne({}));
       job.resume();
       setSchedulerState( 'Running' );
     }
      // if already running, just return and update state
     else if(
       getSchedulerState() == 'Running'
       && isSchedulerRunning == true ) {
       console.log('Scheduler is alreadying running. Nothing to do.');
       return;
     }
     else if(
       getSchedulerState() == 'Stop'
       || isSchedulerRunning == false ) {

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
      job.priority('normal')
        .retry({ retries: 5,
          wait: 5*60*1000 }) //15*60*1000 })  // 15 minutes between attempts
        .delay(0);// 60*60*1000)     // Wait an hour before first try
      var jid = job.save();               // Commit it to the server

      console.log('Job id: ' + jid);
      tsx_SetServerState('currentJob', jid);
     }
     else {
       console.log('Invalid state found for scheduler.');
     }
     console.log('Scheduler Started');
   },

   pauseScheduler() {
     if( getSchedulerState() != 'Stop') {
       console.log('Pausing');
       srvPauseScheduler();
     }
     else {
       console.log('Do nothing - not Paused');
     }
   },

   stopScheduler() {
     // if( getSchedulerState() != 'Stop' ) {
       console.log('Stopping');
       srvStopScheduler();
     // }
     // else {
       // console.log('Do nothing - not Stopped');
     // }
   },

   updateSeriesIdWith(
       id,
       name,
       value,
     ) {

     console.log(' ******************************* ');
     console.log(' updateSeriesIdWith: ' + id + ', ' + name + ", " + value);
     if( name == 'order ') {
       console.log('1');
       var res = Seriess.update( {_id: id }, {
         $set:{
           order: value,
         }
       });
     }
     else if (name == 'exposure' ) {
       console.log('2');
       var res = Seriess.update( {_id: id }, {
         $set:{
           exposure: value,
         }
       });
     }
     else if (name == 'frame') {
       console.log('3');
       var res = Seriess.update( {_id: id }, {
         $set:{
           frame: value,
         }
       });
     }
     else if (name=='filter') {
       console.log('4');
       var res = Seriess.update( {_id: id }, {
         $set:{
           filter: value,
         }
       });
     }
     else if (name=='repeat') {
       console.log('5');
       var res = Seriess.update( {_id: id }, {
         $set:{
           repeat: value,
         }
       });
     }
     else if (name=='binning') {
       console.log('6');
       var res = Seriess.update( {_id: id }, {
         $set:{
           binning: value,
         }
       });
     }
   },

   serverSideText() {
     console.log(
       '*******************************'
     );

     var filename = '/home/stellarmate/tsx_cmd/api/tsx/SkyX_JS_CLS.js';
    filename = '../api/tsx/SkyX_JS_CLS.js';
    filename = '~/tsx_cmd/api/tsx/SkyX_JS_CLS.js';
    filename = '/Users/stephen/Documents/code/tsx_cmd/imports/tsx/SkyX_JS_CLS.js';


     console.log('Loading file: ' + filename);
     var shell = require('shelljs');

     var str = shell.cat(filename);
     // console.log(str);
     // console.log(filename);

     var testStr = new String("/* this is a test*/ var b=$0000;batman;$0001");
     console.log('Test var: ' + testStr);
     testStr = testStr.replace("$0000", "var=test;");
     testStr = testStr.replace("$0001", '99999999999999');
     console.log('Result:   ' + testStr);

     //console.log(str);
     console.log(
      '*******************************'
    );
   },

 });
