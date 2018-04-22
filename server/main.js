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
  UpdateStatus,
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
  tsx_SetServerState('mntMntDir', '');
  tsx_SetServerState('mntMntAlt', '');
  tsx_SetServerState('targetName', '');
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

// *******************************
// Create the scheduler Queue
var scheduler = JobCollection('theScheduler');
//scheduler.setLogStream(process.stdout);

Meteor.startup(() => {
  // code to run on server at startup
  Meteor._debug(' ******************');
  // get rid of any old processes/jobs
  var jobs = scheduler.find().fetch();
  var jid = tsx_GetServerStateValue('currentJob');
  scheduler.remove( jid );
  tsx_SetServerState('currentJob', '');

  Meteor._debug('Number of Jobs found: ' + jobs.length);
  for (var i = 0; i < jobs.length; i++) {
    if( typeof jobs[i] != 'undefined') {
      // JobCollection.remove(jobs[i]._id);
      // jobs[i].cancel();
      // jobs[i].remove();
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
      while(
        tsx_GetServerStateValue('currentJob') != ''
      ) {
        // Find a session
        Meteor._debug('Seeking target');

        // Get the target to shoot
        UpdateStatus( ' Checking Targets...');
        tsx_Connect();
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
            tsx_MntPark(defaultFilter, softPark);
            tsx_Disconnect();
          }
          isParked = true;
          var sleepTime = tsx_GetServerStateValue('defaultSleepTime');
          Meteor._debug(' Waiting...: ' + sleepTime + 'min');
          UpdateStatus( ' Waiting...: ' + sleepTime + 'min');
          var timeout = 0;
          while( timeout < sleepTime*60*1000) {
            if( tsx_GetServerStateValue('currentJob') != '' ) {
              break;
            } 
            Meteor.sleep(1000); // Sleep for ms
            timeout = timeout+1000;
          }
          Meteor._debug('Finished sleep');
        }
      }

      // While ended... exit process
      UpdateStatus( ' Idle');
      job.done();

      // Be sure to invoke the callback
      // when work on this job has finished
      cb();
    }
  );


  // var javx = new Job(scheduler, 'cleanup', {})
  //      .repeat({ schedule: scheduler.later.parse.text("every 5 minutes") })
  //      .save({cancelRepeats: true});
  //
  // var cleaning = scheduler.processJobs( 'cleanup', { pollInterval: false, workTimeout: 60*1000 },
  //   function (job, cb) {
  //      var current = new Date();
  //      current.setMinutes(current.getMinutes() - 5);
  //      var ids = scheduler.find({
  //         status: Job.jobStatusRemovable,
  //         updated: current},
  //         {fields: { _id: 1 }}).map((d) =>{
  //           return d._id;
  //         });
  //      if (ids.length > 0) {
  //        scheduler.removeJobs(ids)
  //      }
  //      //console.warn "Removed #{ids.length} old jobs"
  //      job.done("Removed #{ids.length} old jobs");
  //      cb();
  // });
  // scheduler.find({ type: 'cleanup', status: 'ready' })
  //      .observe
  //         added: () =>
  //            q.trigger();

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
     Meteor._debug('Found scheduler state: ' + isSchedulerRunning );
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
       Meteor._debug('Scheduler is alreadying running. Nothing to do.');
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
      job.priority('normal');
        // .retry({ retries: 5,
        //   wait: 5*60*1000 }) //15*60*1000 })  // 15 minutes between attempts
        // .delay(0);// 60*60*1000)     // Wait an hour before first try
      var jid = job.save();               // Commit it to the server

      Meteor._debug('Job id: ' + jid);
        tsx_SetServerState('currentJob', jid);
     }
     else {
       Meteor._debug('Invalid state found for scheduler.');
     }
     Meteor._debug('Scheduler Started');
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

   updateSeriesIdWith(
       id,
       name,
       value,
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

   serverSideText() {
     Meteor._debug(
       '*******************************'
     );

     var filename = '/home/stellarmate/tsx_cmd/api/tsx/SkyX_JS_CLS.js';
    filename = '../api/tsx/SkyX_JS_CLS.js';
    filename = '~/tsx_cmd/api/tsx/SkyX_JS_CLS.js';
    filename = '/Users/stephen/Documents/code/tsx_cmd/imports/tsx/SkyX_JS_CLS.js';


     Meteor._debug('Loading file: ' + filename);
     var shell = require('shelljs');

     var str = shell.cat(filename);
     // Meteor._debug(str);
     // Meteor._debug(filename);

     var testStr = new String("/* this is a test*/ var b=$0000;batman;$0001");
     Meteor._debug('Test var: ' + testStr);
     testStr = testStr.replace("$0000", "var=test;");
     testStr = testStr.replace("$0001", '99999999999999');
     Meteor._debug('Result:   ' + testStr);

     //Meteor._debug(str);
     Meteor._debug(
      '*******************************'
    );
   },

 });
