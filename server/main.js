import { Meteor } from 'meteor/meteor';

import { TargetSessions } from '../imports/api/targetSessions.js';
import { TakeSeriesTemplates} from '../imports/api/takeSeriesTemplates.js';
import '../imports/api/filters.js';
import '../imports/api/sessionTemplates.js';
import '../imports/api/theSkyXInfos.js';
import '../imports/api/run_imageSession.js';
import './filters.js';

// *******************************
// Filter Series
// 1. Filter name
// 2. Exposure
// 3. Quantity
// 4. taken - number of images obtained
// LUM Imaging
var nBExposure = 8*60;
var lrgbExposure = 3*60;

var takeSeries1 = new Map();
// LUM
takeSeries1.set( "order", 0);
takeSeries1.set("exposure", lrgbExposure );
takeSeries1.set("binning",  1 );
takeSeries1.set("frame", 'Light' );
takeSeries1.set("filter", 0 );
takeSeries1.set("repeat", 33 );
takeSeries1.set("taken", 0);
// R Imaging
var takeSeries2 = new Map();
takeSeries2.set( "order", 1);
takeSeries2.set("exposure", lrgbExposure );
takeSeries2.set("binning",  1 );
takeSeries2.set("frame", 'Light' );
takeSeries2.set("filter", 1 );
takeSeries2.set("repeat", 33 );
takeSeries2.set("taken", 0);
// G
var takeSeries3 = new Map();
takeSeries3.set( "order", 2);
takeSeries3.set("exposure", lrgbExposure );
takeSeries3.set("binning",  1 );
takeSeries3.set("frame", 'Light' );
takeSeries3.set("filter", 2 );
takeSeries3.set("repeat", 33 );
takeSeries3.set("taken", 0);
// B
var takeSeries4 = new Map();
takeSeries4.set( "order", 3);
takeSeries4.set("exposure", lrgbExposure );
takeSeries4.set("binning",  1 );
takeSeries4.set("frame", 'Light' );
takeSeries4.set("filter", 3 );
takeSeries4.set("repeat", 33 );
takeSeries4.set("taken", 0);
// Ha
var takeSeries5 = new Map();
takeSeries5.set( "order", 0);
takeSeries5.set("exposure", nBExposure );
takeSeries5.set("binning",  1 );
takeSeries5.set("frame", 'Light' );
takeSeries5.set("filter", 4 );
takeSeries5.set("repeat", 33 );
takeSeries5.set("taken", 0);
// OIII
var takeSeries6 = new Map();
takeSeries6.set( "order", 1);
takeSeries6.set("exposure", nBExposure );
takeSeries6.set("binning",  1 );
takeSeries6.set("frame", 'Light' );
takeSeries6.set("filter", 5 );
takeSeries6.set("repeat", 33 );
takeSeries6.set("taken", 0);
// SII
var takeSeries7 = new Map();
takeSeries7.set( "order", 2);
takeSeries7.set("exposure", nBExposure );
takeSeries7.set("binning",  1 );
takeSeries7.set("frame", 'Light' );
takeSeries7.set("filter", 6 );
takeSeries7.set("repeat", 33 );
takeSeries7.set("taken", 0);

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

var testTakeSeriesTemplate2 = new Map();
testTakeSeriesTemplate2.set("name", "SHO - Example");
testTakeSeriesTemplate2.set("description", "Used as a test to show");
testTakeSeriesTemplate2.set("processSeries", "per series");
testTakeSeriesTemplate2.set("createdAt", new Date()); // current time
testTakeSeriesTemplate2.set("series", testTakeSeries2); // current time


var testAllTakeSeriesTemplates = [];
testAllTakeSeriesTemplates.push(testTakeSeriesTemplate1);
testAllTakeSeriesTemplates.push(testTakeSeriesTemplate2);

// *******************************
var target1 = new Map();
var target2 = new Map();

target1.set("name", 'Higher Priority Rerun of NGC3628');
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
target1.set("startTime", '');
target1.set("stopTime", '');
target1.set("priority", 0);
target1.set("tempChg", 0.7);
target1.set("minAlt", 30);
target1.set("completed", false);
target1.set("createdAt", new Date());

target2.set("name", 'Lower priority Rerun of NGC3628');
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
target2.set("startTime", '');
target2.set("stopTime", '');
target2.set("priority", 1);
target2.set("tempChg", 0.7);
target2.set("minAlt", 30);
target2.set("completed", false);
target2.set("createdAt", new Date());

var testTargetSessions = [];
testTargetSessions.push(target1);
testTargetSessions.push(target2);

Meteor.startup(() => {
  // code to run on server at startup

  // imports/tsx/SkyX_JS_GetMntCoords.js
  // This does load the script
  //var mount = require('../imports/tsx/SkyX_JS_GetMntCoords.js');

  // connect MOUNT
  // connect camera, filterwheel, focuser, rotator
  // connect guider
  // get filters
  // set camera temp


});

/*
  THERE ARE SEVERAL SERVER STATES TO MAINTAIN FOR TSX:
  . MOUNT Connected: Y/N/PARKED/HOMED/SLEWING...
  . CAMERA CONNECTED: Y/N
  . Autoguide CONNECTED: Y/N
  . FILTERWHEEL CONNECTED: Y/N
  . FOCUSER CONNECTED: Y/N
  . ROTATOR CONNECTED: Y/N


  var CoordsHMSNow = "";
  var CoordsHMS2k = "";

  sky6RASCOMTele.GetRaDec();

  sky6Utils.ConvertEquatorialToString(sky6RASCOMTele.dRa, sky6RASCOMTele.dDec, 5);

  CoordsHMSNow = sky6Utils.strOut;

  sky6Utils.PrecessNowTo2000( sky6RASCOMTele.dRa, sky6RASCOMTele.dDec);

  sky6Utils.ConvertEquatorialToString(sky6Utils.dOut0, sky6Utils.dOut1, 5);

  CoordsHMS2k = sky6Utils.strOut;
  Out = "^          Now - " + CoordsHMSNow + "\n" + "          j2k - " + CoordsHMS2k;			// Form the output string

 */
 Meteor.methods({

   loadTestDataAllTakeSeriesTemplates() {
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
           series: [],
         }
       )

       var series = takeSeries.get("series");
       for (var i = 0; i < series.length; i++) {
         seriesMap = series[i];
         TakeSeriesTemplates.update({_id: id}, {
           $push: { 'series': seriesMap },
         });
       }
     }
   },

   loadTestDataTargetSessions() {

     // load the templates
     //this.loadTestDataAllTakeSeriesTemplates();

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
           takeSeries: {},
           ra: testData[i].get("ra"),
           dec: testData[i].get("dec"),
           angle: testData[i].get("angle"),
           scale: testData[i].get("scale"),
           coolingTemp: testData[i].get("coolingTemp"),
           clsFliter: testData[i].get("clsFliter"),
           focusFliter: testData[i].get("focusFliter"),
           foccusSamples: testData[i].get("foccusSamples"),
           focusBin: testData[i].get("focusBin"),
           guideExposure: testData[i].get("guideExposure"),
           guideDelay: testData[i].get("guideDelay"),
           startTime: testData[i].get("startTime"),
           stopTime: testData[i].get("stopTime"),
           priority: testData[i].get("priority"),
           tempChg: testData[i].get("tempChg"),
           minAlt: testData[i].get("minAlt"),
           completed: testData[i].get("completed"),
           createdAt: testData[i].get("createdAt"),
         }
       )
       console.log('Loading 1');

       TargetSessions.update({_id: id}, {
         $set: { 'takeSeries': takesSeriesMap },
       });
       // TargetSessions.update(
       //   {_id: id, 'takeSeries'},
       //   {$set: {'takeSeries',takesSeriesMap}}
       // );

       const tSession = TargetSessions.findOne({_id: id});
       console.log('Done load test object: ' + i);
       // tSession.takeSeries = testData[i].get("takeSeries");

       // TargetSessions.update({ _id: tSession._id }, {
       //     $addToSet: {
       //         takeSeries: {
       //             _id: Random.id(),
       //             service: $('#new_service_name').val(),
       //             bufferEnd: $('#new_service_description').val(),
       //         }
       //     }
       // );
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
