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

import {tsx_feeder, tsx_is_waiting} from './tsx_feeder.js'

import {shelljs} from 'meteor/akasha:shelljs';
var shell = require('shelljs');

var tsxHeader =  '/* Java Script *//* Socket Start Packet */';
var tsxFooter = '/* Socket End Packet */';
var forceAbort = false;

function UpdateStatus( status ) {
  tsx_SetServerState( 'currentStage', status );
}

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
  console.log(' *** tsx_cmd: ' + script);
  // var src =
  var path = Npm.require('path');
  var rootPath = path.resolve('.');
  var src = rootPath.split(path.sep + '.meteor')[0];
  // var c = Meteor.absolutePath;
  // console.log('Root: ' + src);
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
  console.log(' *** tsx_SetUpAutoGuiding: ' + targetSession.targetFindName);
  var guideImageSuccess = false;
  // var cmd = tsxCmdTakeGuiderImage(targetSession.guideExposure, targetSession.guideDelay);
  var cmd = shell.cat(tsx_cmd('SkyX_JS_TakeGuideImage'));
  cmd = cmd.replace('$000', targetSession.guideExposure );

  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        guideImageSuccess = true;
        UpdateStatus( "Processing guider image" );
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
        UpdateStatus(  "Best guide star candidate: "+guideStarX+", "+guideStarY );
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
  UpdateStatus(  "Autoguiding started" );
}

// *******************************
// Try tot find the target
function tsx_TryTarget(targetFindName, minAlt) {
  var dts = new Date();
  console.log(' *** tsx_TryTarget: ' + targetFindName);
  var cmd = shell.cat(tsx_cmd('SkyX_JS_TryTarget'));

  cmd = cmd.replace("$000", targetFindName );
  cmd = cmd.replace("$001", minAlt );
  var Out;
  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        Out = tsx_return;
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
  console.log(' *** tsx_Slew: ' + target.targetFindName);
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
  console.log(' *** tsx_CLS: ' + targetSession.targetFindName);

  var clsSuccess = false;
  var tsx_is_waiting = true;

  // var cmd = tsxCmdCLS();
  var cmd = shell.cat(tsx_cmd('SkyX_JS_CLS'));
  cmd = cmd.replace("$000", targetSession.targetFindName );
  var slot = getFilterSlot(targetSession.clsFilter);
  // console.log('Found slot: ' + slot);
  cmd = cmd.replace("$001", slot);

  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        var result = tsx_return.split('|')[0].trim();
        if( result != 'Success') {
          console.log(cmd);
          console.log('CLS Failed. Error: ' + tsx_return);
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
  console.log(' *** tsx_RunFocus3: ' + target.targetFindName);
  var focusFilter = getFilterSlot(target.focusFilter);

  var cmd = String(shell.cat(tsx_cmd('SkyX_JS_Focus-3')) );

  var bin;
  try {
    bin = tsx_GetServerStateValue('isFocus3Binned')
  } catch (e) {
    bin = false;
  } finally {
    // nothing
  }

  cmd = cmd.replace("$000", focusFilter ); // set filter
  cmd = cmd.replace("$001", bin ); // set Bin
  cmd = cmd.replace("$002", 2 ); // set BinFactor
  // cmd = cmd.replace("$001", 30 ); // set exposure
  // var cmd = tsxCmdSlew(targetSession.ra,targetSession.dec);
  var Out;
  var tsx_is_waiting = true;

  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        var success = tsx_return.split('|')[0].trim();
        // console.log('SkyX_JS_Focus-3 result check: ' + tsx_return);

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
  console.log(' *** tsx_InitialFocus: ' + target.targetFindName);
  var dts = new Date();
  console.log(String(dts) + ': Geting intial @focus3... ');
  var result = tsx_RunFocus3( target ); // need to get the focus position
  var temp = tsx_GetFocusTemp( target ); // temp and position set inside
}

export function tsx_GetFocusTemp( target ) {
  console.log(' *** tsx_GetFocusTemp: ' + target.targetFindName);
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
      lastFocusTemp = tsx_return.split('|')[0].trim();
      tsx_SetServerState( 'lastFocusTemp', lastFocusTemp );
      console.log('Stored last focusTemp: ' + lastFocusTemp);

      lastFocusPos = tsx_return.split('|')[1].trim();
      tsx_SetServerState( 'lastFocusPos', lastFocusPos );
      console.log('Stored last focusTemp: ' + lastFocusPos);
      Out = tsx_return;
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
  console.log(' *** SetUpForImagingRun: ' + targetSession.targetFindName);
//#
  //# Call the Closed-Loop-Slew function to point the mount to the target, record the mount's
  //# starting location for future comparisons, find a decent guide star and start autoguiding
  //#
	//# Kill the guider in case it's still running.
  UpdateStatus( "Start: " + targetSession.name );
  Meteor.sleep(3000); // pause 3 seconds
  UpdateStatus(  "Stopping autoguider" );
  tsx_AbortGuider();

  UpdateStatus(  "Confirm target" );
	tsx_TryTarget(targetSession.targetFindName, targetSession.minAlt);					// If Target can't be found, exit.

  UpdateStatus(  "CLS to target" );
	tsx_CLS(targetSession) 						//# Call the Closed-Loop-Slew function to go to the target

  Meteor.sleep( 500 );						// Shouldn't be needed but give SkyX a chance to catch its breath.

  // needs initial focus temp
  UpdateStatus( 'currentStage', "Recording intial temp" );
  tsx_InitialFocus( targetSession );   //# Force a starting focus in case of mirror shift or because I forgot to.

  // needs intial Atl and Az
	var mntCoords = tsx_GetMountCoords();				// Get & Display the mount's current altitude and direction
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
  UpdateStatus( "Rotating to target angle" );
  rotateSucess = tsx_MatchRotation( targetSession );

  UpdateStatus( "Setup guider" );
	tsx_SetUpAutoGuiding();			// Setup & Start Auto-Guiding.

}

// *******************************
// Used to find the RA/DEC in the TargetEditor Details Tab
export function tsx_GetTargetRaDec(targetFindName) {
  console.log(' *** tsx_GetTargetRaDec: ' + targetFindName);
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
        var azimuth = tsx_return.split('|')[4].trim();
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
   Meteor.sleep( 3000 );
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
  console.log(' *** takeSeriesImage: ' + target.targetFindName);
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
  console.log(' *** tsx_CheckForTwight for: ' + targetFindName);
  var file = tsx_cmd('SkyX_JS_Twilight');
  var cmd = shell.cat(file);
  cmd = cmd.replace("$000", targetFindName ); // set filter

  var Out = "Error|Target not found.";
  var tsx_is_waiting = true;
  tsx_feeder(String(cmd), Meteor.bindEnvironment((tsx_return) => {
    var result = tsx_return.split('|')[0].trim();
    if( result  == 'Light' || result == 'Dark') {
      Out = tsx_return;
    }

    tsx_is_waiting = false;
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
  console.log(' *** tsx_EndConditionFound: ' + target.targetFindName);

  var continueWithSeries = false;

  var result = tsx_CheckForTwight(target);
  if(result != 'Dark' ) {
    UpdateStatus( 'Stop|Twilight - Not dark' );
    return true;
  }
  else if( result == 'Error|Target not found.') {
    UpdateStatus( 'Stop|Error|Target not found.' );
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
    UpdateStatus( 'Stop|Minimum Altitude Crossed' );
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
  var lastHA = tsx_GetServerState( 'lastHA' );
  //  var getHA

  // *******************************
  // check reFocusTemp - refocus
  /*
  // Java Script
  focPos = ccdsoftCamera.focPosition;
  focTemp = ccdsoftCamera.focTemperature;
  out = focPos + '|' + focTemp + '|(position,temp)';
  */
  var lastFocusTemp = tsx_GetServerState( 'lastFocusTemp' ); // get last temp
  tsx_GetFocusTemp(); // read new temp
  var curFocusTemp = tsx_GetServerState( 'lastFocusTemp' ); // get new temp
  var focusDiff = curFocusTemp - lastFocusTemp;
  var focusTemp = target.focusTemp;
  if( focusDiff >= focusTemp ) {
    // run @Focus3
  }


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
  console.log(' *** tsx_MatchRotation: ' + targetSession.targetFindName);
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
  console.log(' *** prepareTargetForImaging: ' + target.targetFindName);

  if( typeof target == 'undefined') {
    target = 'No target found. Check constraints.'
    console.log(target);
    UpdateStatus( "Selecting failed: "+ target);
  }
  else {
    console.log(target.name);
    TheSkyXInfos.upsert( {name: tsx_ServerStates.imagingSessionId }, {
      $set: { value: target._id }
    });
    UpdateStatus( "Selected Target: "+ target.name);


    console.log(' ****tsx_GetTargetRaDec');
    var result = tsx_GetTargetRaDec(target.targetFindName);

    SetUpForImagingRun( target);

    // return target to start series...
    return target;

  }
}

export function processTarget( target ) {
  // process for each filter
  console.log(' *** processTarget: ' + target.targetFindName);
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
    console.log(' *** targetFind: ' + targetFindName);
    return tsx_GetTargetRaDec(targetFindName);

  },

  tsx_TryTargetToImage(targetSession) {
    // *******************************
    //    B. Slew to target
    console.log(' *** tsx_TryTargetToImage: ' + targetSession.targetFindName);
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
      cmd = cmd.replace("$001", targetSession.minAlt ); // set exposure
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
    console.log(' *** targetSession: ' + targetSession.targetFindName);
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
export function findTargetSession() {
  console.log('************************');
  console.log('findTargetSession');
  var targetSessions = TargetSessions.find({}).fetch();
  var foundSession = false;
  var numSessions = targetSessions.length;
  var validSession;
  console.log('Targets to check:' + numSessions);

  // get first validSession
  for (var i = 0; i < numSessions; i++) {
    var canStart = canTargetSessionStart( targetSessions[i]);
    if( canStart ) {
      validSession = targetSessions[i];
      foundSession = true;
      break;
    }
  }

  // now iterate the sessions to find anyting with higher
  // priotiry
  if( foundSession ) {
    for (var i = 0; i < numSessions; i++) {
      if( validSession != targetSessions[i] ) {
        var chkSession = targetSessions[i];
        if( canTargetSessionStart( chkSession ) ) {
            var valPriority = Number(validSession.priority);
            var chkPriority = Number(chkSession.priority);
            var chk = valPriority - chkPriority;
            if( (chk > 0) ) {
              // if( validSession.minAlt > chk.minAlt  ) {
                // if( validSession.startTime > chk.startTime  ) {
                  validSession = chkSession;
                // }
              // }
            }
          }
        }
      }
    }
  return validSession;
};

// *******************************
// Check target... altitude ok, time okay,
export function canTargetSessionStart( target ) {
  console.log(' *** canTargetSessionStart: ' + target.targetFindName);

  var canStart = true;

  if(!target.enabledActive){
    return false; // the session is disabled
  }

  // check if TSX says okay...
  var tsxSays = tsx_TryTarget( target.targetFindName, target.minAlt);
  var result = tsxSays.split('|')[0].trim();
  if( result != 'Success') {
    UpdateStatus( target.targetFindName + tsxSays.split('|')[1].trim() );
    console.log(target.targetFindName + ' sunk too low.');
    return false;
  }

  // var eveningTwighlight = 10;
  // var morningTwighlight = 5;
  var chkTwilight = tsx_GetServerState('isTwilightEnabled');
  if( chkTwilight ){
    tsxSays = tsx_CheckForTwight( target );
    // console.log(tsxSays);
    var isDark = tsxSays.split('|')[0].trim();
    if( isDark == 'Light') {
      UpdateStatus( tsxSays.split('|')[1].trim() );
      console.log('Not dark enough');
      return false;
    }
  }
  var currentTime = new Date();


  return canStart;
}
