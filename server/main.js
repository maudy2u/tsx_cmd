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
  getValidTargetSession,
  string_replace,
  prepareTargetForImaging,
  tsx_MntPark,
  processTarget,
} from './run_imageSession.js';

import { tsx_feeder } from './tsx_feeder.js';

import {shelljs} from 'meteor/akasha:shelljs';

var nBExposure = 8;
var lrgbExposure = 3;

var takeSeries1 = new Map();
// LUM
takeSeries1.set( "order", 0);
takeSeries1.set("exposure", lrgbExposure );
takeSeries1.set("binning",  1 );
takeSeries1.set("frame", 'Light' );
takeSeries1.set("filter", 'LUM' );
takeSeries1.set("repeat", 33 );
// R Imaging
var takeSeries2 = new Map();
takeSeries2.set( "order", 1);
takeSeries2.set("exposure", lrgbExposure );
takeSeries2.set("binning",  1 );
takeSeries2.set("frame", 'Light' );
takeSeries1.set("filter", 'R' );
takeSeries2.set("repeat", 33 );
// G
var takeSeries3 = new Map();
takeSeries3.set( "order", 2);
takeSeries3.set("exposure", lrgbExposure );
takeSeries3.set("binning",  1 );
takeSeries3.set("frame", 'Light' );
takeSeries3.set("filter", 'G' );
takeSeries3.set("repeat", 33 );
// B
var takeSeries4 = new Map();
takeSeries4.set( "order", 3);
takeSeries4.set("exposure", lrgbExposure );
takeSeries4.set("binning",  1 );
takeSeries4.set("frame", 'Light' );
takeSeries3.set("filter", 'B' );
takeSeries4.set("repeat", 33 );
// Ha
var takeSeries5 = new Map();
takeSeries5.set( "order", 0);
takeSeries5.set("exposure", nBExposure );
takeSeries5.set("binning",  1 );
takeSeries5.set("frame", 'Light' );
takeSeries3.set("filter", 'Ha' );
takeSeries5.set("repeat", 33 );
// OIII
var takeSeries6 = new Map();
takeSeries6.set( "order", 1);
takeSeries6.set("exposure", nBExposure );
takeSeries6.set("binning",  1 );
takeSeries6.set("frame", 'Light' );
takeSeries3.set("filter", 'OIII' );
takeSeries6.set("repeat", 33 );
// SII
var takeSeries7 = new Map();
takeSeries7.set( "order", 2);
takeSeries7.set("exposure", nBExposure );
takeSeries7.set("binning",  1 );
takeSeries7.set("frame", 'Light' );
takeSeries3.set("filter", 'SII' );
takeSeries7.set("repeat", 33 );

var testTakeSeries1 = [];
testTakeSeries1.push(takeSeries1);
testTakeSeries1.push(takeSeries2);
testTakeSeries1.push(takeSeries3);
testTakeSeries1.push(takeSeries4);

var testTakeSeries2 = [];
testTakeSeries2.push(takeSeries5);
testTakeSeries2.push(takeSeries6);
testTakeSeries2.push(takeSeries7);

var testTakeSeriesTemplate1 = new Map();
testTakeSeriesTemplate1.set("name", "LRGB - example");
testTakeSeriesTemplate1.set("description", "Example test");
testTakeSeriesTemplate1.set("processSeries", "across series");
testTakeSeriesTemplate1.set("createdAt", new Date()); // current time
testTakeSeriesTemplate1.set("series", testTakeSeries1); // current time
testTakeSeriesTemplate1.set("repeatSeries", false); // current time

var testTakeSeriesTemplate2 = new Map();
testTakeSeriesTemplate2.set("name", "SHO - Example");
testTakeSeriesTemplate2.set("description", "Used as a test to show");
testTakeSeriesTemplate2.set("processSeries", "per series");
testTakeSeriesTemplate2.set("createdAt", new Date()); // current time
testTakeSeriesTemplate2.set("series", testTakeSeries2); // current time
testTakeSeriesTemplate2.set("repeatSeries", false); // current time


var testAllTakeSeriesTemplates = [];
testAllTakeSeriesTemplates.push(testTakeSeriesTemplate1);
testAllTakeSeriesTemplates.push(testTakeSeriesTemplate2);

// *******************************
var target1 = new Map();
var target2 = new Map();

target1.set("name", 'LRGB Galaxy');
target1.set("targetFindName", 'NGC3682');
target1.set("targetImage", '');
target1.set("description", 'test run');
target1.set("takeSeries", testTakeSeriesTemplate1);
target1.set("ra", 11.338111053923866);
target1.set("dec", 13.5897473762046);
target1.set("angle", 209.1496693374404);
target1.set("scale", 0.281);
target1.set("coolingTemp", -19);
target1.set("clsFliter", 'Lum');
target1.set("focusFliter",'Lum');
target1.set("foccusSamples", 3);
target1.set("focusBin", '4');
target1.set("guideExposure", '9');
target1.set("guideDelay", '2');
target1.set("startTime", '22:00');
target1.set("stopTime", '06:00');
target1.set("priority", 5);
target1.set("tempChg", 0.7);
target1.set("minAlt", 30);
target1.set("completed", false);
target1.set("createdAt", new Date());

target2.set("name", 'SHO - Nebula');
target2.set("targetFindName", 'NGC3682');
target2.set("targetImage", '');
target2.set("description", 'test run');
target2.set("takeSeries", testTakeSeriesTemplate2);
target2.set("ra", 11.338111053923866);
target2.set("dec", 13.5897473762046);
target2.set("angle", 209.1496693374404);
target2.set("scale", 0.281);
target2.set("coolingTemp", -19);
target2.set("clsFliter", 'Lum');
target2.set("focusFliter", 'Lum');
target2.set("foccusSamples", 3);
target2.set("focusBin", '4');
target2.set("guideExposure", '9');
target2.set("guideDelay", '2');
target2.set("startTime", '22:00');
target2.set("stopTime", '06:00');
target2.set("priority", 1);
target2.set("tempChg", 0.7);
target2.set("minAlt", 30);
target2.set("completed", false);
target2.set("createdAt", new Date());

var testTargetSessions = [];
testTargetSessions.push(target1);
testTargetSessions.push(target2);

function loadTestDataAllTakeSeriesTemplates() {
  var testData = testAllTakeSeriesTemplates;

  // now need to load the information into Mongo
  for (var i = 0; i < testData.length; i++) {

   var takeSeries = testData[i];

    // get the id for the new object
    const id = TakeSeriesTemplates.insert(
      {
        name: takeSeries.get("name"),
        description: takeSeries.get("description"),
        processSeries: testData[i].get("processSeries"),
        createdAt: takeSeries.get("createdAt"),
        repeatSeries: takeSeries.get("repeatSeries"),
        series: [],
      }
    )

    var series = takeSeries.get("series");
    for (var i = 0; i < series.length; i++) {

      seriesMap = series[i];
      const sid = Seriess.insert(
        {
          order: seriesMap.get("order"),
          exposure: seriesMap.get("exposure"),
          binning: seriesMap.get("binning"),
          frame: seriesMap.get("frame"),
          filter: seriesMap.get("filter"),
          repeat: seriesMap.get("repeat"),
        }
      );

      TakeSeriesTemplates.update({_id: id}, {
        $push: { 'series': {id: sid} }
      });
    }
  }
}

/*
tsx_SetServerState
currentStage: 'currentStage', // this is a status line update for the dashboard
initialFocusTemperature: 'initialFocusTemperature',
initialRA: 'initialRA',
initialDEC: 'initialDEC',
initialMHS: 'initialMHS',
initialMntDir: 'initialMntDir',
initialMntAlt: 'initialMntAlt',
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
        tsx_SetServerState(tsx_ServerStates.currentStage, 'Searching...');
        var target = getValidTargetSession(); // no return

        if (typeof target != 'undefined') {
          isParked = false;
          tsx_SetServerState(tsx_ServerStates.currentStage, 'Found...');

          // Point, Focus, Guide
          prepareTargetForImaging( target );

          // target images per Take Series
          processTarget( target );

        }
        else {
          if( !isParked ) {
            console.log('No valid sessions - parking');
            var defaultFilter = tsx_GetServerStateValue('defaultFilter');
            var softPark = Boolean(tsx_GetServerStateValue('defaultSoftPark'));
            tsx_SetServerState(tsx_ServerStates.currentStage, 'Parking...');
            tsx_MntPark(defaultFilter, softPark);
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

var tsxHeader =  '/* Java Script *//* Socket Start Packet */';
var tsxFooter = '/* Socket End Packet */';
var forceAbort = false;

var schedulerRunning = 'Stop';
var isSchedulerRunning = true;

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
  var job = new Job(scheduler, scheduler.findOne({}));

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

  setSchedulerState('Pause' );
  console.log('Manually PAUSED scheduler');
}

export function srvStopScheduler() {
  var dummyVar;
  // Any job document from myJobs can be turned into a Job object
  setSchedulerState('Stop' );
  var job = new Job(scheduler, scheduler.findOne({}));
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
        .delay(0)// 60*60*1000)     // Wait an hour before first try
        .save();               // Commit it to the server
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
     if( getSchedulerState() != 'Stop' ) {
       console.log('Stopping');
       srvStopScheduler();
     }
     else {
       console.log('Do nothing - not Stopped');
     }
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
     // testStr = string_replace(testStr, '$0000', '5');
     // testStr =  string_replace(testStr, '$0000', 'hi');
     testStr = testStr.replace("$0000", "var=test;");
     testStr = testStr.replace("$0001", '99999999999999');
     console.log('Result:   ' + testStr);

     //console.log(str);
     console.log(
      '*******************************'
    );
   },

   loadTestDataTargetSessions() {

     // load the templates
     loadTestDataAllTakeSeriesTemplates();

     var testData = testTargetSessions;
     console.log('Loading 1');

     for (var i = 0; i < testData.length; i++) {
       console.log('Loading 2');
       var test = testData[i];
       console.log('Loading 3');
       var takesSeriesMap = test.get('takeSeries');
       console.log('Loading 1');
       var id = TargetSessions.insert(
         {
           name: testData[i].get("name"),
           targetFindName: testData[i].get("targetFindName"),
           targetImage: testData[i].get("targetImage"),
           description: testData[i].get("description"),
           enabledActive: false,
           series: {},
           ra: testData[i].get("ra"),
           dec: testData[i].get("dec"),
           angle: testData[i].get("angle"),
           scale: testData[i].get("scale"),
           coolingTemp: testData[i].get("coolingTemp"),
           clsFliter: testData[i].get("clsFliter"),
           focusFilter: '',
           foccusSamples: testData[i].get("foccusSamples"),
           focusBin: testData[i].get("focusBin"),
           guideExposure: testData[i].get("guideExposure"),
           guideDelay: testData[i].get("guideDelay"),
           startTime: testData[i].get("startTime"),
           stopTime: testData[i].get("stopTime"),
           priority: testData[i].get("priority"),
           tempChg: testData[i].get("tempChg"),
           minAlt: testData[i].get("minAlt"),
           currentAlt: 0,
           completed: testData[i].get("completed"),
           createdAt: testData[i].get("createdAt"),
         }
       )
       console.log('Loading 1');
       var series = TakeSeriesTemplates.find().fetch();

       TargetSessions.update({_id: id}, {
         // $set: { 'series': { _id:series[i]._id } },
         $set: { 'series': { _id:series[i]._id, value:series[i].name } },
       });

       const tSession = TargetSessions.findOne({_id: id});
       console.log('Done load test object: ' + tSession.name );
     }
   },

   takeSeriesForTarget( targetSession ) {

   },

   // *******************************
   // Test of the python to connect to TSX
   tsx_getMountRaDec(arg1, arg2) { // Parameters not used
     var cmd_real = "\
    /* Java Script */\
    /* Socket Start Packet */\
      var Out;\
      sky6RASCOMTele.Connect();\
      if (sky6RASCOMTele.IsConnected==0)\
      {\
          Out = 'Not connected';\
      }\
      else\
      {\
          sky6RASCOMTele.GetRaDec();\
          Out  = String(sky6RASCOMTele.dRa) + '|' + String(sky6RASCOMTele.dDec);\
      }\
    /* Socket End Packet */";

     var net = require('net');
     var tsx = new net.Socket({writeable: true}); //writeable true does not appear to help

     tsx.on('close', function() {
         console.log('Connection closed');
     });

     tsx.on('error', function(err) {
         console.error('Connection error: ' + err);
         console.error(new Error().stack);
     });

     tsx.connect(3040, '10.9.8.17', function() {
       console.log('Connected MountRaDec');
     });

     var Out;
     tsx.setEncoding(); // used to set the string type of return
     tsx.on('data', (chunk) => {
      console.log(`Received ${chunk.length} bytes of data.`);
      console.log(chunk);
      Out = chunk;
    });

     tsx.write(cmd_real, (err) => {
       console.log('Connected MountRaDec:' + err);
     });
     tsx.reads

     return 'some return value from Mount RA: ' + Out ;

   },

   startupImaging() {
     // tweet... we are starting up... https://stackoverflow.com/questions/6640520/post-to-twitter
     //https://developer.twitter.com/en/docs/tweets/tweet-updates


     return 'baz';
   },

 });
