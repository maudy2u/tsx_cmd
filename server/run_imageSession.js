import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import { TargetSessions } from '../imports/api/targetSessions.js';
import { TakeSeriesTemplates } from '../imports/api/takeSeriesTemplates.js';
import { Seriess } from '../imports/api/seriess.js';
import { Filters } from '../imports/api/filters.js';
import { TheSkyXInfos } from '../imports/api/theSkyXInfos.js';

//Tools
import {
  tsx_UpdateDevice,
  tsx_ServerStates,
  tsx_SetServerState,
  tsx_GetServerState,
 } from '../imports/api/serverStates.js'

import {
  canTargetSessionStart,
  findTargetSession,
} from '../imports/api/sessionTools.js';

import {tsx_feeder, tsx_is_waiting} from './tsx_feeder.js'


import {shelljs} from 'meteor/akasha:shelljs';
var shell = require('shelljs');

var tsxHeader =  '/* Java Script *//* Socket Start Packet */';
var tsxFooter = '/* Socket End Packet */';
var forceAbort = false;

function incrementTakenFor( target, seriesId ) {

  if( typeof target == 'undefined' || typeof series == 'undefined' ) {
    throw 'Error in incrementTakenFor';
  }

  var progress = target.progress;
  for (var i = 0; i < progress.length; i++) {
    if( progress[i]._id == seriesId ) {
      progress[i].taken = progress[i].taken + 1;
      break;
    }
  }

  TargetSessions.upsert({_id: targetId }, {
    $set: {
      progress: progress,
      }
  });
}

function getFilterSlot(filterName) {
  // need to look up the filters in TSX
  console.log('Getting Slot number for Filter: ' + filterName);
  var filter = Filters.findOne({name: filterName});
  return filter.slot;
}

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

export function tsx_cmd(script) {
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

  var cmd = String(shell.cat(tsx_cmd('SkyX_JS_TakeImage')) );
  console.log('Switching to filter number: ' + filterNum );

  cmd = cmd.replace("$000", filterNum ); // set filter
  cmd = cmd.replace("$001", Number(exposure) ); // set exposure

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


// *******************************
// the following is an outline for running an image session
//
var imagingSession;

export function tsx_MntPark(defaultFilter, softPark) {
  var dts = new Date();
  var slot = 0;

  if( defaultFilter != '' ) {
    slot = getFilterSlot(defaultFilter);
  }

  if( softPark ) {
    // if true just set filter and turn off tracking
    console.log(String(dts) + ': Soft park... ');
  }
  else {
    console.log(String(dts) + ': Full Park... ');
  }
  var cmd = shell.cat(tsx_cmd('SkyX_JS_ParkMount'));
  cmd = cmd.replace("$000", slot ); // set filter
  cmd = cmd.replace("$001", softPark ); // set filter

  var Out;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {

      }
    )
  );

  return Out;
}

function tsx_AbortGuider() {
  var dts = new Date();
  console.log(String(dts) + ': Aborting guider... ');
  var success = false;

  var cmd = String(shell.cat(tsx_cmd('SkyX_JS_AbortGuider')));

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

function tsx_SetUpAutoGuiding(targetSession) {
  var guideImageSuccess = false;
  // var cmd = tsxCmdTakeGuiderImage(targetSession.guideExposure, targetSession.guideDelay);
  var cmd = shell.cat(tsx_cmd('SkyX_JS_TakeGuideImage'));
  cmd = cmd.replace('$000', targetSession.guideExposure );

  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        guideImageSuccess = true;
        tsx_SetServerState( 'currentStage', "Processing guider image" );
        tsx_is_waiting = false;
      }
    )
  );

  while( tsx_is_waiting() ) {
   Meteor.sleep( 1000 );
  }

  var tsx_is_waiting = true;
  var guideStarSuccess = false;
  var guideStarX = 0;
  var guideStarY = 0;
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
        tsx_is_waiting = false;
      }
    )
  );
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }

  // var cmd = tsxCmdFindGuideStar();
  var cmd = shell.cat(tsx_cmd('SkyX_JS_FrameAndGuide'));
  cmd = cmd.replace('$000', guideStarX );
  cmd = cmd.replace('$001', guideStarY );
  var tsx_is_waiting = true;
  // cmd = cmd.replace('$002', targetSession.exposure);
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
    tsx_is_waiting = false;
      }
    )
  )
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
  tsx_SetServerState( 'currentStage', "Autoguiding started" );
}

// *******************************
// Try tot find the target
function tsx_TryTarget(targetSession) {
  var dts = new Date();
  console.log(String(dts) + ': Trying Target... ');
  var cmd = shell.cat(tsx_cmd('SkyX_JS_TryTarget'));

  cmd = cmd.replace("$000", targetSession.targetFindName );
  cmd = cmd.replace("$001", targetSession.minAlt );
  // cmd = cmd.replace("$001", 30 ); // set exposure
  // var cmd = tsxCmdSlew(targetSession.ra,targetSession.dec);
  var Out;
  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        var success = tsx_return.split('|')[0].trim();
        console.log('Any error?: ' + tsx_return);
        if( success != 'Success') {
          forceAbort = true;
          console.log('SkyX_JS_TryTarget Failed. Error: ' + tsx_return);
          return;
        } else {
          Out = success;
        }
        tsx_is_waiting = false;
      }
    )
  )
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
  return Out;
}

function tsx_Slew( target ) {
  // *******************************
  //    B. Slew to target
    var cmd = shell.cat(tsx_cmd('SkyX_JS_Slew'));
    cmd = cmd.replace('$000', target.ra );
    cmd = cmd.replace('$001', target.dec );
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
//    B. CLS to target
function tsx_CLS(targetSession) {

  var clsSuccess = false;
  // var cmd = tsxCmdCLS();
  var cmd = shell.cat(tsx_cmd('SkyX_JS_CLS'));
  cmd = cmd.replace("$000", targetSession.targetFindName );
  var slot = getFilterSlot(targetSession.clsFilter);
  cmd = cmd.replace("$001", slot);
  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        var result = tsx_return.split('|')[0].trim();
        console.log('Any error?: ' + result);
        if( result != 'Success') {
          forceAbort = true;
          console.log(cmd);
          console.log('CLS Failed. Error: ' + result);
        }
        clsSuccess = true;
        tsx_is_waiting = false;
      }
    )
  );
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }

  return clsSuccess;
}

function tsx_RunFocus3( target ) {
  var focusFilter = getFilterSlot(target.focusFilter);

  var cmd = String(shell.cat(tsx_cmd('SkyX_JS_Focus-3')) );
  cmd = cmd.replace("$000", focusFilter ); // set filter
  cmd = cmd.replace("$001", "No" ); // set Bin
  // cmd = cmd.replace("$001", 30 ); // set exposure
  // var cmd = tsxCmdSlew(targetSession.ra,targetSession.dec);
  var Out;
  var tsx_is_waiting = true;

  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        var success = tsx_return.split('|')[0].trim();
        console.log('SkyX_JS_Focus-3 result check: ' + tsx_return);

        Out = success;
        tsx_is_waiting = false;
      }
    )
  )
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }

  return Out;
}

function tsx_InitialFocus( target ) {
  var dts = new Date();
  console.log(String(dts) + ': Geting intial @focus3... ');
  var result = tsx_RunFocus3( target );
  var temp = tsx_GetFocusTemp( target );
  tsx_SetServerState( 'lastFocusTemp', temp );
}

export function tsx_GetFocusTemp( target ) {
  console.log('tsx_GetFocusTemp: ' + target.targetFindName);
  var file = tsx_cmd('SkyX_JS_GetFocTemp');
  // console.log('File: ' + file );
  var cmd = String(shell.cat(file));
  // cmd = cmd.replace("$001", 30 ); // set exposure
  // var cmd = tsxCmdSlew(targetSession.ra,targetSession.dec);
  var Out = "Error|Focuser not found.";
  var tsx_is_waiting = true;
  var lastFocusTemp = 0;
  var lastFocusPos = 0;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
      console.log('Any error?: ' + tsx_return);
      if( success == 'Error') {
        console.log('SkyX_JS_GetFocTemp Failed. Error: ' + tsx_return);
      }
      else {
        lastFocusTemp = tsx_return.split('|')[0].trim();
        lastFocusPos = tsx_return.split('|')[1].trim();
        Out = tsx_return;
      }
      tsx_is_waiting = false;
      }
    )
  )
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }

  return Out;
}

function tsx_GetMountCoords() {
  var dts = new Date();
  console.log(String(dts) + ': Geting mount coordinates... ');

  var cmd = shell.cat(tsx_cmd('SkyX_JS_GetMntCoords'));

  var Out;
  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        Out = {
          ra: tsx_return.split('|')[0].trim(),
          dec: tsx_return.split('|')[1].trim(),
          hms: tsx_return.split('|')[2].trim(),
        }
        tsx_is_waiting = false;
      }
    )
  )
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
  return Out;
}

function tsx_GetMountOrientation() {
  var dts = new Date();
  console.log(String(dts) + ': Geting mount orientiation... ');

  var cmd = shell.cat(tsx_cmd('SkyX_JS_GetMntOrient'));

  var Out;
  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {

        Out = {
          direction: tsx_return.split('|')[0].trim(),
          altitude: tsx_return.split('|')[1].trim(),
        }
        tsx_is_waiting = false;
      }
    )
  )
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
  return Out;
}

function SetUpForImagingRun(targetSession) {
  //#
  //# Call the Closed-Loop-Slew function to point the mount to the target, record the mount's
  //# starting location for future comparisons, find a decent guide star and start autoguiding
  //#
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
  var initTemp = tsx_InitialFocus( targetSession );   //# Force a starting focus in case of mirror shift or because I forgot to.
  tsx_SetServerState( 'initialFocusTemperature', initTemp );

  // needs intial Atl and Az
	var mntCoords = tsx_GetMntAltAz();				// Get & Display the mount's current altitude and direction
  tsx_SetServerState( 'initialMntRA', mntCoords.ra );
  tsx_SetServerState( 'initialMntDEC', mntCoords.dec );
  tsx_SetServerState( 'initialMntMHS', mntCoords.mhs );

  var mntOrient = tsx_GetMountOrientation();
  tsx_SetServerState( 'initialMntDir', mntCoords.direction );
  tsx_SetServerState( 'initialMntAlt', mntCoords.altitude );

  // *******************************
  //    C. Match Rotation/Angle if provided:
  //      a) if entered for session
  //      b) obtained from image
  var rotateSucess = false;
  tsx_SetServerState( 'currentStage', "ROtating to target angle" );
  rotateSucess = tsx_MatchRotation( targetSession );

  tsx_SetServerState( 'currentStage', "Setup guider" );
	tsx_SetUpAutoGuiding();			// Setup & Start Auto-Guiding.

}

// *******************************
// Used to find the RA/DEC in the TargetEditor Details Tab
export function tsx_GetTargetRaDec(targetFindName) {
  console.log('tsx_GetTargetRaDec: ' + targetFindName);
  var file = tsx_cmd('SkyX_JS_GetTargetCoords');
  // console.log('File: ' + file );
  var cmd = shell.cat(file);
  cmd = cmd.replace("$000", targetFindName );
  // cmd = cmd.replace("$001", 30 ); // set exposure
  // var cmd = tsxCmdSlew(targetSession.ra,targetSession.dec);
  var Out = "Error|Target not found.";
  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
      var success = tsx_return.split('|')[0].trim();
      // console.log('Any error?: ' + tsx_return);
      if( success != 'Success') {
        console.log('tsx_GetTargetRaDec Failed. Error: ' + tsx_return);
      }
      else {
        tsx_SetServerState( tsx_ServerStates.targetRA, tsx_return.split('|')[1].trim() );
        tsx_SetServerState( tsx_ServerStates.targetDEC, tsx_return.split('|')[2].trim() );
        tsx_SetServerState( tsx_ServerStates.targetALT, tsx_return.split('|')[3].trim() );

        // Simplify the azimuth value to simple east/west
        var azimuth = result.split('|')[4].trim();
        if (azimuth < 179)
        {
          tsx_SetServerState(tsx_ServerStates.targetAZ, 'East');
        } else {
          tsx_SetServerState(tsx_ServerStates.targetAZ, 'West');
        }
        tsx_SetServerState( tsx_ServerStates.targetHA, tsx_return.split('|')[5].trim() );
        tsx_SetServerState( tsx_ServerStates.targetTransit, tsx_return.split('|')[6].trim() );
        tsx_SetServerState( tsx_ServerStates.targetName, targetFindName);

        Out = tsx_return;
      }
      tsx_is_waiting = false;
      }
    )
  )
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }

  return Out;
}

// *******************************
//
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
export function getValidTargetSession() {
  var target = findTargetSession();

  // *******************************
  // 1. Get target's Ra/Dec to Slew, options:
  //  a) Object name to find
  //  b) Image
  //  c) Ra/Dec/Atl/Az/Transit/HA
  if( typeof target == 'undefined') {
    console.log('Failed to find a valid target session.');
  }
  else {
    console.log('Found: ' + target.name);
    var tsx_is_waiting = true;
    var result = tsx_GetTargetRaDec (target.targetFindName);
  }
  return target;
}

function takeSeriesImage(target, series) {
  console.log('Entered : takeSeriesImage');
  console.log('Procesing filter: ' + series.filter);
  console.log('Series repeat: ' + series.repeat);
  var taken = target.takenImagesFor(series._id);
  console.log('Series taken: ' + taken);
  var remainingImages = series.repeat - taken;
  console.log('number of images remaining: ' + remainingImages);
  if( (remainingImages <= series.repeat) && (remainingImages > 0) ) {
    console.log('Launching take image for: ' + series.filter + ' at ' + series.exposure + ' seconds');

    var slot = getFilterSlot(series.filter);
    var res = tsx_takeImage(slot,series.exposure);
    // console.log('Taken image: ' +res);
    console.log('Taken image');
    var taken = target.incrementTakenFor(series._id);
  }
}

function tsx_DeviceInfo() {

  var cmd = shell.cat(tsx_cmd('SkyX_JS_DeviceInfo'));
  // cmd = cmd.replace('$000', Number(filterNum) ); // set filter
  // cmd = cmd.replace('$001', Number(exposure) ); // set exposure

  var success;
  tsx_feeder( String(cmd), Meteor.bindEnvironment((tsx_return) => {

      var errIndex = tsx_return.split('|').length-1;
      if( tsx_return.split('|')[errIndex].trim() === "No error. Error = 0.") {
         success = true;
      }
      console.log(1);
      tsx_UpdateDevice(
        'guider',
        tsx_return.split('|')[1].trim(),
        tsx_return.split('|')[3].trim(),
      );
      console.log(2);

      tsx_UpdateDevice(
        'camera',
        tsx_return.split('|')[5].trim(),
        tsx_return.split('|')[7].trim(),
      );
      console.log(3);

      tsx_UpdateDevice(
        'efw',
        tsx_return.split('|')[9].trim(),
        tsx_return.split('|')[11].trim(),
      );
      console.log(4);

      tsx_UpdateDevice(
        'focuser',
        tsx_return.split('|')[13].trim(),
        tsx_return.split('|')[15].trim(),
      );

      tsx_UpdateDevice(
        'mount',
        tsx_return.split('|')[17].trim(),
        tsx_return.split('|')[19].trim(),
      );

       tsx_UpdateDevice(
         'rotator',
         tsx_return.split('|')[21].trim(),
         tsx_return.split('|')[23].trim(),
       );

       var numBins = tsx_return.split('|')[25].trim();
       tsx_SetServerState(
         'numberOfBins',
         numBins
       );
       var numFilters = tsx_return.split('|')[27].trim();
       tsx_SetServerState(
         'numberOfFilters',
         numFilters
       );
       console.log(5);

       // if too many filters... reduce to matching
       // if not enough then upsert will clean up
       var filters = Filters.find({}, { sort: { slot: 1 } }).fetch();
       if( filters.length > numFilters ) {
         // need to reduce the filters
         for (var i = 0; i < filters.length; i++) {
           if( filters[i].slot > numberFilters-1) {
              Filters.remove(filters[i]._id);
           }
         }
       }

       var index = 28; // the next position after the numFilters
       for (var i = 0; i < numFilters; i++) {
         var name = tsx_return.split('|')[index+i].trim();
         Filters.upsert( {slot: i }, {
           $set: {
             name: name,
            }
         });
       }
     }
  ));
}

function tsx_ServerIsOnline() {
  var success = 'Error|';
  var cmd = tsxHeader + tsxFooter;
  tsx_feeder( cmd, Meteor.bindEnvironment((tsx_return) => {
    if( tsx_return == 'undefined|No error. Error = 0.') {
      success = 'Success|';
    }
  }));
  return success;
}

function tsx_CheckForTwight(target) {
  console.log('************************');
  var targetFindName = target.targetFindName;
  console.log('tsx_CheckForTwight for: ' + targetFindName);
  var file = tsx_cmd('SkyX_JS_Twilight');
  var cmd = shell.cat(file);
  cmd = cmd.replace("$000", targetFindName ); // set filter

  var Out = "Error|Target not found.";
  var tsx_is_waiting = true;
  tsx_feeder(String(cmd), Meteor.bindEnvironment((tsx_return) => {
    var result = tsx_return.split('.')[0].trim();

    if( tsx_return == 'Light' || result == 'Dark') {
      Out = tsx_return + '|';
    }
    var tsx_is_waiting = false;
  }));
  while( tsx_is_waiting ) {
    Meteor.sleep( 1000 );
  }
  return Out;
}

function tsx_EndConditionFound(target) {
  // *******************************
  // tsx_takeImage(exposure, filter)
  // check Twilight - force stop

  var continueWithSeries = false;

  var result = tsx_CheckForTwight(target);
  if(result != 'Dark' ) {
    tsx_SetServerState( tsx_ServerStates.currentStage, 'Stop|Twilight - Not dark' );
    return true;
  }
  else if( result == 'Error|Target not found.') {
    tsx_SetServerState( tsx_ServerStates.currentStage, 'Stop|Error|Target not found.' );
    return true;
  }
  // *******************************
  // check minAlt - stop - find next
  var targetMinAlt = target.minAlt;
  if( typeof targetMinAlt == 'undefined' ) {
    targetMinAlt = tsx_GetServerState(tsx_ServerStates.defaultMinAltitude);
  }
  result = tsx_GetTargetRaDec(target.targetFindName);
  var curAlt = result.split('|')[3].trim();
  console.log('Test - is curAlt ' + curAlt + '<'+ ' minAlt ' + targetMinAlt);
  if( curAlt < targetMinAlt ) {
    tsx_SetServerState( tsx_ServerStates.currentStage, 'Stop|Minimum Altitude Crossed' );
    return true;
  }
  // *******************************
  // check stopTime - stop - find next
  /*
  cur_time=datetime.datetime.now().hour+datetime.datetime.now().minute/60.
  if (cur_time < 8) : cur_time=cur_time+24
  if cur_time > end_time : break
  */


  // *******************************
  // if not meridian - dither...
  // if meridian  - flip/slew... - preRun: focus - CLS - rotation - guidestar - guiding...
  var lastFocusTemp = tsx_GetServerState( 'lastHA' );
  //  var getHA

  // *******************************
  // check reFocusTemp - refocus
  /*
  // Java Script
  focPos = ccdsoftCamera.focPosition;
  focTemp = ccdsoftCamera.focTemperature;
  out = focPos + '|' + focTemp + '|(position,temp)';
  */
  result  = tsx_GetFocusTemp();
  var lastFocusTemp = tsx_GetServerState( 'lastFocusTemp' );
  var focusDiff = result - lastFocusTemp;
  var focusTemp = target.focusTemp;
  if( focusDiff >= focusTemp ) {
    // run @Focus3
  }
  tsx_SetServerState( 'lastFocusTemp', result );
  console.log('Stored last focusTemp: ' + result);


  // if targetDone/stopped... find next
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


}

function tsx_MatchRotation( targetSession ) {
  var rotateSucess = false;
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
          console.log('SkyX_JS_MatchAngle Failed. Error: ' + result);
        }
        rotateSucess = true;
      }
    )
  );
  return rotateSucess;
}

export function prepareTargetForImaging( target ) {
  console.log('************************');
  console.log('prepareTargetForImaging');

  if( typeof target == 'undefined') {
    target = 'No target found. Check constraints.'
    console.log(target);
    tsx_SetServerState( 'currentStage', "Selecting failed: "+ target);
  }
  else {
    console.log(target.name);
    TheSkyXInfos.upsert( {name: tsx_ServerStates.imagingSessionId }, {
      $set: { value: target._id }
    });
    tsx_SetServerState( tsx_ServerStates.currentStage, "Selected Target: "+ target.name);


    console.log(' ****tsx_GetTargetRaDec');
    var result = tsx_GetTargetRaDec(target.targetFindName);

    SetUpForImagingRun( target);

    // return target to start series...
    return target;

  }
}

export function processTarget( target ) {
  // process for each filter
  console.log('Loading TakeSeriesTemplate:' + target.series._id );
  var template = TakeSeriesTemplates.findOne( {_id:target.series._id});
  var seriesProcess = template.processSeries;
  console.log('Imaging process: ' + seriesProcess );

  var numSeries = template.series.length;
  console.log('Number of series: ' + numSeries );

  // load the filters
  var takeSeries = [];
  for (var i = 0; i < numSeries; i++) {
    var series = Seriess.findOne({_id:template.series[i].id});
    if( typeof series != 'undefined') {
      console.log('Got series - ' + template.name + ', ' + series.filter);
      takeSeries.push(series);
    }
  }
  console.log('Number of series: ' + takeSeries.length);
  // sort the by the order.
  takeSeries.sort(function(a, b){return b.order-a.order});
  console.log('Sorted series: ' + takeSeries.length);
  // set up for the cycle through the filters

  var stopTarget = false;
  for (var i = 0; i < takeSeries.length && !stopTarget; i++) {

    // do we go across the set of filters once and then repear
    if( seriesProcess === 'across series' ) {
      // use length and cycle until a stop condition
      var remainingImages = false;
      for (var acrossSeries = 0; acrossSeries < takeSeries.length && !stopTarget; acrossSeries++) {
        // take image
        var series = takeSeries[acrossSeries]; // get the first in the order

        // take image
        var res = takeSeriesImage(target, series);
        console.log('Took image: ' +res);

        // update progress
        var taken = target.takenImagesFor(series._id);
        if( !remainingImages && taken < series.repeat ) {
          remainingImages = true;
        }

        // check end conditions
        stopTarget = tsx_EndConditionFound();
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

      var taken = target.takenImagesFor(series._id);
      var numImages = series.repeat - taken;
      for (var perSeries = 0; perSeries < numImages && !stopTarget; repeatSeries++) {

        // take image
        var res = takeSeriesImage(target, series);
        console.log('Took image: ' +res);

        // update progress
        var taken = target.takenImagesFor(series._id);

        // check end conditions
        stopTarget = tsx_EndConditionFound();

      }
      // now switch to next filter
    }
    else {
      console.log('*** FAILED to process seriess');
    }
  }
}

// ********************************
Meteor.methods({

  connectTsx() {
    console.log(' ******************************* ');
    var isOnline = tsx_ServerIsOnline();
    console.log('tsx_ServerIsOnline: ' + isOnline);
    // *******************************
    //  GET THE CONNECTED EQUIPEMENT
    console.log(' ******************************* ');
    console.log('Loading devices');

    var out = tsx_DeviceInfo();

   },

   // this from the monitor
   // it is used to test the image session
/*

Use this to set the last focus

*/
   //
   tsxTestImageSession() {
     prepareTargetForImaging();
   },

  tsx_Test() {
    console.log('************************');
    console.log('tsx_Test');
    var imagingSession = getValidTargetSession();
    if (typeof imagingSession == 'undefined') {
      console.log('*** No session found');

    } else {

    }
    console.log('Starting the autoguide');
    tsx_SetUpAutoGuiding(imagingSession);

  },

  // Used to pass RA/DEC to target editors
  targetFind(targetFindName) {
    console.log('************************');
    console.log('Starting targetFind');
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
      cmd = cmd.replace("$000", targetSession.targetFindName );
      cmd = cmd.replace("$001", 30 ); // set exposure
      // var cmd = tsxCmdSlew(targetSession.ra,targetSession.dec);
      // console.log('Initial cmd: ' + cmd);
      var tsx_is_waiting = true;
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
            tsx_is_waiting = false;
          }
        )
      )
      while( tsx_is_waiting ) {
       Meteor.sleep( 1000 );
      }
    }
  },

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

    var slot = getFilterSlot( series.filter );
    var res = tsx_takeImage(slot,series.exposure);
    console.log('Taken image: ' +res);

    return;
  },

  startImaging(targetSessionId) {
    var target = TargetSessions.findOne({_id:targetSessionId});
    console.log('Found session: ' + target.name );
    processTarget( target );
  },

});
