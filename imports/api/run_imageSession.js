import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';


var forceAbort = false;
var port = 3040;
var ip = 'localhost';

import '../tsx/SkyX_JS_TryTarget.js'
import '../tsx/SkyX_JS_Slew.js'
import '../tsx/SkyX_JS_CLS.js'
import '../tsx/SkyX_JS_Twilight.js'

import '../tsx/SkyX_JS_FindGuideStar.js'
import '../tsx/SkyX_JS_Focus-3.js'
import '../tsx/SkyX_JS_FrameAndGuide.js'
import '../tsx/SkyX_JS_GetFocTemp.js'
import '../tsx/SkyX_JS_MatchAngle.js'
import '../tsx/SkyX_JS_TakeGuideImage.js'
import '../tsx/SkyX_JS_TryTarget.js'

// More advance with image supplied... perhaps save an image with the target...
import '../tsx/SkyX_JS_ImageLink.js'

// *******************************
// Get Target Series
// 1. Target - image, RA/DEC, Name
// 2. priority - in the case more than one session is ready...
// 3. Minimum Altitude - start or stop... for now
// 4. start Time
// 5. Stop time
// 6. Temp to check focus
// 7. Meridian Flip
// 8. Image Camera Temp
function getTargetSession(targetSessions) {

  var foundSession = false;
  var numSessions = targetSession.length;
  var validSession = false;

  for (var i = 0; i < numSessions; i++) {
    var canStart = canTargetSessionStart( targetSessions[i]);
    if( canStart ) {
      validSession = targetSessions[i];
      foundSession = true;
      break;
    }
  }

  if( foundSession ) {
    for (var i = 0; i < numSessions; i++) {
      if( validSession != targetSessions[i] ) {
        chk = targetSession[i];
        if( canTargetSessionStart( chk ) ) {
            if( validSession.priority < chk.priority  ) {
              if( validSession.minAlt > chk.minAlt  ) {
                if( validSession.startTime > chk.startTime  ) {
                  validSession = chk;
                }
              }
            }
          }
        }
      }
    }
  return validSession;
};

// *******************************
// Check target... altitude ok, time okay,
function canTargetSessionStart(targetSession) {
  var canStart = false;
  var currentTime = new Time();
  var currentAlt = 21;
  var eveningTwighlight = 10;
  var morningTwighlight = 5;

  // Is it dark enough
  if( currentTime >= eveningTwighlight ) {
    // Has end time passed
    if( targetSession.endTime < currentTime ) {
      // Has start time passed
      if( targetSession.startTime >= currentTime ) {
        // are we at least at the min altitude
        if( targetSession.minAlt >= currentAlt) {
          // are we before morning Altitude
          if( currentTime < morningTwighlight ) {
            canStart = true;
          }
        }
      }
    }
  }
  return canStart;
};

function tsxCmdCLS() {
  // Turn on camera autosave
  //Do the closed loop slew synchronously
Out ='\
ccdsoftCamera.Connect();\
ccdsoftCamera.AutoSaveOn = 1;\
nErr = ClosedLoopSlew.exec();\
';
};

// *******************************
  // Capture Series - SHO|LRGB
  // 1. Per Filter or Across Filters
  // 1. FilterSession 1

  // this works... what am I doing wrong
  // stat1e = { sessions: {exposure: '', binning: '',}, frame: '', filter: '', repeat: '' }
  //
  // // state1 = { sessions: {exposure: '', binning: '',}, frame: '', filter: '', repeat: '' }
  //
  // t2 = { name: 'Static 2x2', binning: 1 };
  // t1 = [{ name: 'Static 1x1', value: 0 }","];
  // t2 = { name: 'Static 2x2', value: 1 };
  // t3 = { name: 'Static 3x3', value: 2 };
  // var test = [ t1, t2, t3 ];
  // ];

// *******************************
// Filter Series
// 1. Filter name
// 2. Exposure
// 3. Quantity
// 4. taken - number of images obtained


// *******************************
// the following is an outline for running an image session
//
var imagingSession;

// *******************************
// Utilities:
// 1. CLS
// 2. stop SkyX_JS_StopTracking
// 3. MountParkHard
// 4. MountParkSoft
// 5. Focus
// 6. SkyX_JS_FindAutoGuideStar
// 6. waitTilDark
// DONE 7. Get Filter names...
//    numFilters = lNumberFilters | filterName = ccdsoftCamera::szFilterName
//    ignore the offset for now... assume TSX will manage

Meteor.methods({

  // Assumed balanced RA/DEC
  // Assumed Date/Time/Long/Lat correct
  // Assumed Homed
  // Assume Polar aligned (rough, or with Polemaster)
  // Assumed initial focus is done
  // Assume TPoint recalibration done
  // Assumed Accurate Polar Alignment (APA) done
  // Do not assume Autoguider calibrated, will be done once guide star found

  // NEED A METHOD TO ADD TEMP SAMPLES INTO Database
  // NEED A METHOD TO RESET THE TEMP DATA IN DATABASE
  // *******************************
  // *******************************
  // Find a session
  // *******************************
  // *******************************
    //    - check start time
    //    - check for dark time... is darkenough
    //    - check start altitude
    //    - check priority
    //    - check for end times
    //    - check end alitudes
    //    - check morning sunrise
  getImageSeries(targetSessions) {
    imagingSession = getTargetSession(targetSessions);

    // *******************************
    // 1. Get target's Ra/Dec to Slew, options:
    //  a) Object name to find
    //  b) Image
    //  c) Ra/Dec
    var targetFound = false;
    if( !forceAbort && imageSession != '' ) {
      var cmd = tsxCmdSetTargetRaDec (imageSession.ra,imageSession.dec);
      tsx_feeder(ip, port, cmd, Meteor.bindEnvironment((tsx_return) => {
          var result = tsx_return.split('|')[0].trim();
          console.log('Target: ' + result);
          if( result === "Found") {
            targetFound = true;
            }
          }
        )
      )
    }
  },
  // *******************************
  // *******************************
  // Prepare target
  // *******************************
  // *******************************
  prepareTarget(imageSession) {
    // *******************************
    //    B. Slew to target
    var slewSuccess = false;
    if( !forceAbort && targetFound ) {
      var cmd = tsxCmdSlew(targetSession.ra,targetSession.dec);
      tsx_feeder(ip, port, cmd, Meteor.bindEnvironment((tsx_return) => {
            var result = tsx_return.split('|')[0].trim();
            console.log('Any error?: ' + result);
            if( result != 'Success') {
              forceAbort = true;
              console.log('Slew Failed. Error: ' + result);
            }
            slewSuccess = true;
          }
        )
      )
    }

    // *******************************
    // 3. refine Focus - @Focus3
    var focusSuccess = false;
    if( !forceAbort && slewSuccess ) {
      var cmd = tsxCmdFocus3(targetSession.focusFilter,targetSession.focusBin,targetSession.focusSamples);
      tsx_feeder(ip, port, cmd, Meteor.bindEnvironment((tsx_return) => {
            var result = tsx_return.split('|')[0].trim();
            console.log('Any error?: ' + result);
            if( result != 'Success') {
              forceAbort = true;
              console.log('Focus3 Failed. Error: ' + result);
            }
            focusSuccess = true;
          }
        )
      )
    }

    var lastFocusTemp = 0;
    var getFocusTempSuccess = false;
    if( !forceAbort && slewSuccess ) {
      var cmd = tsxCmdGetFocusTemp();
      tsx_feeder(ip, port, cmd, Meteor.bindEnvironment((tsx_return) => {
            var result = tsx_return.split('|')[0].trim();
            console.log('Any error?: ' + result);
            if( result != 'Success') {
              forceAbort = true;
              console.log('Focus Temp Failed. Error: ' + result);
            }
            getFocusTempSuccess = true;
            lastFocusTemp = tsx_return.split('|')[1].trim();
          }
        )
      )
    }

    // *******************************
    //    B. CLS to target
    var clsSuccess = false;
    if( !forceAbort && focusSuccess ) {
      var cmd = tsxCmdCLS();
      tsx_feeder(ip, port, cmd, Meteor.bindEnvironment((tsx_return) => {
            var result = tsx_return.split('|')[0].trim();
            console.log('Any error?: ' + result);
            if( result != 'Success') {
              forceAbort = true;
              console.log('CLS Failed. Error: ' + result);
            }
            clsSuccess = true;
          }
        )
      )
    }
    // *******************************
    //    C. Match Rotation/Angle if provided:
    //      a) if entered for session
    //      b) obtained from image
    var rotateSucess = false;
    if( !forceAbort && clsSuccess ) {
      var cmd = tsxCmdMatchAngle(targetSession.angle,targetSession.scale);
      tsx_feeder(ip, port, cmd, Meteor.bindEnvironment((tsx_return) => {
            var result = tsx_return.split('|')[0].trim();
            console.log('Any error?: ' + result);
            if( result != 'Success') {
              forceAbort = true;
              console.log('CLS Failed. Error: ' + result);
            }
            rotateSucess = true;
          }
        )
      )
    }

    // *******************************
    // 4. Get Guidestar
    var guideImageSuccess = false;
    if( !forceAbort && rotateSucess ) {
      var cmd = tsxCmdTakeGuiderImage(targetSession.guideExposure, targetSession.guideDelay);
      tsx_feeder(ip, port, cmd, Meteor.bindEnvironment((tsx_return) => {
            var result = tsx_return.split('|')[0].trim();
            console.log('Any error?: ' + result);
            if( result != 'Success') {
              forceAbort = true;
              console.log('Rotate Failed. Error: ' + result);
            }
            guideImageSuccess = true;
          }
        )
      )
    }
    var guideStarSuccess = false;
    var guideStarX = 0;
    var guideStarY = 0;
    if( !forceAbort && rotateSucess ) {
      var cmd = tsxCmdFindGuideStar();
      tsx_feeder(ip, port, cmd, Meteor.bindEnvironment((tsx_return) => {
            var result = tsx_return.split('|')[0].trim();
            console.log('Any error?: ' + result);
            if( result != 'Success') {
              forceAbort = true;
              console.log('Guider Image Failed. Error: ' + result);
            }
            guideStarSuccess = true;
            guideStarX = tsx_return.split('|')[1].trim();
            guideStarY = tsx_return.split('|')[2].trim();
          }
        )
      )
    }

    var guidingSuccess = false;
    if( !forceAbort && guideStarSuccess ) {
      var cmd = tsxCmdFrameAndGuide(guideStarX,guideStarY,subFrameStar );
      tsx_feeder(ip, port, cmd, Meteor.bindEnvironment((tsx_return) => {
            var result = tsx_return.split('|')[0];
            console.log('Any error?: ' + result);
            if( result != 'Success') {
              forceAbort = true;
              console.log('Guiding Failed. Error: ' + result);
            }
            guidingSuccess = true;
          }
        )
      )
    }
    // *******************************
    // 5. Calibrate Autoguide
  },
  // *******************************
  // 6. Load filters, exposures, quantity

  // *******************************
  //    A. Tweet session starting

  // *******************************
  // 7. Start session run:
  //    - take image
  startImaging() {
    // use the order of the series
    // count number of series
    // do across series, or per series
    // for the selected series - do while notNextSeries...
    // takeImage(exposure, filter)
    // check Twilight - force stop
    // check minAlt - stop - find next
    // check stopTime - stop - find next
    // check reFocusTemp - refocus
    // if not meridian - dither...
    // if meridian  - flip/slew... - preRun: focus - CLS - rotation - guidestar - guiding...
    // if targetDone/stopped... find next

  },


  // *******************************
  //  8. Image done... next?
  //    - check priority - is there another target to take over
  //    - check for meridian flip
  //    - check end time
  //    - check end Altitude
  //    - Report for next image... step 6
  //      - do we dither?
  //      - did temp change to refocus?

  // *******************************
  // 8. End session activities


});
