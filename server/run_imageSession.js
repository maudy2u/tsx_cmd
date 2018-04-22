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
  tsx_GetServerStateValue,
 } from '../imports/api/serverStates.js'

import { tsx_feeder } from './tsx_feeder.js'

import {shelljs} from 'meteor/akasha:shelljs';
var shell = require('shelljs');

var tsxHeader =  '/* Java Script *//* Socket Start Packet */';
var tsxFooter = '/* Socket End Packet */';
var forceAbort = false;

// **************************************************************
export function UpdateStatus( status ) {
  tsx_SetServerState( 'currentStage', status );
}

// **************************************************************
function getFilterSlot(filterName) {
  // need to look up the filters in TSX
  var filter = Filters.findOne({name: filterName});
  Meteor._debug('Found Filter ' + filterName + ' at slot: ' + filter.slot);
  return filter.slot;
}
// **************************************************************
//  cdLight =1, cdBias, cdDark, cdFlat
function getFrame(frame) {
  var frames = [
    {name: 'Light', id:1},
    {name: 'Flat', id:4},
    {name: 'Dark', id:3},
    {name: 'Bias', id:2},
  ];

  var num = frames.find(function(element) {
    return element.name == frame;
  }).id;
  Meteor._debug('Found '+frame+' frame number: ' + num);
  return num;
}

// **************************************************************
// Substrung replacement routine for the loading of tsx.js library
// replace the given strings with values...
//
// e.g. $0000 string_replace( tsx_FindTarget, '$0000', 'M1');
// Do this for each needed parameters
//
// src: https://stackoverflow.com/questions/252924/javascript-how-to-replace-a-sub-string
//
// **************************************************************
export function string_replace(haystack, find, sub) {
    return haystack.split(find).join(sub);
}

// **************************************************************
export function tsx_cmd(script) {
  Meteor._debug(' *** tsx_cmd: ' + script);
  // var src =
  var path = Npm.require('path');
  var rootPath = path.resolve('.');
  var src = rootPath.split(path.sep + '.meteor')[0];
  // var c = Meteor.absolutePath;
  // Meteor._debug('Root: ' + src);
  return src +'/imports/tsx/'+ script+'.js';
}

// **************************************************************
export function tsx_Connect() {

  var success = false;
  var cmd = shell.cat(tsx_cmd('SkyX_JS_Connect'));
  // #TODO var cmd = Assets.getText('.tsx/SkyX_JS_Connect.js');

  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        tsx_is_waiting = false;
      }
    )
  )
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
  return true;
}

// **************************************************************
export function tsx_Disconnect() {
  var success = false;
  var cmd = shell.cat(tsx_cmd('SkyX_JS_Disconnect'));

  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        tsx_is_waiting = false;
      }
    )
  )
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
  return true;
}

// **************************************************************
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

// **************************************************************
export function tsx_MntPark(defaultFilter, softPark) {
  var dts = new Date();
  var slot = 0;

  if( defaultFilter != '' ) {
    slot = getFilterSlot(defaultFilter);
  }

  if( softPark ) {
    // if true just set filter and turn off tracking
    Meteor._debug(' Soft park... ');
  }
  else {
    Meteor._debug(' Full Park... ');
  }
  var cmd = shell.cat(tsx_cmd('SkyX_JS_ParkMount'));
  cmd = cmd.replace("$000", slot ); // set filter
  cmd = cmd.replace("$001", softPark ); // set filter

  var Out;
  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        tsx_is_waiting = false;

      }
    )
  );
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
  return Out;
}

// **************************************************************
function tsx_AbortGuider() {
  var success = false;

  var cmd = String(shell.cat(tsx_cmd('SkyX_JS_AbortGuider')));

  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        tsx_is_waiting = false;

      }
    )
  )
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
  return true;
}

// **************************************************************
// Breakup into reusable sections...
// tsx_ will send TSX commands
// non-tsx_ functions are higher level
function SetUpAutoGuiding(targetSession) {
  Meteor._debug(' *** SetUpAutoGuiding: ' + targetSession.targetFindName);

  tsx_TakeAutoGuideImage( targetSession );

  var star = tsx_FindGuideStar();

  tsx_CalibrateAutoGuide( star.guideStarX, star.guideStarY );
  //
  tsx_StartAutoGuide( star.guideStarX, star.guideStarY );
}

// **************************************************************
function tsx_TakeAutoGuideImage( target ) {
  var cmd = shell.cat(tsx_cmd('SkyX_JS_TakeGuideImage'));
  var exp = tsx_GetServerState('defaultGuideExposure').value;

  cmd = cmd.replace('$000', exp );
  cmd = cmd.replace('$001', exp );

  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        UpdateStatus( "Processing guider image" );
        tsx_is_waiting = false;
      }
    )
  );

  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
}
// **************************************************************
function tsx_FindGuideStar() {
  tsx_is_waiting = true;
  var guideStarX = 0;
  var guideStarY = 0;
  // var cmd = tsxCmdFindGuideStar();
  var cmd = String( shell.cat(tsx_cmd('SkyX_JS_FindAutoGuideStar')) );
  // cmd = cmd.replace('$000', targetSession.guideExposure );
  // cmd = cmd.replace('$001', targetSession.scale);
  // cmd = cmd.replace('$002', targetSession.exposure);
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        // Meteor._debug('Any error?: ' + tsx_return);
        guideStarX = tsx_return.split('|')[0].trim();
        guideStarY = tsx_return.split('|')[1].trim();
        UpdateStatus(  "Best guide star candidate: "+guideStarX+", "+guideStarY );
        out = {
          guideStarX: guideStarX,
          guideStarY: guideStarY,
        };
        tsx_is_waiting = false;
      }
    )
  );
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
  return out;
}

// **************************************************************
function tsx_CalibrateAutoGuide(guideStarX, guideStarY) {
  tsx_is_waiting = true;
  // var cmd = tsxCmdFindGuideStar();
  var cmd = shell.cat(tsx_cmd('SkyX_JS_AutoguideCalibrate'));
  cmd = cmd.replace('$000', guideStarX );
  cmd = cmd.replace('$001', guideStarY );

  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
    tsx_is_waiting = false;
      }
    )
  )
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
}


// **************************************************************
function tsx_StartAutoGuide(guideStarX, guideStarY) {
  // star guiding
  tsx_is_waiting = true;
  // var cmd = tsxCmdFindGuideStar();
  var cmd = shell.cat(tsx_cmd('SkyX_JS_FrameAndGuide'));
  cmd = cmd.replace('$000', guideStarX );
  cmd = cmd.replace('$001', guideStarY );

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

// **************************************************************
// Try tot find the target
function tsx_TryTarget( target ) {

  var cmd = shell.cat(tsx_cmd('SkyX_JS_TryTarget'));

  // #TODO need to check last time for the target's report to
  // reduce the number of call to TSX and save timeout
  /*
    var report = TargetReports.findOne({_id: target._id});
    if( typeof report != 'undefined') {
      // check the time of the report vs. current timeout
      //
  }
  */

  cmd = cmd.replace("$000", target.targetFindName );
  cmd = cmd.replace("$001", target.minAlt );
  var Out;
  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        Out = {
          ready: tsx_return.split('|')[0].trim(),
          msg: tsx_return.split('|')[1].trim(),
        }

        // #TODO store the target report...
        /*
          Out = {
            isReady: tsx_return.split('|')[0].trim(),
            msg: tsx_return.split('|')[0].trim(),
            AZ: tsx_return.split('|')[0].trim(),
            ALT: tsx_return.split('|')[0].trim(),
            RA:  tsx_return.split('|')[0].trim(),
            DEC: tsx_return.split('|')[0].trim(),
            HA: tsx_return.split('|')[0].trim(),
            TRANSIT: tsx_return.split('|')[0].trim(),
        }
        report = {
          target: targetFindName,
          createdAt: new Date(),
          report: Out,
      }
        TargetReports.upsert( {_id: target._id}, {
          $set: {
            target: targetFindName,
            createdAt: new Date(),
            report: Out,
        }
      })
         */

        console.log( target.targetFindName + ' is ' + Out.ready);
        tsx_is_waiting = false;
      }
    )
  )
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
  return Out;
}

// **************************************************************
//    B. Slew to target
function tsx_Slew( target ) {

    var cmd = shell.cat(tsx_cmd('SkyX_JS_Slew'));
    cmd = cmd.replace('$000', target.ra );
    cmd = cmd.replace('$001', target.dec );
    // var cmd = tsxCmdSlew(targetSession.ra,targetSession.dec);

    tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
      var result = tsx_return.split('|')[0].trim();
      // Meteor._debug('Any error?: ' + result);
      if( result != 'Success') {
        forceAbort = true;
        Meteor._debug('Slew Failed. Error: ' + result);
      }
      slewSuccess = true;
    }
  ));
}

// **************************************************************
//    B. CLS to target
function tsx_CLS(targetSession) {

  var clsSuccess = false;
  var tsx_is_waiting = true;

  // var cmd = tsxCmdCLS();
  var cmd = shell.cat(tsx_cmd('SkyX_JS_CLS'));
  cmd = cmd.replace("$000", targetSession.targetFindName );
  var slot = getFilterSlot(targetSession.clsFilter);
  // Meteor._debug('Found slot: ' + slot);
  cmd = cmd.replace("$001", slot);

  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        var result = tsx_return.split('|')[0].trim();
        if( result != 'Success') {
          Meteor._debug(cmd);
          Meteor._debug('CLS Failed. Error: ' + tsx_return);
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

// **************************************************************
function tsx_RunFocus3( target ) {

  var focusFilter = getFilterSlot(target.focusFilter);

  var cmd = String(shell.cat(tsx_cmd('SkyX_JS_Focus-3')) );

  var bin;
  try {
    bin = tsx_GetServerStateValue('isFocus3Binned').value;
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
        // Meteor._debug('SkyX_JS_Focus-3 result check: ' + tsx_return);

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

// **************************************************************
function InitialFocus( target ) {
  Meteor._debug(' *** Initial @Focus3: ' + target.targetFindName);
  var result = tsx_RunFocus3( target ); // need to get the focus position
  var temp = tsx_GetFocusTemp( target ); // temp and position set inside
}

// **************************************************************
export function tsx_GetFocusTemp( target ) {
  var file = tsx_cmd('SkyX_JS_GetFocTemp');
  // Meteor._debug('File: ' + file );
  var cmd = String(shell.cat(file));
  // cmd = cmd.replace("$001", 30 ); // set exposure
  // var cmd = tsxCmdSlew(targetSession.ra,targetSession.dec);
  var Out = {
    err: true,
    errmsg: 'Focuser not found',
  }
  var tsx_is_waiting = true;
  var lastFocusTemp = 0;
  var lastFocusPos = 0;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
      // Meteor._debug('Any error?: ' + tsx_return);
      lastFocusTemp = tsx_return.split('|')[0].trim();
      tsx_SetServerState( 'lastFocusTemp', lastFocusTemp );
      Meteor._debug(' *** focusTemp: ' + lastFocusTemp);

      lastFocusPos = tsx_return.split('|')[1].trim();
      tsx_SetServerState( 'lastFocusPos', lastFocusPos );
      Meteor._debug(' *** focPosition: ' + lastFocusPos);
      Out = {
        focusTemp: lastFocusTemp,
        focPosition: lastFocusPos,
      };
      tsx_is_waiting = false;
      }
    )
  )
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }

  return Out;
}

// **************************************************************
function tsx_GetMountCoords() {

  var cmd = shell.cat(tsx_cmd('SkyX_JS_GetMntCoords'));

  var Out;

  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
      // Meteor._debug(tsx_return);
        Out = {
          ra: tsx_return.split('|')[0].trim(),
          dec: tsx_return.split('|')[1].trim(),
          hms: tsx_return.split('|')[2].trim(),
        }
        tsx_SetServerState( 'mntMntRA', Out.ra );
        tsx_SetServerState( 'mntMntDEC', Out.dec );
        tsx_SetServerState( 'mntMntMHS', Out.hms );

        tsx_is_waiting = false;
      }
    )
  )
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
  return Out;
}

// **************************************************************
function tsx_GetMountOrientation() {

  var cmd = shell.cat(tsx_cmd('SkyX_JS_GetMntOrient'));

  var Out;
  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {

        Out = {
          direction: tsx_return.split('|')[0].trim(),
          altitude: tsx_return.split('|')[1].trim(),
        }
        tsx_SetServerState( 'mntMntDir', Out.direction );
        tsx_SetServerState( 'mntMntAlt', Out.altitude );

        tsx_is_waiting = false;
      }
    )
  )
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
  return Out;
}

// **************************************************************
// Used to find the RA/DEC in the TargetEditor Details Tab
export function tsx_GetTargetRaDec(targetFindName) {

  var file = tsx_cmd('SkyX_JS_GetTargetCoords');
  // Meteor._debug('File: ' + file );
  var cmd = shell.cat(file);
  cmd = cmd.replace("$000", targetFindName );
  // cmd = cmd.replace("$001", 30 ); // set exposure
  // var cmd = tsxCmdSlew(targetSession.ra,targetSession.dec);
  var Out = "Error|Target not found.";
  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
      var success = tsx_return.split('|')[0].trim();
      // Meteor._debug('Any error?: ' + tsx_return);
      if( success != 'Success') {
        Meteor._debug('tsx_GetTargetRaDec Failed. Error: ' + tsx_return);
      }
      else {
        tsx_SetServerState( tsx_ServerStates.targetRA, tsx_return.split('|')[1].trim() );
        tsx_SetServerState( tsx_ServerStates.targetDEC, tsx_return.split('|')[2].trim() );
        tsx_SetServerState( tsx_ServerStates.targetALT, tsx_return.split('|')[3].trim() );

        // Simplify the azimuth value to simple east/west
        var azimuth = tsx_return.split('|')[4].trim();
        var dir;
        if (azimuth < 179)
        {
          dir = 'East';
        } else {
          dir = 'West';
        }
        tsx_SetServerState(tsx_ServerStates.targetAZ, dir );
        tsx_SetServerState( tsx_ServerStates.targetHA, tsx_return.split('|')[5].trim() );
        tsx_SetServerState( tsx_ServerStates.targetTransit, tsx_return.split('|')[6].trim() );

        Out = {
          ra: tsx_return.split('|')[1].trim(),
          dec: tsx_return.split('|')[2].trim(),
          alt: tsx_return.split('|')[3].trim(),
          direction: dir,
          ha: tsx_return.split('|')[5].trim(),
          transit: tsx_return.split('|')[6].trim(),
        }
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

// **************************************************************
function SetUpForImagingRun(targetSession) {
  Meteor._debug(' *** SetUpForImagingRun: ' + targetSession.targetFindName);
  //#
  //# Call the Closed-Loop-Slew function to point the mount to the target, record the mount's
  //# starting location for future comparisons, find a decent guide star and start autoguiding
  //#
	//# Kill the guider in case it's still running.
  UpdateStatus( " Start: " + targetSession.targetFindName );
  Meteor.sleep(3000); // pause 3 seconds
  UpdateStatus(  " Stopping autoguider" );
  tsx_AbortGuider();

  UpdateStatus(  " Confirming target:" + targetSession.targetFindName);
  var tryTarget = tsx_TryTarget( targetSession );
	if( !tryTarget.ready ) {
    console.log(targetSession.targetFindName + ' ' + tryTarget.msg);
    return false;
  };

  UpdateStatus(  " Centring target: "+ targetSession.targetFindName );
	tsx_CLS(targetSession); 						//# Call the Closed-Loop-Slew function to go to the target

  // needs initial focus temp
  UpdateStatus( ' Target centred: '+ targetSession.targetFindName );

  // Get Mount Coords and Orientations
	var mntCoords = tsx_GetMountCoords();
  var mntOrient = tsx_GetMountOrientation();

  // *******************************
  //    C. Match Rotation/Angle if provided:
  //      a) if entered for session
  //      b) obtained from image
  var rotateSucess = false;
  UpdateStatus( " Matching angle: " + targetSession.targetFindName );
  // rotateSucess = tsx_MatchRotation( targetSession );

  UpdateStatus( " Setup guider: " + targetSession.targetFindName );
	SetUpAutoGuiding( targetSession );			// Setup & Start Auto-Guiding.

  return true;
}

// **************************************************************
// Find a session

// - check start time
// - check for dark time... is darkenough
// - check start altitude
// - check priority
// - check for end times
// - check end alitudes
// - check morning sunrise
export function getValidTargetSession() {
  var target = findTargetSession();

  // *******************************
  // 1. Get target's Ra/Dec to Slew, options:
  //  a) Object name to find
  //  b) Image
  //  c) Ra/Dec/Atl/Az/Transit/HA
  if( typeof target == 'undefined') {
    Meteor._debug('Failed to find a valid target session.');
  }
  else {
    Meteor._debug('Found: ' + target.name);
    var result = tsx_GetTargetRaDec (target.targetFindName);
  }
  return target;
}

// **************************************************************
function tsx_DeviceInfo() {

  tsx_Connect();
  var cmd = shell.cat(tsx_cmd('SkyX_JS_DeviceInfo'));
  // cmd = cmd.replace('$000', Number(filterNum) ); // set filter
  // cmd = cmd.replace('$001', Number(exposure) ); // set exposure

  var success;
  tsx_feeder( String(cmd), Meteor.bindEnvironment((tsx_return) => {

      var errIndex = tsx_return.split('|').length-1;
      if( tsx_return.split('|')[errIndex].trim() === "No error. Error = 0.") {
         success = true;
      }
      // Meteor._debug(tsx_return);
      tsx_UpdateDevice(
        'guider',
        tsx_return.split('|')[1].trim(),
        tsx_return.split('|')[3].trim(),
      );
      Meteor._debug(2);

      tsx_UpdateDevice(
        'camera',
        tsx_return.split('|')[5].trim(),
        tsx_return.split('|')[7].trim(),
      );
      Meteor._debug(3);

      tsx_UpdateDevice(
        'efw',
        tsx_return.split('|')[9].trim(),
        tsx_return.split('|')[11].trim(),
      );
      Meteor._debug(4);

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
       Meteor._debug(5);

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

// **************************************************************
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

// **************************************************************
function tsx_isDarkEnough(target) {
  var targetFindName = target.targetFindName;

	var chkTwilight = tsx_GetServerState('isTwilightEnabled').value;
  var tsx_is_waiting = true;
	var Out = false;
	if( chkTwilight ) {

    var defaultMinSunAlt = tsx_GetServerStateValue('defaultMinSunAlt');
    if( defaultMinSunAlt == '' || typeof defaultMinSunAlt == 'undefined') {
      defaultMinSunAlt = -18;
      tsx_SetServerState('defaultMinSunAlt', -18 );
    }

    // var curDate = new Date().getTime();
    // var lastDate = tsx_GetServerStateValue('lastCheckMinSunAlt');
    // if( lastDate == '' || typeof lastDate == 'undefined') {
    //   lastDate = 0;
    //   tsx_SetServerState('lastCheckMinSunAlt', curDate );
    // }
    // else {
    //   lastDate = lastDate.getTime();
    // }
    // // The number of milliseconds in one day
    // // var ONE_DAY = 1000 * 60 * 60 * 24
    // // Calculate the difference in milliseconds
    // var difference_ms = Math.abs(lastDate - curDate);

    // if( difference_ms < ( 1000*1) ) {
      var file = tsx_cmd('SkyX_JS_Twilight');
  	  var cmd = shell.cat(file);
      cmd = cmd.replace("$000", targetFindName ); // set filter
      cmd = cmd.replace("$001", defaultMinSunAlt ); // set filter

  	  tsx_feeder(String(cmd), Meteor.bindEnvironment((tsx_return) => {
      		var result = tsx_return.split('|')[0].trim();
      		if( result  == 'Light' || result == 'Dark') {
      			if( result == 'Light') {
      				// UpdateStatus( 'Stop|' + tsx_return.split('|')[1].trim() );
              // UpdateStatus( 'Stop|Twilight - Not dark' );
      				Meteor._debug('Not dark enough');
      				Out = false;
      			}
      			else {
              Out = true;
            }
  			 }
         tsx_is_waiting = false;
     	}));
    // }
    // else {
    //   Out = false;
    //   tsx_is_waiting = false;
    // }

    while( tsx_is_waiting ) {
    	Meteor.sleep( 1000 );
    }
	}
  else {
    Meteor._debug('Twilight disabled');
    return true;
  }

  return Out;
}

// **************************************************************
// check minAlt - stop - find next
function tsx_reachedMinAlt( target ) {
  Meteor._debug('************************');
  Meteor._debug(' *** tsx_reachedMinAlt for: ' + target.targetFindName);
  var targetMinAlt = target.minAlt;
	if( typeof targetMinAlt == 'undefined' ) {
		targetMinAlt = tsx_GetServerState(tsx_ServerStates.defaultMinAltitude).value;
	}
	var result = tsx_GetTargetRaDec(target.targetFindName);
	var curAlt = result.alt;
	Meteor._debug(' *** is curAlt ' + curAlt + '<'+ ' minAlt ' + targetMinAlt);
	if( curAlt < targetMinAlt ) {
		UpdateStatus( 'Stop|Minimum Altitude Crossed' );
		return true;
	}
}

// **************************************************************
function isPriorityTarget( target ) {
  Meteor._debug('************************');
  Meteor._debug(' *** isPriorityTarget: ' + target.targetFindName);

  var priority = getHigherPriorityTarget( target );
  if( priority._id != target._id ) {
    return false;
  }
  return true;
}

// **************************************************************
/*
cur_time=datetime.datetime.now().hour+datetime.datetime.now().minute/60.
if (cur_time < 8) : cur_time=cur_time+24
if cur_time > end_time : break
*/
function hasStopTimePassed( target ) {

  var end_time = target.stopTime;
  var needToStop = isTimeBeforeCurrentTime( end_time );
  return needToStop;

}

// **************************************************************
function isMeridianFlipNeed( target ) {
  Meteor._debug('************************');
  Meteor._debug(' *** isMeridianFlipNeed: ');// + target.targetFindName);
  // do we need to flip
  var lastDir = tsx_GetServerStateValue('lastTargetDirection');
  var targetCoords = tsx_GetTargetRaDec( target.targetFindName );
  var curDir = targetCoords.direction;
  tsx_SetServerState('lastTargetDirection', curDir);
  Meteor._debug( ' *** Target pointing: ' + lastDir + ' vs ' + curDir);
  if( curDir == 'West' && lastDir == 'East') {
    // we need to flip
    Meteor._debug( ' *** Flip: ' + target.targetFindName );
    return true;
  }
  else {
    return false;
  }
}

// **************************************************************
/*
// Java Script
focPos = ccdsoftCamera.focPosition;
focTemp = ccdsoftCamera.focTemperature;
out = focPos + '|' + focTemp + '|(position,temp)';
*/
function isFocusingNeeded(target) {
  Meteor._debug('************************');
  Meteor._debug(' *** isFocusingNeeded: ' + target.targetFindName);
  var lastFocusTemp = tsx_GetServerState( 'lastFocusTemp' ).value; // get last temp
  tsx_GetFocusTemp( target ); // read new temp
  var curFocusTemp = tsx_GetServerState( 'lastFocusTemp' ).value; // get new temp
  if( typeof curFocusTemp == 'undefined' || curFocusTemp.trim() =='') {
    curFocusTemp = tsx_GetServerState('defaultFocusTempDiff').value;
  }
  var focusDiff = Math.abs(curFocusTemp - lastFocusTemp);
  var targetDiff = target.focusTemp; // diff for this target
  if( focusDiff >= targetDiff ) {
  // run @Focus3
    // tsx_RunFocus3(target);
    return true;
  }
  return false;
}

// **************************************************************
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
// return TRUE if reached end condition
function hasReachedEndCondition(target) {
	// *******************************
	// check Twilight - force stop
	var continueWithSeries = false;
  Meteor._debug(' *** hasReachedEndCondition: ' + target.targetFindName);

	var isDark = tsx_isDarkEnough(target);
	if(!isDark ) {
		return true;
	}

  var isPriority = isPriorityTarget( target );
  if( !isPriority ) {
    return true;
  }

  var minAlt = tsx_reachedMinAlt( target );
  if( minAlt ) {
		return true;
	}

	// *******************************
	// check stopTime - stop - find next
  var atStopTime = hasStopTimePassed( target );
  if( atStopTime ) {
    return true;
  }

	// *******************************
	// if meridian  - flip/slew... - preRun: focus - CLS - rotation - guidestar - guiding...
  var doFlip = isMeridianFlipNeed( target );
  if( doFlip ) {
    // okay we have a lot to do...
    // prepare target of imaging again...
    prepareTargetForImaging( target ) ;

    return false;
  }

  // NOW CONTINUE ON WITH CURRENT SPOT...
  // FOCUS AND DITHER IF NEEDED

	// *******************************
	// check reFocusTemp - refocus
  var runFocus3 = isFocusingNeeded( target );
  if( runFocus3) {
    tsx_RunFocus3(target);

    // no need to return false... can keep going.
  }

  var ditherTarget = tsx_GetServerState('defaultDithering').value;
  if( ditherTarget ) {
    var dither = tsx_dither( target );
  }

  return false;
}

// **************************************************************
function tsx_dither( target ) {

  var Out = false;
  // var cmd = tsxCmdMatchAngle(targetSession.angle,targetSession.scale, target.expos);
  var cmd = shell.cat(tsx_cmd('SkyX_JS_NewDither'));

  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        var result = tsx_return.split('|')[0].trim();
        Meteor._debug('Any error?: ' + result);
        if( result != 'Success') {
          Meteor._debug('SkyX_JS_MatchAngle Failed. Error: ' + result);
        }
        else {
          UpdateStatus('Dither success');
        }
        rotateSucess = true;
      }
    )
  );
  return rotateSucess;

}

// **************************************************************
function tsx_MatchRotation( targetSession ) {

  var rotateSucess = false;
  // var cmd = tsxCmdMatchAngle(targetSession.angle,targetSession.scale, target.expos);
  var cmd = shell.cat(tsx_cmd('SkyX_JS_MatchAngle'));
  cmd = cmd.replace('$000', targetSession.angle );
  cmd = cmd.replace('$001', targetSession.scale);
  cmd = cmd.replace('$002', targetSession.exposure);

  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        var result = tsx_return.split('|')[0].trim();
        Meteor._debug('Any error?: ' + result);
        if( result != 'Success') {
          forceAbort = true;
          Meteor._debug('SkyX_JS_MatchAngle Failed. Error: ' + result);
        }
        rotateSucess = true;
      }
    )
  );
  return rotateSucess;
}

// **************************************************************
function incrementTakenFor(target, seriesId) {
  Meteor._debug('************************');
  Meteor._debug(' *** incrementTakenFor: ' + target.targetFindName);
  var taken = 0;
  var progress = target.progress;
  if( typeof progress == 'undefined') {
    progress = [];
  }
  // increment
  var found = false;
  for (var i = 0; i < progress.length; i++) {
    if (progress[i]._id == seriesId ) {
      progress[i].taken = progress[i].taken + 1;
      taken = progress[i].taken;
      found = true;
      Meteor._debug('Found progress to update: ' + taken);
      break;
    }
  }
  if (!found) { // we are adding to the series
    Meteor._debug('added the series to progress');
    progress.push( {_id:seriesId, taken: 1} );
  }
  TargetSessions.update({_id: target._id}, {
    $set: {
      progress: progress,
    }
  });
  Meteor._debug('Updated target progress');

  return taken;
}

// **************************************************************
function takenImagesFor(target, seriesId) {
  var taken = 0;
  var progress = target.progress;
  if( typeof progress == 'undefined') {
    return taken;
  }
  for (var i = 0; i < progress.length; i++) {
    if (progress[i]._id == seriesId ) {
      taken = progress[i].taken;
      break;
    }
  }
  return taken;
}

// **************************************************************
// Use the filter and exposure to take an image
// Currently it is assumed these are Light images
// Could set frame type...
function tsx_takeImage( filterNum, exposure, frame ) {

  var success = 'Failed';

  var cmd = shell.cat(tsx_cmd('SkyX_JS_TakeImage'));

  cmd = cmd.replace("$000", filterNum ); // set filter
  cmd = cmd.replace("$001", exposure ); // set exposure
  cmd = cmd.replace("$002", frame ); // set exposure
  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        var result = tsx_return.split('|')[0].trim();
        Meteor._debug('Image: ' + result);
        if( result === "Success") {
          success = result;
        }
        else {
          Meteor._debug('Image failed: ' + tsx_return);
        }
        Meteor.sleep( 500 ); // needs a sleep before next image
        tsx_is_waiting = false;

      }
    )
  )
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
  return success;
};

// **************************************************************
function tsx_UpdateFITS( target ) {
  var cmd = shell.cat(tsx_cmd('SkyX_JS_UpdateFitsHeader'));
  cmd = cmd.replace("$000", target.targetFindName ); // set filter

  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        Meteor._debug('Image: ' + tsx_return);

        tsx_is_waiting = false;
      }
    )
  )
  while( tsx_is_waiting ) {
    Meteor.sleep( 1000 );
  }
  Meteor.sleep( 500 ); // needs a sleep before next image
}

// **************************************************************
function takeSeriesImage(target, series) {
  Meteor._debug('************************');
  Meteor._debug(' *** takeSeriesImage: ' + target.targetFindName);
  Meteor._debug('Series repeat: ' + series.repeat);
  var taken = takenImagesFor(target, series._id);
  Meteor._debug('In series taken: ' + taken);
  var remainingImages = series.repeat - taken;
  Meteor._debug('In series remaining: ' + remainingImages);
  if( (remainingImages <= series.repeat) && (remainingImages > 0) ) {
    Meteor._debug('Series: ' + series.filter + ' at ' + series.exposure + ' seconds');

    // *******************************
    // Take the image
    var slot = getFilterSlot( series.filter );
    var frame = getFrame( series.frame );//  cdLight =1, cdBias, cdDark, cdFlat

    UpdateStatus( 'Taking: ' + series.filter + '@' + series.exposure );
    tsx_takeImage( slot, series.exposure, frame );
    UpdateStatus( 'Finished: ' + series.filter + '@' + series.exposure );
    // *******************************
    // Update progress
    Meteor._debug(' *** Image taken: ' + series.filter + ' at ' + series.exposure + ' seconds');
    incrementTakenFor( target, series._id );

    // *******************************
    // ADD THE FOCUS AND ROTATOR POSITIONS INTO THE FITS HEADER
    tsx_UpdateFITS( target );
  }
  else {
    Meteor._debug(' *** Completed: ' + series.filter + ' at ' + series.exposure + ' seconds');
  }
  var jid = tsx_GetServerState('currentJob');
  if( jid == '' ) {
    // the process was stopped...
    throw(' *** END SESSIONS');
  }
  return;
}

// **************************************************************
export function processTargetTakeSeries( target ) {
  // process for each filter
  Meteor._debug('************************');
  Meteor._debug(' *** processTargetTakeSeries: ' + target.targetFindName);
  Meteor._debug('Loading TakeSeriesTemplates:' + target.series._id );
  var template = TakeSeriesTemplates.findOne( {_id:target.series._id});
  if( typeof template == 'undefined') {
    UpdateStatus('Failed - check series for: ' + target.targetFindName);
    return;
  }
  var seriesProcess = template.processSeries;
  Meteor._debug('Imaging process: ' + seriesProcess );

  var numSeries = template.series.length;
  Meteor._debug('Number of series: ' + numSeries );

  // load the filters
  var takeSeries = [];
  for (var i = 0; i < numSeries; i++) {
    var series = Seriess.findOne({_id:template.series[i].id});
    if( typeof series != 'undefined') {
      Meteor._debug('Got series - ' + template.name + ', ' + series.filter);
      takeSeries.push(series);
    }
  }
  Meteor._debug('Number of series: ' + takeSeries.length);

  // sort the by the order.
  takeSeries.sort(function(a, b){return a.order-b.order});
  Meteor._debug('Sorted series: ' + takeSeries.length);

  // set up for the cycle through the filters
  var stopTarget = false; // #IDEA #TODO can use the current jobId to potentially top
  var process = tsx_GetServerStateValue( tsx_ServerStates.imagingSessionName );

  for (var i = 0; i < takeSeries.length && !stopTarget && (process !=''); i++) {
    // #TODO do we check here for a session_id... or target name
    // id so that we continue or stop???

    // do we go across the set of filters once and then repear
    if( seriesProcess === 'across series' ) {

      // use length and cycle until a stop condition
      var remainingImages = false; // only true if an image is taken
      for (var acrossSeries = 0; acrossSeries < takeSeries.length && !stopTarget; acrossSeries++) {
        // take image
        var series = takeSeries[acrossSeries]; // get the first in the order

        // check progress
        var taken = takenImagesFor(target, series._id);
        if( taken < series.repeat ) {
          // remaining images to take image
          takeSeriesImage(target, series);
        }
        // update progress
        taken = takenImagesFor(target, series._id);
        if( taken < series.repeat ) {
          // series has more images so repeat across
          remainingImages = true;
        }

        // check end conditions
        stopTarget = hasReachedEndCondition(target);
        process = tsx_GetServerStateValue( tsx_ServerStates.imagingSessionName );

      }
      // reset to check across series again
      if( remainingImages ) {
        i=0;
      }
      else {
        Meteor._debug(' *** TARGET COMPLETED');
      }
    }

    // do we do one whole filter first.
    else if ( seriesProcess === 'per series' ) {
      // use i to lock to the current filter
      var series = takeSeries[i]; // get the first in the order

      // get progress
      var taken = takenImagesFor(target,series._id);

      // calcuate remaining images
      var remainingImages = series.repeat - taken;

      // take remaining images
      for (var perSeries = 0; perSeries < remainingImages && !stopTarget; perSeries++) {

        // take image
        takeSeriesImage(target, series);

        // check end conditions
        stopTarget = hasReachedEndCondition(target);
        process = tsx_GetServerStateValue( tsx_ServerStates.imagingSessionName );

      }
      // now switch to next filter
    }
    else {
      Meteor._debug('*** FAILED to process seriess');
    }
  }
}

// **************************************************************
export function prepareTargetForImaging( target ) {
  Meteor._debug(' *** prepareTargetForImaging: ' + target.targetFindName);

  if( typeof target == 'undefined') {
    target = 'No target found. Check constraints.'
    Meteor._debug(target);
    UpdateStatus( "Selecting failed: "+ target);
  }
  else {
    tsx_SetServerState( tsx_ServerStates.imagingSessionId, target._id );
    UpdateStatus( "Selected Target: "+ target.name);
    tsx_SetServerState( tsx_ServerStates.imagingSessionName, target.targetFindName);

    var targetCoords = tsx_GetTargetRaDec( target.targetFindName );
    var curDir = targetCoords.direction;
    tsx_SetServerState('lastTargetDirection', curDir);
    UpdateStatus( "Target: "+ target.name + ", points " + curDir);

    var ready = SetUpForImagingRun( target);

    // return target to start series...
    return target;

  }
}

// **************************************************************
// **************************************************************
// **************************************************************
Meteor.methods({

  // **************************************************************
  connectTsx() {
    Meteor._debug(' ******************************* ');
    var isOnline = tsx_ServerIsOnline();
    Meteor._debug('tsx_ServerIsOnline: ' + isOnline);
    // *******************************
    //  GET THE CONNECTED EQUIPEMENT
    Meteor._debug(' ******************************* ');
    Meteor._debug('Loading devices');

    var out = tsx_DeviceInfo();

   },

   // this from the monitor
   // it is used to test the image session
/*

Use this to set the last focus

*/
   //
   // **************************************************************
   tsxTestImageSession() {
     Meteor._debug('************************');
     prepareTargetForImaging();
   },

   // **************************************************************
  tsx_Test() {
    Meteor._debug('************************');
    Meteor._debug('tsx_Test');
    var imagingSession = getValidTargetSession();
    if (typeof imagingSession == 'undefined') {
      Meteor._debug('*** No session found');

    } else {

    }
    Meteor._debug('Starting the autoguide');
    SetUpAutoGuiding(imagingSession);

  },

  // **************************************************************
  // Used to pass RA/DEC to target editors
  targetFind(targetFindName) {
    Meteor._debug('************************');
    Meteor._debug(' *** targetFind: ' + targetFindName);
    return tsx_GetTargetRaDec(targetFindName);

  },

  // **************************************************************
  // 7. Start session run:
  //    - take image
  startImagingTest(targetSession) {
    Meteor._debug('************************');
    Meteor._debug(' *** startImagingTest: ' + targetSession.targetFindName);
    // use the order of the series
    var series = targetSession.takeSeries.series[0];
    Meteor._debug('\nProcesing filter: ' + series.filter);
    Meteor._debug('Series repeat: ' + series.repeat);
    Meteor._debug('Series taken: ' + series.taken);
    var remainingImages = series.repeat - series.taken;
    Meteor._debug('number of images remaining: ' + remainingImages);
    Meteor._debug('Launching take image for: ' + series.filter + ' at ' + series.exposure + ' seconds');

    var slot = getFilterSlot( series.filter );
    //  cdLight =1, cdBias, cdDark, cdFlat
    var frame = getFrame(series.frame);
    out = tsx_takeImage(slot,series.exposure, frame);
    Meteor._debug('Taken image: ' +res);

    return;
  },

  // **************************************************************
  // Manually start the imaging on the target...
  // Something like a one target Only
  // Assumes that CLS, Focus, Autoguide already running
  startImaging(target) {
    Meteor._debug('************************');
    Meteor._debug(' *** startImaging: ' + target.name );
    tsx_SetServerState( tsx_ServerStates.imagingSessionId, target._id );
    tsx_GetTargetRaDec (target.targetFindName);

    // Will process target until end condition found
    processTargetTakeSeries( target );
  },

  testTargetPicking() {
    Meteor._debug('************************');
    Meteor._debug(' *** testTargetPicking' );
    var target = findTargetSession();
    if( typeof target == 'undefined') {
      Meteor._debug('No target found');
    }
    else {
      Meteor._debug('Found: ' + target.targetFindName);
    }
  },

  testEndConditions() {
    Meteor._debug('************************');
    Meteor._debug(' *** testEndConditions' );
    var target = findTargetSession();
    if( typeof target == 'undefined') {
      Meteor._debug('No target found');
    }
    else {
      Meteor._debug('Found: ' + target.targetFindName);
      var endCond = hasReachedEndCondition( target );
      Meteor._debug(target.targetFindName + ' ending=' + endCond );
    }
  },

  testTryTarget() {
    Meteor._debug('************************');
    Meteor._debug(' *** testEndConditions' );

    // neeed to get a session here...
    var targets = TargetSessions.find().fetch();
    var target;
    if( targets.length > 0 ) {
      target = targets[0]; // get first target
    }

    return tsx_TryTarget( target );

  },

  centreTarget( target ) {
    UpdateStatus( ' Centring : ' + target.targetFindName );
    var result = tsx_CLS( target);
    UpdateStatus( ' Centred : ' + target.targetFindName );
    return result;
  }

});

// **************************************************************
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

  var targetSessions = TargetSessions.find({}).fetch();
  var numSessions = targetSessions.length;
  Meteor._debug('Targets to check:' + numSessions);

  // get first validSession
  var validSession;
  var foundSession = false;
  for (var i = 0; i < numSessions; i++) {
    var canStart = canTargetSessionStart( targetSessions[i]);
    // Meteor._debug( 'Checked ' + targetSessions[i].targetFindName + ': ' + canStart);
    if( canStart ) {
      validSession = targetSessions[i];
      foundSession = true;
      Meteor._debug( 'Candidate: ' + validSession.targetFindName);
      break;
    }
  }

  // now iterate the sessions to find anyting with higher
  // priotiry
  if( foundSession ) {
    validSession = getHigherPriorityTarget( validSession );
  }
  Meteor._debug('************************');
  return validSession;
}

// **************************************************************
function getHigherPriorityTarget( validSession ) {
  var targetSessions = TargetSessions.find({}).fetch();
  var numSessions = targetSessions.length;

  for (var i = 0; i < numSessions; i++) {
    var chkSession = targetSessions[i];
    if( validSession._id != chkSession._id ) {
      var canStart = canTargetSessionStart( chkSession );
      if( canStart ) {
        Meteor._debug( 'canStart: ' + chkSession.targetFindName );
        var valPriority = Number(validSession.priority);
        var chkPriority = Number(chkSession.priority);
        var chk = valPriority - chkPriority;
        if( (chk > 0) ) {
              validSession = chkSession;
              Meteor._debug( 'Priority Candidate: ' + validSession.targetFindName);
        }
      }
    }
  }
  return validSession;

}

// **************************************************************
function isTargetComplete( target ) {
  var planned = TargetSessions.findOne({_id: target._id}).totalImagesPlanned();
  var taken = TargetSessions.findOne({_id: target._id}).totalImagesTaken();
  // Meteor._debug( target.targetFindName + ' ' + taken + '/' + planned );
  if( taken < planned ) {
    return false;
  }
  return true;
}
// *************************** ***********************************

function hasStartTimePassed( target ) {
  var start_time = target.startTime;
  var canStart = isTimeBeforeCurrentTime( start_time );
  // do not start if undefined
  return canStart;
}

// **************************************************************
// #TODO used this for one consistent time comparing function
//
// 24hrs e.g.
// 21:00
// return true if undedefined
function isTimeBeforeCurrentTime( ts ) {

  if( typeof ts == 'undefined') {
    return true; // as undefined....
  }

  var cur_dts = new Date();
  var cur_time = cur_dts.getHours()+(cur_dts.getMinutes()/60);
  // Meteor._debug('Current time: ' + cur_time );

  // add 24 to the morning time so that
  ((cur_time < 8) ? cur_time=cur_time+24 : cur_time);

  // Meteor._debug('Start time: ' + start_time );
  var hrs = ts.split(':')[0].trim();
  // Meteor._debug('Start hrs: ' + hrs );
  var min = ts.split(':')[1].trim();
  // Meteor._debug('Start min: ' + min );
  ts = Number(hrs) + Number(min/60);
  ((ts < 8) ? ts=ts+24 : ts);
  // Meteor._debug('curtime: ' + cur_time + ' vs ' + ts);
  var curBefore = ((ts < cur_time ) ? true : false);
  return curBefore;
}

// *************************** ***********************************
// Check target... altitude ok, time okay,
export function canTargetSessionStart( target ) {

  var canStart = true;

  if(!target.enabledActive){
    Meteor._debug( target.targetFindName + ': not enabled');
    return false; // the session is disabled
  }

  // check for target not ready
  if( isTargetComplete( target ) ) {
    Meteor._debug( target.targetFindName + ': is completed');
    return false;
  }

  // check start time pasted
  if( !(hasStartTimePassed( target )) ) {
    UpdateStatus( target.targetFindName + ': too early ' + target.startTime );
    Meteor._debug( target.targetFindName + ': too early');
    return false;
  }

  // check stoptime pasted
  if( hasStopTimePassed( target ) ) {
    UpdateStatus( target.targetFindName + ': too late ' + target.stopTime );
    Meteor._debug( target.targetFindName + ': too late');
    return false;
  }

  // check if TSX says okay... Altitude and here
  var result = tsx_TryTarget( target );
  if( !result.ready ) {
    UpdateStatus( target.targetFindName + ': below: ' + target.minAlt );
    Meteor._debug(target.targetFindName + ': below: ' + target.minAlt);
    return false;
  }

  if( !tsx_isDarkEnough( target ) ) {
    UpdateStatus( target.targetFindName + ': Not dark enough' );
    Meteor._debug(target.targetFindName + ': Not dark enough');
    return false;
  }

  var currentTime = new Date();

  return canStart;
}
