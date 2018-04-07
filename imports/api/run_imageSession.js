import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import { TargetSessions } from './targetSessions.js';
import { TakeSeriesTemplates } from './takeSeriesTemplates.js';
import { Seriess } from './seriess.js';
import { TheSkyXInfos } from './theSkyXInfos.js';

//Tools
import { tsx_ServerStates } from './serverStates.js'
import {
  canTargetSessionStart,
  getTargetSession,
  calcTargetProgress,
} from './sessionTools.js';

import {tsx_feeder, tsx_is_waiting} from '../../server/tsx_feeder.js'

import {shelljs} from 'meteor/akasha:shelljs';

var forceAbort = false;

function updateSeries(series) {
  return Seriess.update( {_id: series._id}, {
        $set:{
          order: series.order,
          exposure: series.exposure,
          frame: series.frame,
          filter: series.filter,
          repeat: series.repeat,
          binning: series.binning,
          taken: series.taken,
        }
      });
}


/* *******************************
initialFocusTemp: 0,
initialMountDirection: "east",
initialMountAltitude: 30,
initialMountAzimuth:0,
 ******************************* */
export function tsx_SetServerState( name, value) {
  TheSkyXInfos.upsert( {name: name }, {
    $set: { value: value }
  })
};

export function tsx_GetServerState( name ) {
  var val = TheSkyXInfos.findOne( {name: name });
  return val;
};

var shell = require('shelljs');

// import {tsxCmdSetTargetRaDec} from '../tsx/SkyX_JS_TryTarget.js'
// import {tsxCmdSlewRaDec} from '../tsx/SkyX_JS_Slew.js'
// import {tsxCmdCLS} from '../tsx/SkyX_JS_CLS.js'
// import {tsxCmdGetTwilight} from '../tsx/SkyX_JS_Twilight.js'
//
// import {tsxCmdFindGuideStar} from '../tsx/SkyX_JS_FindGuideStar.js'
// import {tsxCmdFocus3} from '../tsx/SkyX_JS_Focus-3.js'
// import {tsxCmdFrameAndGuide} from '../tsx/SkyX_JS_FrameAndGuide.js'
// import {tsxCmdGetFocusTemp} from '../tsx/SkyX_JS_GetFocTemp.js'
// import {tsxCmdMatchAngle} from '../tsx/SkyX_JS_MatchAngle.js'
// import {tsxCmdTakeGuiderImage} from '../tsx/SkyX_JS_TakeGuideImage.js'
// import {tsxCmdFindTargetWithRaDecAlt} from '../tsx/SkyX_JS_TryTarget.js'
// import {tsxCmdTakeImage} from '../tsx/SkyX_JS_TakeImage.js'
//
// // More advance with image supplied... perhaps save an image with the target...
// import {tsxCmdImageLink} from '../tsx/SkyX_JS_ImageLink.js'

// *******************************
// Substrung replacement routine for the loading of tsx.js library
// replace the given strings with values...
//
// e.g. $0000 string_replace( tsx_FindTarget, '$0000', 'M1');
// Do this for each needed parameters
//
// src: https://stackoverflow.com/questions/252924/javascript-how-to-replace-a-sub-string
//
export function string_replace(haystack, find, sub) {
    return haystack.split(find).join(sub);
}

function tsx_cmd(script) {
  console.log('Creating tsx_cmd: ' + script);
  // var src =
  var path = Npm.require('path');
  var rootPath = path.resolve('.');
  var src = rootPath.split(path.sep + '.meteor')[0];
  // var c = Meteor.absolutePath;
  console.log('Root: ' + src);
  return src +'/imports/tsx/'+ script+'.js';
}

// *******************************
function tsx_takeImage( filterNum, exposure ) {

  console.log('Starting image');
  var success = false;
  // var cmd = tsxCmdTakeImage(filter,exposure);
  var cmd = shell.cat(tsx_cmd('SkyX_JS_TakeImage'));

  console.log('Load cmd: ' + cmd);
  // testStr =  string_replace(testStr, '$0000', 'hi');
  cmd = cmd.replace('$000', Number(filterNum) ); // set filter
  cmd = cmd.replace('$001', Number(exposure) ); // set exposure

  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        var result = tsx_return.split('|')[0].trim();
        console.log('Image: ' + result);
        if( result === "Sucess") {
          success = true;
        }
        else {
          console.log('Image failed: ' + tsx_return);
        }
      }
    )
  )
  while( tsx_is_waiting() ) {
   Meteor.sleep( 1000 );
  }
  return success;
};

function tsxCmdTestCLS() {
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

function tsx_AbortGuider() {
  var dts = new Date();
  console.log(String(dts) + ': Aborting guider... ');
  var success = false;
  // var cmd = tsxCmdTakeImage(filter,exposure);
  var cmd = shell.cat(tsx_cmd('SkyX_JS_Abort'));
  // console.log('Load cmd: ' + cmd);
  // // testStr =  string_replace(testStr, '$0000', 'hi');
  // cmd = cmd.replace('$000', filterNum ); // set filter
  // cmd = cmd.replace('$001', exposure ); // set exposure

  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        var result = tsx_return.split('|')[0].trim();
      }
    )
  )
  while( tsx_is_waiting() ) {
   Meteor.sleep( 1000 );
  }
  return true;
}

// *******************************
// Try tot find the target
function tsx_TryTarget(targetSession) {
  var dts = new Date();
  console.log(String(dts) + ': Trying Target... ');
  var cmd = shell.cat(tsx_cmd('SkyX_JS_TryTarget'));

  cmd = cmd.replace("$000", targetSession.targetFindName ); // set filter
  cmd = cmd.replace("$001", targetSession.minAlt ); // set filter
  // cmd = cmd.replace("$001", 30 ); // set exposure
  // var cmd = tsxCmdSlew(targetSession.ra,targetSession.dec);
  var Out;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        var success = tsx_return.split('|')[0].trim();
        console.log('Any error?: ' + tsx_return);
        if( success != 'Success') {
          forceAbort = true;
          console.log('SkyX_JS_TryTarget Failed. Error: ' + tsx_return);
          return;
        }
        Out = success;
      }
    )
  )
  return Out;
}

// *******************************
//    B. CLS to target
function tsx_CLS(targetSession) {

  var clsSuccess = false;
  if( !forceAbort ) {
    // var cmd = tsxCmdCLS();
    var cmd = shell.cat(tsx_cmd('SkyX_JS_CLS'));
    cmd = cmd.replace('$000', targetSession.targetFindName ); // set filter
    cmd = cmd.replace('$001', targetSession.focusFilter); // set exposure

    tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
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
  while( tsx_is_waiting() ) {
   Meteor.sleep( 1000 );
  }

  return clsSuccess;
}


function tsx_InitialFocus(targetSession) {
  var dts = new Date();
  console.log(String(dts) + ': Geting intial @focus3... ');

  var focusFilter = getFilterIndexFor(targetSession.focusFilter);

  var cmd = shell.cat(tsx_cmd('SkyX_JS_Focus-3'));
  cmd = cmd.replace("$000", focusFilter ); // set filter
  cmd = cmd.replace("$001", "No" ); // set filter
  // cmd = cmd.replace("$001", 30 ); // set exposure
  // var cmd = tsxCmdSlew(targetSession.ra,targetSession.dec);
  var Out;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        var success = tsx_return.split('|')[0].trim();
        console.log('SkyX_JS_Focus result check: ' + tsx_return);
        // if( success != 'Success') {
        //   forceAbort = true;
        //   console.log('SkyX_JS_Focus Failed. Error: ' + tsx_return);
        //   return;
        // }
        Out = success;
      }
    )
  )
  while( tsx_is_waiting() ) {
   Meteor.sleep( 1000 );
  }

  return Out;
}

function tsx_focusTemperature() {
  var dts = new Date();
  console.log(String(dts) + ': Geting focus temperature... ');

  var cmd = shell.cat(tsx_cmd('SkyX_JS_GetFocTemp'));
  // cmd = cmd.replace("$000", focusFilter ); // set filter
  // cmd = cmd.replace("$001", "No" ); // set filter
  // cmd = cmd.replace("$001", 30 ); // set exposure
  // var cmd = tsxCmdSlew(targetSession.ra,targetSession.dec);
  var Out;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        var success = tsx_return.split('|')[0].trim();
        console.log('SkyX_JS_GetFocTemp result check: ' + tsx_return);
        Out = success;
      }
    )
  )
  return Out;
}

function tsx_GetMountCoords() {
  var dts = new Date();
  console.log(String(dts) + ': Geting mount coordinates... ');

  var cmd = shell.cat(tsx_cmd('SkyX_JS_GetMntCoords'));
  // cmd = cmd.replace("$000", focusFilter ); // set filter
  // cmd = cmd.replace("$001", "No" ); // set filter
  // cmd = cmd.replace("$001", 30 ); // set exposure
  // var cmd = tsxCmdSlew(targetSession.ra,targetSession.dec);
  var Out;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        console.log('SkyX_JS_GetFocTemp result check: ' + tsx_return);
        //Out = ra2000 + '|' + dec2000+ '|' + CoordsHMS2000 + '|';			// Form the output string

        Out = {
          ra: tsx_return.split('|')[0].trim(),
          dec: tsx_return.split('|')[1].trim(),
          hms: tsx_return.split('|')[2].trim(),
        }
      }
    )
  )
  return Out;
}

function tsx_GetMountOrientation() {
  var dts = new Date();
  console.log(String(dts) + ': Geting mount orientiation... ');

  var cmd = shell.cat(tsx_cmd('SkyX_JS_GetMntOrient'));
  // cmd = cmd.replace("$000", focusFilter ); // set filter
  // cmd = cmd.replace("$001", "No" ); // set filter
  // cmd = cmd.replace("$001", 30 ); // set exposure
  // var cmd = tsxCmdSlew(targetSession.ra,targetSession.dec);
  var Out;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        console.log('SkyX_JS_GetFocTemp result check: ' + tsx_return);
        //Out = ra2000 + '|' + dec2000+ '|' + CoordsHMS2000 + '|';			// Form the output string

        Out = {
          direction: tsx_return.split('|')[0].trim(),
          altitude: tsx_return.split('|')[1].trim(),
        }
      }
    )
  )
  return Out;
}

function SetUpForImagingRun(targetSession)
//#
//# Call the Closed-Loop-Slew function to point the mount to the target, record the mount's
//# starting location for future comparisons, find a decent guide star and start autoguiding
//#
{
	//# Kill the guider in case it's still running.
  tsx_SetServerState( 'currentStage', "Start: " + targetSession.name );
  Meteor.sleep(3000); // pause 3 seconds
  tsx_SetServerState( 'currentStage', "Stopping autoguider" );
  tsx_AbortGuider();

  tsx_SetServerState( 'currentStage', "Confirm target" );
	tsx_TryTarget(targetSession);					// If Target can't be found, exit.

  tsx_SetServerState( 'currentStage', "CLS to target" );
	tsx_CLS(targetSession) 						//# Call the Closed-Loop-Slew function to go to the target

  Meteor.sleep( 500 );						// Shouldn't be needed but give SkyX a chance to catch its breath.

  // needs initial focus temp
  tsx_SetServerState( 'currentStage', "Recording intial temp" );
  var initTemp = tsx_InitialFocus();   //# Force a starting focus in case of mirror shift or because I forgot to.
  tsx_SetServerState( 'initialFocusTemperature', initTemp );

  // needs intial Atl and Az
	var mntCoords = tsx_GetMntAltAz();				// Get & Display the mount's current altitude and direction
  tsx_SetServerState( 'initialMntRA', mntCoords.ra );
  tsx_SetServerState( 'initialMntDEC', mntCoords.dec );
  tsx_SetServerState( 'initialMntMHS', mntCoords.mhs );

  var mntOrient = tsx_GetMountOrientation();
  tsx_SetServerState( 'initialMntDir', mntCoords.direction );
  tsx_SetServerState( 'initialMntAlt', mntCoords.altitude );

  tsx_SetServerState( 'currentStage', "Setup guider" );
	tsx_SetUpAutoGuiding();			// Setup & Start Auto-Guiding.

  tsx_SetServerState( 'currentStage', "Parking mount" );
  var lumFilter = 0;
	tsx_MntPark(lumFilter);
  tsx_SetServerState( 'currentStage', "All stopped" );
}

function tsx_SetUpAutoGuiding(targetSession) {
  var guideImageSuccess = false;
  if( !forceAbort ) {
    // var cmd = tsxCmdTakeGuiderImage(targetSession.guideExposure, targetSession.guideDelay);
    var cmd = shell.cat(tsx_cmd('SkyX_JS_TakeGuideImage'));
    cmd = cmd.replace('$000', targetSession.guideExposure );
    // cmd = cmd.replace('$001', targetSession.scale);
    // cmd = cmd.replace('$002', targetSession.exposure);

    tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
          guideImageSuccess = true;
          tsx_SetServerState( 'currentStage', "Processing guider image" );

        }
      )
    )
  }
  while( tsx_is_waiting() ) {
   Meteor.sleep( 1000 );
  }

  var guideStarSuccess = false;
  var guideStarX = 0;
  var guideStarY = 0;
  if( !forceAbort ) {
    // var cmd = tsxCmdFindGuideStar();
    var cmd = shell.cat(tsx_cmd('SkyX_JS_FindAutoGuideStar'));
    // cmd = cmd.replace('$000', targetSession.guideExposure );
    // cmd = cmd.replace('$001', targetSession.scale);
    // cmd = cmd.replace('$002', targetSession.exposure);
    tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
          console.log('Any error?: ' + result);
          guideStarSuccess = true;
          guideStarX = tsx_return.split('|')[1].trim();
          guideStarY = tsx_return.split('|')[2].trim();
          tsx_SetServerState( 'currentStage', "Best guide star candidate: "+guideStarX+", "+guideStarY );
        }
      )
    )
  }

  if( !forceAbort ) {
    // var cmd = tsxCmdFindGuideStar();
    var cmd = shell.cat(tsx_cmd('SkyX_JS_FrameAndGuide'));
    cmd = cmd.replace('$000', guideStarX );
    cmd = cmd.replace('$001', guideStarY );
    // cmd = cmd.replace('$002', targetSession.exposure);
    tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        }
      )
    )
  }
  tsx_SetServerState( 'currentStage', "Autoguiding started" );
}

function tsx_MntPark(lumFilter) {
  var dts = new Date();
  console.log(String(dts) + ': Geting mount orientiation... ');

  var cmd = shell.cat(tsx_cmd('SkyX_JS_ParkMount'));
  cmd = cmd.replace("$000", lumFilter ); // set filter
  // cmd = cmd.replace("$001", "No" ); // set filter
  // cmd = cmd.replace("$001", 30 ); // set exposure
  var Out;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        console.log('SkyX_JS_GetFocTemp result check: ' + tsx_return);

      }
    )
  )
  return Out;
}

// *******************************
// Used to find the RA/DEC in the TargetEditor Details Tab
export function tsx_GetTargetRaDec(targetFindName) {
  console.log('tsx_GetTargetRaDec: ' + targetFindName);
  var file = tsx_cmd('SkyX_JS_GetTargetCoords');
  // console.log('File: ' + file );
  var cmd = shell.cat(file);
  cmd = cmd.replace("$000", targetFindName ); // set filter
  // cmd = cmd.replace("$001", 30 ); // set exposure
  // var cmd = tsxCmdSlew(targetSession.ra,targetSession.dec);
  var Out = "Error|Target not found.";

  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
      var success = tsx_return.split('|')[0].trim();
      console.log('Any error?: ' + tsx_return);
      if( success != 'Success') {
        console.log('tsx_GetTargetRaDec Failed. Error: ' + tsx_return);
        return;
      }
      // Out = 'Success|' + targetRA + '|' + targetDEC+ '|' + altitude + '|'+ azimuth ;			// Form the output string
      tsx_SetServerState( 'targetRA', tsx_return.split('|')[1].trim() );
      tsx_SetServerState( 'targetDEC', tsx_return.split('|')[2].trim() );
      tsx_SetServerState( 'targetATL', tsx_return.split('|')[3].trim() );
      tsx_SetServerState( 'targetAZ', tsx_return.split('|')[3].trim() );

      Out = tsx_return;
      })
    )

  return Out;
}

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
function getValidTargetSession() {
  var imagingSession = getTargetSession();

  // *******************************
  // 1. Get target's Ra/Dec to Slew, options:
  //  a) Object name to find
  //  b) Image
  //  c) Ra/Dec
  if( typeof imagingSession == 'undefined') {
    console.log('Failed to find a valid target session.');
    return;
  }
  else {
    console.log('Found: ' + imagingSession.name);
  }

  if( !forceAbort ) {
    var cmd = tsx_GetTargetRaDec (imagingSession.targetFindName);
    tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        var result = tsx_return.split('|')[0].trim();
        console.log('Target: ' + result);
        if( result === "Found") {
          targetFound = true;
          tsx_SetServerState( tsx_ServerStates.currentStage, 'Found target' );
          return imagingSession;
          }
        }
      )
    )
  }
  else {
    return;
  }
}

function takeSeriesImage(series) {
  console.log('Entered : takeSeriesImage');
  console.log('Procesing filter: ' + series.filter);
  console.log('Series repeat: ' + series.repeat);
  console.log('Series taken: ' + series.taken);
  var remainingImages = series.repeat - series.taken;
  console.log('number of images remaining: ' + remainingImages);
  if( (remainingImages <= series.repeat) && (remainingImages > 0) ) {
    console.log('Launching take image for: ' + series.filter + ' at ' + series.exposure + ' seconds');

    // need to look up the filters in TSX

    var res = tsx_takeImage(0,series.exposure);
    console.log('Taken image: ' +res);
    series.taken++;
    updateSeries(series);
  }
}


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

  tsx_Test() {
    console.log('Get a valid session');
    var imagingSession = getValidTargetSession();
    if (typeof imagingSession == 'undefined') {
      console.log('*** No session found');

    } else {

    }
    console.log('Starting the autoguide');
    tsx_SetUpAutoGuiding(imagingSession);

  },

  // Used to pass RA/DEC to target editors
  targetEditorFind(targetFindName) {
    return tsx_GetTargetRaDec(targetFindName);

  },

  tsx_TryTargetToImage(targetSession) {
    // *******************************
    //    B. Slew to target
    var cmdSuccess = false;
    if( !forceAbort ) {
      var file = tsx_cmd('SkyX_JS_TryTarget');
      // console.log('File: ' + file );
      var cmd = shell.cat(file);
      // console.log('Initial cmd: ' + cmd);
      // console.log('Target name: ' + targetSession.targetFindName );
      console.log('Hardcoded minAlt: ' + 30 );
      // console.log('minAlt: ' + targetSession.minAlt );
      cmd = cmd.replace("$000", targetSession.targetFindName ); // set filter
      cmd = cmd.replace("$001", 30 ); // set exposure
      // var cmd = tsxCmdSlew(targetSession.ra,targetSession.dec);
      // console.log('Initial cmd: ' + cmd);

      tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
            var result = tsx_return.split('|')[0].trim();
            console.log('Any error?: ' + result);
            if( result != 'Success') {
              forceAbort = true;
              console.log('SkyX_JS_TryTarget Failed. Error: ' + result);
            }
            // if success then TheSkyX has made this point the target...
            // now get the coordinates
            cmdSuccess = true;
          }
        )
      )
    }
  },


  // Assumed balanced RA/DEC
  // Assumed Date/Time/Long/Lat correct
  // Assumed Homed
  // Assume Polar aligned (rough, or with Polemaster)
  // Assumed initial focus is done
  // Assume TPoint recalibration done
  // Assumed Accurate Polar Alignment (APA) done
  // Do not assume Autoguider calibrated, will be done once guide star found

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

      var cmd = shell.cat(tsx_cmd('SkyX_JS_Slew'));
      cmd = cmd.replace('$000', targetSession.ra ); // set filter
      cmd = cmd.replace('$001', targetSession.dec ); // set exposure
      // var cmd = tsxCmdSlew(targetSession.ra,targetSession.dec);

      tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
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
      // var cmd = tsxCmdFocus3(targetSession.focusFilter,targetSession.focusBin,targetSession.focusSamples);
      var cmd = shell.cat(tsx_cmd('SkyX_JS_Focus-3'));
      cmd = cmd.replace('$000', targetSession.focusFilter ); // set filter
      cmd = cmd.replace('$001', targetSession.focusBin); // set exposure

      tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
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
      // var cmd = tsxCmdGetFocusTemp();
      var cmd = shell.cat(tsx_cmd('SkyX_JS_GetFocTemp'));
      // cmd = cmd.replace('$000', targetSession.focusFilter ); // set filter
      // cmd = cmd.replace('$001', targetSession.focusBin); // set exposure

      tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
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
    //    C. Match Rotation/Angle if provided:
    //      a) if entered for session
    //      b) obtained from image
    var rotateSucess = false;
    if( !forceAbort && clsSuccess ) {
      // var cmd = tsxCmdMatchAngle(targetSession.angle,targetSession.scale, target.expos);
      var cmd = shell.cat(tsx_cmd('SkyX_JS_MatchAngle'));
      cmd = cmd.replace('$000', targetSession.angle );
      cmd = cmd.replace('$001', targetSession.scale);
      cmd = cmd.replace('$002', targetSession.exposure);

      tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
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
    var guidingSuccess = false;
    if( !forceAbort && guideStarSuccess ) {
      // var cmd = tsxCmdFrameAndGuide(guideStarX,guideStarY,subFrameStar );
      var cmd = shell.cat(tsx_cmd('SkyX_JS_FindAutoGuideStar'));
      cmd = cmd.replace('$000', guideStarX );
      cmd = cmd.replace('$001', guideStarY);
      // cmd = cmd.replace('$002', targetSession.exposure);

      tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
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
  startImagingTest(targetSession) {
    // use the order of the series
    var series = targetSession.takeSeries.series[0];
    console.log('\nProcesing filter: ' + series.filter);
    console.log('Series repeat: ' + series.repeat);
    console.log('Series taken: ' + series.taken);
    var remainingImages = series.repeat - series.taken;
    console.log('number of images remaining: ' + remainingImages);
    console.log('Launching take image for: ' + series.filter + ' at ' + series.exposure + ' seconds');
    var res = tsx_takeImage(series.filter,series.exposure);
    console.log('Taken image: ' +res);

    return;
  },

  startImaging(targetSession) {
    // process for each filter
    var template = TakeSeriesTemplates.findOne( {_id:targetSession.series._id});
    var seriesProcess = template.processSeries;
    console.log('Imaging process: ' + seriesProcess );

    var numFilters = template.series.length;
    console.log('Number of filters: ' + numFilters );

    // load the filters
    var takeSeries = [];
    for (var i = 0; i < template.series.length; i++) {
      var series = Seriess.findOne({_id:template.series[i].id});
      console.log('Got series - ' + template.series[i].id + ', ' + series.filter);
      if( typeof series != 'undefined') {
        takeSeries.push(series);
      }
    }
    console.log('Number of series: ' + takeSeries.length);
    // sort the by the order.
    takeSeries.sort(function(a, b){return b.order-a.order});
    console.log('Sorted series: ' + takeSeries.length);
    // set up for the cycle through the filters
    for (var i = 0; i < takeSeries.length; i++) {

      // do we go across the set of filters once and then repear
      if( seriesProcess === 'across series' ) {
        // use length and cycle until a stop condition
        var remainingImages = false;
        for (var acrossSeries = 0; acrossSeries < takeSeries.length; acrossSeries++) {
          // take image
          var series = takeSeries[acrossSeries]; // get the first in the order

          // take image
          var res = takeSeriesImage(series);
          console.log('Took image: ' +res);

          // check end conditions
          if( !remainingImages && series.taken < series.repeat ) {
            remainingImages = true;
          }
        }
        // reset to check across series again
        if( remainingImages ) {
          i=0;
        }
      }

      // do we do one whole filter first.
      else if ( seriesProcess === 'per series' ) {
        // use i to lock to the current filter
        var series = takeSeries[i]; // get the first in the order

        var numImages = series.repeat - series.taken;
        for (var perSeries = 0; perSeries < numImages; repeatSeries++) {

          // take image
          var res = takeSeriesImage(series);
          console.log('Took image: ' +res);

        }
        // now switch to next filter
      }
      else {
        console.log('*** FAILED to process seriess');
      }
    }
    // tsx_takeImage(exposure, filter)
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
