/*
tsx cmd - A web page to send commands to TheSkyX server
    Copyright (C) 2018  Stephen Townsend

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import {
  tsxInfo,
  tsxLog,
  tsxErr,
  tsxWarn,
  tsxDebug,
} from '../imports/api/theLoggers.js';

import { TargetSessions } from '../imports/api/targetSessions.js';
import { TargetReports } from '../imports/api/targetReports.js';
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
  UpdateStatus,
  UpdateStatusWarn,
  UpdateStatusErr,
  postProgressTotal,
  postStatus,
  UpdateImagingSesionID,
 } from '../imports/api/serverStates.js'

import { tsx_feeder } from './tsx_feeder.js'

import {shelljs} from 'meteor/akasha:shelljs';
var shell = require('shelljs');

var tsxHeader =  '/* Java Script *//* Socket Start Packet */';
var tsxFooter = '/* Socket End Packet */';
var forceAbort = false;

// *******************************
function isSchedulerStopped() {
  // tsxDebug('************************');
  tsxDebug(' *** isSchedulerStopped ' );

  var process = tsx_GetServerStateValue( 'imagingSessionId' );
  if(
    (typeof process != 'undefined'
    || process != '')
    && tsx_GetServerStateValue('currentJob') != ''
  ) {
    return false; // exit
  }
  return true;
}

// **************************************************************
function getFilterSlot(filterName) {
  // need to look up the filters in TSX
  var filter = Filters.findOne({name: filterName});
  tsxInfo(' Found Filter ' + filterName + ' at slot: ' + filter.slot);
  return filter.slot;
}
// **************************************************************
//  cdLight =1, cdBias, cdDark, cdFlat
function getFrame(frame) {
  // tsxDebug('************************');
  tsxDebug(' *** getFrame: ' + frame );

  var frames = [
    {name: 'Light', id:1},
    {name: 'Flat', id:4},
    {name: 'Dark', id:3},
    {name: 'Bias', id:2},
  ];

  var num = frames.find(function(element) {
    return element.name == frame;
  }).id;
  tsxInfo('Found '+frame+' frame number: ' + num);
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
  tsxInfo(' *** tsx_cmd: ' + script);

  var src = Assets.getText(script+'.js');
  return src;
}

// **************************************************************
export function tsx_Connect() {
  tsxDebug('************************');
  tsxDebug(' *** tsx_Connect' );

  var success = false;
  var cmd = tsx_cmd('SkyX_JS_Connect');
  // #TODO var cmd = Assets.getText('.tsx/SkyX_JS_Connect.js');

  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        tsx_is_waiting = false;
      }
    )
  );
  while( tsx_is_waiting ) {
    Meteor.sleep( 1000 );
  }
  return true;
}

// **************************************************************
export function tsx_Disconnect() {
  tsxDebug('************************');
  tsxDebug(' *** tsx_Disconnect' );

  var success = false;
  var cmd = tsx_cmd('SkyX_JS_Disconnect');

  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        tsx_is_waiting = false;
      }
    )
  );
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
  // tsxDebug('************************');
  tsxDebug(' *** tsx_MntPark' );

  var dts = new Date();
  var slot = 0;

  if( defaultFilter != '' ) {
    slot = getFilterSlot(defaultFilter);
  }
  else {
    slot = 0;
  }

  if( softPark ) {
    // if true just set filter and turn off tracking
    UpdateStatus(' Soft Parking... ');
  }
  else {
    UpdateStatus(' Full Parking... ');
  }
  var cmd = tsx_cmd('SkyX_JS_ParkMount');
  cmd = cmd.replace("$000", slot ); // set filter
  cmd = cmd.replace("$001", softPark ); // set filter

  var Out;
  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        var result = tsx_return.split('|')[0].trim();

        if( result == 'Parked' || result == 'Soft Parked' ) {
          UpdateStatus( ' ' + result );
        }
        else {
          Out = result;
          UpdateStatus( ' !!! Parking err: ' + result );
        }

        tsx_is_waiting = false;
  }));
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
  return Out;
}

// **************************************************************
export function tsx_AbortGuider() {
  var success = false;
  // tsxDebug('************************');
  tsxDebug(' *** tsx_AbortGuider');

  var cmd = tsx_cmd('SkyX_JS_AbortGuider');

  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        tsx_is_waiting = false;

  }));
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
  // tsxDebug('************************');
  tsxDebug(' *** SetUpAutoGuiding: ' + targetSession.targetFindName );

  UpdateStatus(' Setup Guiding for: ' + targetSession.targetFindName);

  tsx_TakeAutoGuideImage( targetSession );
  if( isSchedulerStopped() ) {
    return;
  }

  var star = tsx_FindGuideStar();
  if( isSchedulerStopped() ) {
    return;
  }

  tsx_StartAutoGuide( star.guideStarX, star.guideStarY );
}

// **************************************************************
function tsx_TakeAutoGuideImage( target ) {
  // tsxDebug('************************');
  tsxDebug(' *** tsx_TakeAutoGuideImage: ' + target.targetFindName );

  var cmd = tsx_cmd('SkyX_JS_TakeGuideImage');
  var exp = tsx_GetServerState('defaultGuideExposure').value;

  cmd = cmd.replace('$000', exp );
  cmd = cmd.replace('$001', exp );

  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        tsxInfo( " Autoguider image taken" );
        tsx_is_waiting = false;
  }));

  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
}
// **************************************************************
function tsx_FindGuideStar() {
  // tsxDebug('************************');
  tsxDebug(' *** tsx_FindGuideStar' );

  tsx_is_waiting = true;
  var guideStarX = 0;
  var guideStarY = 0;
  // var cmd = tsxCmdFindGuideStar();
  var cmd = tsx_cmd('SkyX_JS_FindAutoGuideStar');
  // cmd = cmd.replace('$000', targetSession.guideExposure );
  // cmd = cmd.replace('$001', targetSession.scale);
  // cmd = cmd.replace('$002', targetSession.exposure);
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        // tsxDebug('Any error?: ' + tsx_return);
        guideStarX = tsx_return.split('|')[0].trim();
        guideStarY = tsx_return.split('|')[1].trim();
        UpdateStatus( " Best guide star candidate: "+guideStarX+", "+guideStarY );
        out = {
          guideStarX: guideStarX,
          guideStarY: guideStarY,
        };
        tsx_is_waiting = false;
  }));
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
  return out;
}

// **************************************************************
function tsx_CalibrateAutoGuide(guideStarX, guideStarY) {
  // tsxDebug('************************');
  tsxDebug(' *** tsx_CalibrateAutoGuide' );

  tsx_is_waiting = true;
  // var cmd = tsxCmdFindGuideStar();
  var cmd = tsx_cmd('SkyX_JS_AutoguideCalibrate');
  cmd = cmd.replace('$000', guideStarX );
  cmd = cmd.replace('$001', guideStarY );

  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
    tsx_is_waiting = false;
  }));
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
}


// **************************************************************
function tsx_StartAutoGuide(guideStarX, guideStarY) {
  // tsxDebug('************************');
  tsxDebug(' *** tsx_StartAutoGuide' );

  // star guiding
  tsx_is_waiting = true;
  // var cmd = tsxCmdFindGuideStar();
  var cmd = tsx_cmd('SkyX_JS_FrameAndGuide');
  cmd = cmd.replace('$000', guideStarX );
  cmd = cmd.replace('$001', guideStarY );

  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
    tsx_is_waiting = false;
  }));
  while( tsx_is_waiting ) {
    Meteor.sleep( 1000 );
  }
  UpdateStatus(  " Autoguiding started" );
}

// **************************************************************
//    B. Slew to target
function tsx_Slew( target ) {
  // tsxDebug('************************');
  tsxDebug(' *** tsx_Slew: ' + target.targetFindName );

    var cmd = tsx_cmd('SkyX_JS_Slew');
    cmd = cmd.replace('$000',  target.targetFindName  );

    var tsx_waiting = true;
    tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
      var result = tsx_return.split('|')[0].trim();
      // tsxDebug('Any error?: ' + result);
      if( result != 'Success') {
        forceAbort = true;
        UpdateStatus('Slew Failed. Error: ' + result);
      }
      tsx_is_waiting = false;
    }));
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
}

// **************************************************************
//    B. CLS to target
function tsx_CLS( target ) {
  // tsxDebug('************************');
  tsxInfo(' *** tsx_CLS: ' + target.targetFindName );

  var doCLS = tsx_GetServerStateValue( 'defaultCLSEnabled' );
  if( doCLS == false ) {
    return false;
  }

  var clsSuccess = tsx_CLS_target( target.targetFindName, target.clsFilter );
  // Update the target angle...
  if( clsSuccess.angle != -1 ) {

    var rid = TargetReports.upsert( { target_id: target._id }, {
      $set: {
        angle: clsSuccess.angle,
      }
    });
    var rpt = target.report;
    rpt.angle = clsSuccess.angle;
    TargetSessions.update({_id: target._id} , {
      $set: {
        report_id: rid,
        report: rpt,
      }
    });
  }
  // tsxInfo( ' clsSuccess angle: ' + clsSuccess.angle );
  return clsSuccess;
}

function tsx_CLS_target( target, filter ) {
  // tsxDebug('************************');
  tsxDebug(' *** tsx_CLS_target: ' + target );

  var clsSuccess = {
    angle: -1, // not set
    rotPos: -1, // not set
  };
  var tsx_is_waiting = true;

  // var cmd = tsxCmdCLS();
  var cmd = tsx_cmd('SkyX_JS_CLS');
  cmd = cmd.replace("$000", target );
  var slot = getFilterSlot(filter);
  // tsxDebug('Found slot: ' + slot);
  cmd = cmd.replace("$001", slot);

  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
      var result = tsx_return.split('|')[0].trim();
      if( result != 'Success') {
        // tsxDebug(cmd);
        UpdateStatusErr(' !!! Centring Failed. Error: ' + tsx_return);
      }
      else {
        tsxInfo(' Centred: ' + target );
        var angle = tsx_return.split('|')[1].trim();
        clsSuccess.angle = angle;
        tsxInfo( ' Position Angle: ' + clsSuccess.angle );

        var rotPos;
        try {
          rotPos = tsx_return.split('|')[2].trim();
          clsSuccess.rotPos = rotPos;
        }
        finally {
          // all good do nothing
        }
      }

      // reset dithering....
      tsx_SetServerState('imagingSessionDither', 0);
      tsx_is_waiting = false;
  }));

  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
  // tsxInfo( ' clsSuccess angle out: ' + clsSuccess.angle );

  return clsSuccess;
}

// **************************************************************
function tsx_RunFocus3( target ) {
  // tsxDebug('************************');
  tsxDebug(' *** tsx_RunFocus3: ' + target.targetFindName );

  var Out;
  var enabled = tsx_GetServerStateValue('isFocus3Enabled');
  if( enabled == true  ) {
    var focusFilter = getFilterSlot(target.focusFilter);
    var focusExp = target.focusExposure;
    var focusTarget = target.focusTarget;

    if( focusTarget != '' ) {
      var res = tsx_CLS_target( focusTarget, target.clsFilter);
      // if( res == false ) {
      //   tsx_Slew(target);
      // }
    }

    var cmd = tsx_cmd('SkyX_JS_Focus-3');

    cmd = cmd.replace("$000", focusFilter ); // set filter
    cmd = cmd.replace("$001", focusExp ); // set Bin

    var tsx_is_waiting = true;
    UpdateStatus(' *** @Focus3 started');

    tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
      //[[B^[[B^[[BI20180708-01:53:13.485(-3)?   [SERVER]|2018-07-08|01:53:13|[DEBUG]| ??? @Focusing-3 returned: TypeError: Error code = 5 (5). No additional information is available.|No error. Error = 0
          tsxDebug( ' ??? @Focusing-3 returned: ' + tsx_return );
          var temp = tsx_return.split('|')[0].trim();
          var postion = tsx_return.split('|')[1].trim();
          if( temp == 'TypeError: Error code = 5 (5). No additional information is available.') {
              temp = tsx_GetServerState( 'initialFocusTemperature' ).value;
              UpdateStatus( ' !!! Error find focus.' );
          }
          // Focuser postion (1232345345) using LUM Filter
          UpdateStatus(' Focuser postion (' + postion + ') and temp ('+temp+') using ' + target.focusFilter + ' filter.');

          Out = temp;
          tsx_is_waiting = false;
        }
      )
    )
    while( tsx_is_waiting ) {
     Meteor.sleep( 1000 );
    }
    if( focusTarget != '' ) {
      var res = tsx_CLS( target );
      // if( res == false ) {
      //   tsx_Slew(target);
      // }
    }

    UpdateStatus(' *** @Focus3 finished.');
    return Out;
  }
  UpdateStatus(' *** @Focus3 diabled');
  Out = tsx_GetServerState( 'initialFocusTemperature' ).value; // get last temp
  return Out;
}

// **************************************************************
function InitialFocus( target ) {
  // tsxDebug('************************');
  UpdateStatus(' *** Initial @Focus3: ' + target.targetFindName);
//  tsx_AbortGuider( );
  var temp = tsx_RunFocus3( target ); // need to get the focus position
  tsxDebug( ' Initial Focus temp: ' + temp );
  // var temp = result.split('|')[0].trim();
//  var temp = tsx_GetFocusTemp( target ); // temp and position set inside
  tsx_SetServerState( 'initialFocusTemperature', temp);
}

// **************************************************************
export function tsx_GetFocusTemp( target ) {
  // tsxDebug('************************');
  tsxDebug(' *** tsx_GetFocusTemp: ' + target.targetFindName );

  var cmd = tsx_cmd('SkyX_JS_GetFocTemp');
  // tsxDebug('File: ' + file );
  // cmd = cmd.replace("$001", 30 ); // set exposure
  // var cmd = tsxCmdSlew(targetSession.ra,targetSession.dec);
  var Out = {
    err: true,
    errmsg: 'Focuser not found',
  }
  var lastFocusTemp = 0;
  var lastFocusPos = 0;

  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
      // tsxDebug('Any error?: ' + tsx_return);
      lastFocusTemp = tsx_return.split('|')[0].trim();
      tsx_SetServerState( 'lastFocusTemp', lastFocusTemp );
      tsxDebug(' *** focusTemp: ' + lastFocusTemp);

      lastFocusPos = tsx_return.split('|')[1].trim();
      tsx_SetServerState( 'lastFocusPos', lastFocusPos );
      tsxDebug(' *** focPosition: ' + lastFocusPos);
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
function tsx_GetMountReport() {
  // tsxDebug('************************');
  tsxDebug(' *** tsx_GetMountReport' );

  var cmd = tsx_cmd('SkyX_JS_GetMntReport');

  var Out;

  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
       tsxDebug(tsx_return);
        Out = {
          ra: tsx_return.split('|')[0].trim(),
          dec: tsx_return.split('|')[1].trim(),
          hms: tsx_return.split('|')[2].trim(),
          direction: tsx_return.split('|')[3].trim(),
          altitude: tsx_return.split('|')[4].trim(),
        }
        tsx_SetServerState( 'mntMntRA', Out.ra );
        tsx_SetServerState( 'mntMntDEC', Out.dec );
        tsx_SetServerState( 'mntMntMHS', Out.hms );
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
function SetUpForImagingRun(targetSession) {
  tsxDebug('************************');
  tsxDebug(' *** SetUpForImagingRun: ' + targetSession.targetFindName );
  //#
  //# Call the Closed-Loop-Slew function to point the mount to the target, record the mount's
  //# starting location for future comparisons, find a decent guide star and start autoguiding
  //#
	//# Kill the guider in case it's still running.
  UpdateStatus( " Setup target: " + targetSession.targetFindName );
  Meteor.sleep(3000); // pause 3 seconds
  // UpdateStatus(  " Stopping autoguider" );
  // tsx_AbortGuider(); // now done in CLS

  var tryTarget = UpdateImagingTargetReport( targetSession );
	if( !tryTarget.ready ) {
    tsxDebug(targetSession.targetFindName + ' ' + tryTarget.msg);
    return false;
  };

  UpdateStatus(  " Centre target: "+ targetSession.targetFindName );
	var cls = tsx_CLS(targetSession); 						//# Call the Closed-Loop-Slew function to go to the target
  if( cls.angle == -1 ) {
    UpdateStatus( ' Target centred FAILED: ' + cls.angle);
    return false; // the angle should be set other than -1
  }
  if( isSchedulerStopped() ) {
    return false; // exit
  }

  // needs initial focus temp
  UpdateStatus( ' Target centred: '+ targetSession.targetFindName );

  // #TODO test out the Calibrate....
  // tsx_CalibrateAutoGuide( star.guideStarX, star.guideStarY );

  // Get Mount Coords and Orientations
	var mntOrient = tsx_GetMountReport();
  if( isSchedulerStopped() ) {
    return false; // exit
  }

  // *******************************
  //    C. Match Rotation/Angle if provided:
  //      a) if entered for session
  //      b) obtained from image
  var rotateSucess = false;
  UpdateStatus( " Matching angle: " + targetSession.targetFindName );
  // rotateSucess = tsx_MatchRotation( targetSession );

  // get initial focus....
  // #TODO: get the focus to create date/time of last focus... before redoing...
  InitialFocus( targetSession );
  if( isSchedulerStopped() ) {
    return false; // exit
  }

  // UpdateStatus( " Setup guider: " + targetSession.targetFindName );
	SetUpAutoGuiding( targetSession );			// Setup & Start Auto-Guiding.
  if( isSchedulerStopped() ) {
    return false; // exit
  }

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
  // tsxDebug('************************');
  tsxDebug(' *** getValidTargetSession' );

  var target = findTargetSession();

  // *******************************
  // 1. Get target's Ra/Dec to Slew, options:
  //  a) Object name to find
  //  b) Image
  //  c) Ra/Dec/Atl/Az/Transit/HA
  if( typeof target == 'undefined') {
    tsxDebug('Failed to find a valid target session.');
  }
  else {
    UpdateStatus(' Valid target: ' + target.targetFindName);
    var result = UpdateImagingTargetReport (target);
  }
  return target;
}

// **************************************************************
function tsx_DeviceInfo() {
  // tsxDebug('************************');
  tsxDebug(' *** tsx_DeviceInfo' );

  // tsx_Connect();
  var cmd = tsx_cmd('SkyX_JS_DeviceInfo');
  // cmd = cmd.replace('$000', Number(filterNum) ); // set filter
  // cmd = cmd.replace('$001', Number(exposure) ); // set exposure

  var success;
  tsx_feeder( String(cmd), Meteor.bindEnvironment((tsx_return) => {
      tsxDebug(tsx_return);
      var errIndex = tsx_return.split('|').length-1;
      if( tsx_return.split('|')[errIndex].trim() != "No error. Error = 0.") {
	       tsxDebug( tsx_return );
         return;
      }
      if( tsx_return.split('|')[0].trim() === "TypeError: The operation failed because there is no connection to the device. Error = 200.") {
	      tsxDebug( tsx_return );
        UpdateStatus('The operation failed because there is no connection to the device.');
	      return;
      }

      tsx_UpdateDevice(
        'guider',
        tsx_return.split('|')[1].trim(),
        tsx_return.split('|')[3].trim(),
      );

      tsx_UpdateDevice(
        'camera',
        tsx_return.split('|')[5].trim(),
        tsx_return.split('|')[7].trim(),
      );

      tsx_UpdateDevice(
        'efw',
        tsx_return.split('|')[9].trim(),
        tsx_return.split('|')[11].trim(),
      );

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
       UpdateStatus( ' Devices Updated');
     }
  ));
}

// **************************************************************
export function tsx_ServerIsOnline() {
  // tsxDebug('************************');
  tsxDebug(' *** tsx_ServerIsOnline' );

  var success = false;
  var cmd = tsxHeader + tsxFooter;
  var tsx_is_waiting = true;
  tsx_feeder( cmd, Meteor.bindEnvironment((tsx_return) => {
    try{
      var result = tsx_return.split('|')[0].trim();
      if( result == 'undefined') {
        success = true;
      }
    }
    finally {
      tsx_is_waiting = false;
    }
  }));
  while( tsx_is_waiting ) {
    Meteor.sleep( 3000 );
  }

  return success;
}

// **************************************************************
function tsx_isDarkEnough(target) {
  // tsxDebug('************************');
  tsxDebug(' *** tsx_isDarkEnough: ' + target.targetFindName );

  var targetFindName = target.targetFindName;
  UpdateImagingTargetReport( target );
	var chkTwilight = tsx_GetServerState('isTwilightEnabled').value;
  tsxDebug(' Twilight check enabled: ' + chkTwilight);
  var tsx_is_waiting = true;
	if( chkTwilight ) {
    // tsxDebug(target.report);
    tsxDebug('Dark enough for ' + target.targetFindName +': ' + target.report.isDark);
    if( target.report.isDark == 'false') {
      tsxDebug( 'Dark enough found to be false');
      return false;
    }
    else {
      tsxDebug( 'Dark enough found to be true');
      return true;
    }
	}
  else {
    tsxDebug('Twilight disabled');
    return true;
  }
}

// **************************************************************
// check minAlt - stop - find next
function tsx_reachedMinAlt( target ) {
  // tsxDebug('************************');
  tsxDebug(' *** tsx_reachedMinAlt for: ' + target.targetFindName);

  var targetMinAlt = target.minAlt;
	if( typeof targetMinAlt == 'undefined' ) {
		targetMinAlt = tsx_GetServerState(tsx_ServerStates.defaultMinAltitude).value;
	}
	var curAlt = target.report.ALT;
	UpdateStatus(' ' + target.targetFindName + ': is curAlt (' + curAlt + ') <'+ ' minAlt ' + targetMinAlt);
	if( curAlt < targetMinAlt ) {
		UpdateStatus( ' Stop. Below Minimum Altitude.' );
		return true;
	}
  return false;
}

// **************************************************************
function isPriorityTarget( target ) {
  // tsxDebug('************************');
  tsxDebug(' *** isPriorityTarget: ' + target.targetFindName);

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
  // tsxDebug('************************');
  tsxDebug(' *** hasStopTimePassed: ' + target.targetFindName );

  var end_time = target.stopTime;
  var needToStop = isTimeBeforeCurrentTime( end_time );
  return needToStop;

}

// **************************************************************
function isMeridianFlipNeed( target ) {
  // tsxDebug('************************');
  tsxDebug(' *** isMeridianFlipNeed: ' + target.targetFindName );

  // do we need to flip
  var lastDir = tsx_GetServerStateValue('lastTargetDirection');
  var curDir = target.report.AZ;
  tsx_SetServerState('lastTargetDirection', curDir);
  tsxLog( ' *** Target pointing: ' + lastDir + ' vs ' + curDir);
  if( curDir == 'West' && lastDir == 'East') {
    // we need to flip
    tsxLog( ' *** Flip: ' + target.targetFindName );
    return true;
  }
  else {
    tsxLog( ' *** NO Flip: ' + target.targetFindName );
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
  // tsxDebug('************************');
  tsxDebug(' *** isFocusingNeeded: ' + target.targetFindName);

  var lastFocusTemp = tsx_GetServerState( 'initialFocusTemperature' ).value; // get last temp
  tsxDebug( ' lastFocus temp: ' + lastFocusTemp );
  if( lastFocusTemp == 'Simulator' ) {
    tsxDebug(' !!! Simulator will not do focus calculations');
    return false;
  }

  var curFocusTemp = target.report.focusTemp; // read new temp
  tsxDebug( ' curFocusTemp temp: ' + curFocusTemp );
  if( typeof curFocusTemp == 'undefined' ) {
    curFocusTemp = lastFocusTemp;
  }
  var focusDiff = Math.abs(curFocusTemp - lastFocusTemp).toFixed(2);
  var targetDiff = target.tempChg; // diff for this target
  tsxLog('Focus diff('+targetDiff+'): ' + focusDiff + '='+curFocusTemp +'-'+lastFocusTemp );
  if( focusDiff >= targetDiff ) {
  // returning true tell caller to run  @Focus3
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
function UpdateImagingTargetReport( target ) {
  // tsxDebug('************************');
  tsxDebug(' *** UpdateImagingTargetReport: ' + target.targetFindName );

  // how old is report... if less than 1 minute get report
  var rpt;
  var tRprt = target.report;
  if( typeof tRprt == 'undefined' || tRprt == '' || tRprt == false ) {
    UpdateStatus(' Create TargetReport: ' + target.targetFindName);
    tRprt = tsx_TargetReport( target );
  }
  var cTime = new Date();
  // tsxDebug('Current time: ' + cTime );
  var msecDiff = cTime - tRprt.updatedAt;
  // tsxDebug('Report time diff: ' + msecDiff);
  var mm = Math.floor(msecDiff / 1000 / 60);
  if( mm > 1 ) { // one minte passed so update report.
    UpdateStatus(' Refresh TargetReport: ' + target.targetFindName);
    rpt = tsx_TargetReport( target );
  }
  else {
    tsxDebug(' Reuse TargetReport: ' + target.targetFindName);
    rpt = target.report;
  }

  // Now have reprt and need to set the variables
  // the other checks use
  if( rpt != false && typeof rpt != 'undefined' && rpt != '') {
    TargetSessions.upsert({_id: target._id}, {
      $set:{
        report: rpt,
      }
    });
  }

  return rpt;
}


// need to return true if to stop
function isTargetConditionsInValid(target) {
  tsxDebug('************************');
  tsxDebug(' *** isTargetConditionsInValid: ' + target.targetFindName );
  UpdateStatus(' *** Check target: ' + target.targetFindName );

  // *******************************
  if( isSchedulerStopped() ) {
    return true; // exit
  }

  // *******************************
  // reassess the target state
  if( !(canTargetSessionStart( target )) ) {
    tsxDebug(' ' + target.targetFindName + ' cannot continue!!');
    return true;
  }

  // *******************************
  // confirm should use same target... and not higher priority
  var priorityTarget = getHigherPriorityTarget( target ); // no return
  if( priorityTarget.targetFindName != target.targetFindName ) {
    tsxDebug(' ' + target.targetFindName + ' has been replaced by ' + priorityTarget.targetFindName );
    return true;
  }

	// *******************************
	// if meridian  - flip/slew...
  // i.e. preRun:
  // - focus - CLS - rotation - guidestar - guiding...
  var doFlip = isMeridianFlipNeed( target );
  if( doFlip ) {
    // okay we have a lot to do...
    // prepare target of imaging again...
    // no need to focus or dither as done in prerun
    tsxDebug( ' *** meridian flip need detected.');
    prepareTargetForImaging( target ) ;

    return false; // all good continue
  }

  // *******************************
  // NOW CONTINUE ON WITH CURRENT SPOT...
  // FOCUS AND DITHER IF NEEDED
  //
	// *******************************
	// check if reFocusTemp - needs to refocus
  var runFocus3 = isFocusingNeeded( target );
  if( runFocus3 ) {
    InitialFocus( target );
    // no need to return false... can keep going.
  }
  //
  // *******************************
  // check if a dither is needed
  var ditherTarget = tsx_GetServerStateValue('defaultDithering');
  if( ditherTarget > 0 ) {
    var dither = tsx_dither( target );
  }

  tsxDebug( ' isTargetConditionsInValid return false to continue.');
  return false;
}

// **************************************************************
function tsx_dither( target ) {
  // tsxDebug('************************');
  tsxDebug(' *** tsx_dither: ' + target.targetFindName);

  var ditherTarget = tsx_GetServerStateValue('defaultDithering');
  var lastDither = tsx_GetServerStateValue('imagingSessionDither');
  var Out = false;

  if( ditherTarget > 0 ) {
    if( lastDither > ditherTarget +1 ) { // adding a plus one so the zero works and if one is passed it will rung once.

        // first abort Guiding
        tsx_AbortGuider(); // #TODO can put into dither if needed.

        var cmd = tsx_cmd('SkyX_JS_NewDither');

        var pixelSize = tsx_GetServerStateValue('imagingPixelSize');
        tsxDebug(' *** pixelSize: ' + pixelSize);
        var minDitherFactor = tsx_GetServerStateValue('minDitherFactor');
        tsxDebug(' *** minDitherFactor: ' + minDitherFactor);
        var maxDitherFactor = tsx_GetServerStateValue('maxDitherFactor');
        tsxDebug(' *** maxDitherFactor: ' + maxDitherFactor);

        cmd = cmd.replace("$000", pixelSize ); // var pixelSize = $000; // 3.8;
        cmd = cmd.replace("$001", minDitherFactor ); // var minDitherFactor = $001; // 3
        cmd = cmd.replace("$002", maxDitherFactor ); // var maxDitherFactor = $002;  // 7;

        var tsx_is_waiting = true;
        tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
              var result = tsx_return.split('|')[0].trim();
              tsxDebug('Any error?: ' + result);
              if( result != 'Success') {
                tsxLog('SkyX_JS_NewDither Failed. Error: ' + result);
              }
              else {
                // tsxLog('Dither success');
                UpdateStatus('Dither success');
              }
              Out = true;
              tsx_is_waiting = false;
            }
          )
        );
        while( tsx_is_waiting ) {
          Meteor.sleep( 1000 );
        }

        // now redo Autoguiding...
        tsxDebug( ' Dither commands AutoGuide Redo');
        SetUpAutoGuiding( target );


      tsx_SetServerState('imagingSessionDither', 0);
    }
    else {
      tsx_SetServerState('imagingSessionDither', lastDither+1);
    }
  }

  return Out;

}

// **************************************************************
function tsx_TargetReport( target ) {
  // tsxDebug('************************');
  tsxDebug(' *** tsx_TargetReport: ' + target.targetFindName);

  // var cmd = tsxCmdMatchAngle(targetSession.angle,targetSession.scale, target.expos);
  var cmd = tsx_cmd('SkyX_JS_TargetReport');
  cmd = cmd.replace('$000', target.targetFindName );

  var sunAlt = tsx_GetServerStateValue( 'defaultMinSunAlt');
  if( typeof sunAlt === 'undefined') {
    // hard coded to ~ nautical twilight
    // #TODO put the sun altitude into Settings
    sunAlt = -15;
  }

  cmd = cmd.replace('$001', sunAlt);
  cmd = cmd.replace('$002', target.minAlt);
  tsxDebug(' TargetReport.target:', target.targetFindName);
  tsxDebug(' TargetReport.sunAlt:', sunAlt);
  tsxDebug(' TargetReport.minAlt:', target.minAlt);
  var Out;
  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        // e.g.
        // false|6.812618943699146|
        // true|West|42.2|5.593339690591149|22.023446766485247|3.4187695344846833|16.2723491463255240.0|0|
        // No error. Error = 0.
        var cmdErr = tsx_return.split('|')[0].trim();
        if( cmdErr == 'TsxError') {
          tsxWarn('!!! TheSkyX connection is not working!');
          tsxDebug( tsx_return );
          tsx_is_waiting = false;
          return false;
        }
        var result = tsx_return.split('|')[0].trim();
        if( result == 'TypeError: Object not found. Error = 250.') {
          tsxErr('!!! TargetReport failed.');
          tsxDebug( tsx_return );
          tsx_is_waiting = false;
          return false;
        }

        var isDark = tsx_return.split('|')[0].trim();
        var sunAlt = tsx_return.split('|')[1].trim();
        var isValid = tsx_return.split('|')[2].trim();

        // isValid will be false if not found or exception within script
        if( isValid != 'true' ) {
          tsxDebug( tsx_return );
          UpdateStatus('!!! TargetReport failed. Check target and connection.');
          tsx_is_waiting = false;
          return false;
        }

        var az, alt, ra, dec, ha,
          transit, focTemp, focPostion,
          ready, readyMsg;

        // #TODO can add star detect in case of clouds...

        // if( isValid ) {
        az = tsx_return.split('|')[3].trim();
        alt = tsx_return.split('|')[4].trim();
        ra = tsx_return.split('|')[5].trim();
        dec = tsx_return.split('|')[6].trim();
        ha = tsx_return.split('|')[7].trim();
        transit = tsx_return.split('|')[8].trim();
        ready = tsx_return.split('|')[9].trim();
        readyMsg = tsx_return.split('|')[10].trim();
        try { // try to get focuser info
          focTemp = tsx_return.split('|')[11].trim();
          focPostion = tsx_return.split('|')[12].trim();
        }
        catch(e) {
            // no need
            focTemp='';
            focPostion='';
        }
        var update = new Date();
        Out = {
          scale: '',
          isValid: isValid,
          AZ: az,
          direction: az,
          ALT: alt,
          RA:  ra,
          DEC: dec,
          HA: ha,
          TRANSIT: transit,
          isDark: isDark,
          sunAltitude: sunAlt,
          focusTemp: focTemp,
          focusPostion: focPostion,
          updatedAt: update,
          ready: ready,
          readyMsg: readyMsg,
        };

        var rid = TargetReports.upsert( { target_id: target._id }, {

          $set: {
            isValid: isValid,
            RA:  ra,
            DEC: dec,
            ALT: alt,
            AZ: az,
            HA: ha,
            direction: az,
            scale: '',
            TRANSIT: transit,
            isDark: isDark,
            sunAltitude: sunAlt,
            focusTemp: focTemp,
            focusPostion: focPostion,
            updatedAt: update,
            ready: ready,
            readyMsg: readyMsg,
          }
        });
        TargetSessions.update({_id: target._id} , {
          $set: {
            report_id: rid,
            report: Out,
          }
        });
        // }
        // tsxDebug(Out);
        target.report = Out;

        tsx_SetServerState( tsx_ServerStates.targetRA, ra );
        tsx_SetServerState( tsx_ServerStates.targetDEC, dec );
        tsx_SetServerState( tsx_ServerStates.targetALT, alt );
        tsx_SetServerState(tsx_ServerStates.targetAZ, az );
        tsx_SetServerState( tsx_ServerStates.targetHA, ha );
        tsx_SetServerState( tsx_ServerStates.targetTransit, transit );

        tsx_is_waiting = false;
  }));
  while( tsx_is_waiting ) {
    Meteor.sleep( 1000 );
  }
  return Out;
}

// **************************************************************
function tsx_MatchRotation( targetSession ) {
  // tsxDebug('************************');
  tsxDebug(' *** tsx_MatchRotation: ' + target.targetFindName);

  var rotateSucess = false;
  // var cmd = tsxCmdMatchAngle(targetSession.angle,targetSession.scale, target.expos);
  var cmd = tsx_cmd('SkyX_JS_MatchAngle');
  cmd = cmd.replace('$000', targetSession.angle );
  cmd = cmd.replace('$001', targetSession.scale);
  cmd = cmd.replace('$002', targetSession.exposure);

  var tsx_feeder = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        var result = tsx_return.split('|')[0].trim();
        tsxDebug('Any error?: ' + result);
        if( result != 'Success') {
          forceAbort = true;
          tsxLog('SkyX_JS_MatchAngle Failed. Error: ' + result);
        }
        rotateSucess = true;
        tsxLog( 'Rotated to : GET ANGLE');
        tsx_feeder = false;
        tsx_is_waiting = false;
      }
    )
  );
  while( tsx_is_waiting ) {
    Meteor.sleep( 1000 );
  }

  return rotateSucess;
}

// **************************************************************
function incrementTakenFor(target, seriesId) {
  // tsxDebug('************************');
  tsxDebug(' *** incrementTakenFor: ' + target.targetFindName);
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
      tsxDebug('Found progress to update: ' + taken);
      break;
    }
  }
  if (!found) { // we are adding to the series
    tsxDebug('added the series to progress');
    progress.push( {_id:seriesId, taken: 1} );
  }
  TargetSessions.update({_id: target._id}, {
    $set: {
      progress: progress,
    }
  });
  tsxDebug('Updated target progress');

  return taken;
}

// **************************************************************
function takenImagesFor(target, seriesId) {
  // tsxDebug('************************');
  tsxDebug(' *** takenImagesFor: ' + target.targetFindName);

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
  // tsxDebug('************************');
  tsxDebug(' *** tsx_takeImage: ' + filterNum );

  var success = 'Failed';

  var cmd = tsx_cmd('SkyX_JS_TakeImage');
  postProgressTotal(exposure);

  cmd = cmd.replace("$000", filterNum ); // set filter
  cmd = cmd.replace("$001", exposure ); // set exposure
  cmd = cmd.replace("$002", frame ); // set exposure
  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        var result = tsx_return.split('|')[0].trim();
        tsxDebug('Image: ' + result);
        if( result === "Success") {
          success = result;
        }
        else {
          tsxDebug('Image failed: ' + tsx_return);
        }
        Meteor.sleep( 500 ); // needs a sleep before next image
        tsx_is_waiting = false;

      }
    )
  )
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
   if( isSchedulerStopped() ) {
     tsx_is_waiting = false;
     success = false;
   }
  }
  return success;
};

// **************************************************************
function tsx_UpdateFITS( target ) {
  // tsxDebug('************************');
  tsxDebug(' *** tsx_UpdateFITS: ' + target.targetFindName);

  var cmd = tsx_cmd('SkyX_JS_UpdateFitsHeader');
  cmd = cmd.replace("$000", target.targetFindName ); // set filter

  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        tsxDebug('Image: ' + tsx_return);

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
  // tsxDebug('************************');
  tsxDebug(' *** takeSeriesImage: ' + target.targetFindName);

  tsxDebug('Series repeat: ' + series.repeat);
  var taken = takenImagesFor(target, series._id);
  tsxDebug('In series taken: ' + taken);
  var remainingImages = series.repeat - taken;
  tsxDebug('In series remaining: ' + remainingImages);
  if( (remainingImages <= series.repeat) && (remainingImages > 0) ) {
    tsxDebug('Series: ' + series.filter + ' at ' + series.exposure + ' seconds');

    // *******************************
    // Take the image
    var slot = getFilterSlot( series.filter );
    var frame = getFrame( series.frame );//  cdLight =1, cdBias, cdDark, cdFlat
    var num = taken+1;
    UpdateStatus( ' *** Taking: ' + num + '/' +series.repeat + ' of ' + series.filter + ' at ' + series.exposure + ' seconds' );
    // postStatus('Capturing: '+ series.filter + '@' + series.exposure);

    var res = tsx_takeImage( slot, series.exposure, frame );
    if( res != false ) {
      UpdateStatus( ' *** Finished: ' + num + '/' +series.repeat + ' of ' + series.filter + ' at ' + series.exposure + ' seconds' );
      // *******************************
      // Update progress
      // tsxLog(' *** Image taken: ' + series.filter + ' at ' + series.exposure + ' seconds');
      incrementTakenFor( target, series._id );

      // *******************************
      // ADD THE FOCUS AND ROTATOR POSITIONS INTO THE FITS HEADER
      tsx_UpdateFITS( target );
    }
  }
  else {
    UpdateStatus(' *** Completed: ' + series.filter + ' at ' + series.exposure + ' seconds');
  }
  var jid = tsx_GetServerState('currentJob');
  if( jid == '' ) {
    // the process was stopped...
    tsxDebug('Throwing in imaging...');
    throw(' *** END SESSIONS');
  }
  return;
}

// **************************************************************
export function processTargetTakeSeries( target ) {
  // process for each filter
  tsxDebug(' *** processTargetTakeSeries: ' + target.targetFindName);

  var template = TakeSeriesTemplates.findOne( {_id:target.series._id});
  if( typeof template == 'undefined') {
    UpdateStatus('Failed - check series for: ' + target.targetFindName);
    return;
  }
  tsxDebug('Loading TakeSeriesTemplates:' + target.series.value );
  UpdateStatus(' Loading Series - ' + template.name);
  var seriesProcess = template.processSeries;
  tsxDebug('Imaging process: ' + seriesProcess );

  var numSeries = template.series.length;
  tsxDebug('Number of takeSeries: ' + numSeries );

  // load the filters
  var takeSeries = [];
  for (var i = 0; i < numSeries; i++) {
    var series = Seriess.findOne({_id:template.series[i].id});
    if( typeof series != 'undefined') {
      tsxDebug(' Found - ' + template.name + ' - filter: ' + series.filter);
      takeSeries.push(series);
    }
  }
  tsxDebug(' Number of filters: ' + takeSeries.length);

  // sort the by the order.
  takeSeries.sort(function(a, b){return a.order-b.order});
  tsxDebug(' Sorted series order: ' + takeSeries.length);

  // create report
  var seriesReport = ' Using: template.name \n';
  seriesReport = ' processing: ' + template.processSeries + '\n';
  for (var i = 0; i < numSeries; i++) {
    var series = Seriess.findOne({_id:template.series[i].id});
    if( typeof series != 'undefined') {
      seriesReport = seriesReport + 'Filter: ' + series.filter + '@' + series.exposure + ' sec, ' + series.repeat + ' times\n';
    }
  }
  tsxDebug( seriesReport );

  // set up for the cycle through the filters
  var stopTarget = false; // #IDEA #TODO can use the current jobId to potentially stop
  for (var i = 0; i < takeSeries.length && !stopTarget && (!isSchedulerStopped() ); i++) {
    // #TODO do we check here for a session_id... or target name
    // id so that we continue or stop???

    // do we go across the set of filters once and then repear
    if( seriesProcess === 'across series' ) {

      // use length and cycle until a stop condition
      var remainingImages = false; // only true if an image is taken
      for (var acrossSeries = 0; acrossSeries < takeSeries.length && !stopTarget && (!isSchedulerStopped()); acrossSeries++) {
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
        stopTarget = isTargetConditionsInValid(target);
        // tsxDebug( 'stopTarget returns: ' + stopTarget);
        // tsxDebug( 'acrossSeriess has: ' + acrossSeries);
        // tsxDebug( 'takeSeries.length:' + takeSeries.length);
        // tsxDebug( 'isSchedulerStopped()' + isSchedulerStopped());
      }
      // reset to check across series again
      if( remainingImages ) {
        i=-1; //  set to -1 so that it is incremented back to zero...

        // so the issue is in here... for some reason the continue to processSeries
        // the next image is not happening..

        tsxDebug( ' there are remaining images.');
      }
      else {
        UpdateStatus(' *** TARGET COMPLETED');
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
      for (var perSeries = 0; perSeries < remainingImages && !stopTarget && (!isSchedulerStopped()); perSeries++) {

        // take image
        takeSeriesImage(target, series);

        // check end conditions
        stopTarget = isTargetConditionsInValid(target);

      }
      // now switch to next filter
    }
    else {
      tsxLog('*** FAILED to process seriess');
    }
  }

  UpdateStatus( " Target stopped: "+ target.targetFindName );
  tsx_AbortGuider();
  var filter = tsx_GetServerStateValue('defaultFilter');
  return;
}

// **************************************************************
export function prepareTargetForImaging( target ) {
  tsxDebug('************************');
  tsxInfo(' *** prepareTargetForImaging: ' + target.targetFindName);

  if( typeof target == 'undefined') {
    target = 'No target found. Check constraints.'
    UpdateStatus( " Selecting failed: "+ target);
    return false;
  }
  else {
    UpdateImagingSesionID( target._id );
    UpdateStatus( " Target selected: "+ target.targetFindName);

    var targetCoords = UpdateImagingTargetReport( target );
    var curDir = targetCoords.direction;
    tsx_SetServerState('lastTargetDirection', curDir);
    UpdateStatus( " Target: "+ target.targetFindName + ", points " + curDir);

    var ready = SetUpForImagingRun( target);

    // return target to start series...
    return ready;
  }
}


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
  // tsxDebug('************************');
  tsxDebug(' *** findTargetSession: ' );

  var targetSessions = TargetSessions.find({ enabledActive: true }).fetch();
  var numSessions = targetSessions.length;
  tsxLog(' Targets to check: ' + numSessions);

  // get first validSession
  var validSession;
  var foundSession = false;
  for (var i = 0; i < numSessions; i++) {
    var canStart = canTargetSessionStart( targetSessions[i]);
    // tsxLog( 'Checked ' + targetSessions[i].targetFindName + ': ' + canStart);
    if( canStart ) {
      validSession = targetSessions[i];
      foundSession = true;
      UpdateStatus( ' Candidate: ' + validSession.targetFindName);
      break;
    }
  }

  // now iterate the sessions to find anyting with higher
  // priotiry
  if( foundSession ) {
    validSession = getHigherPriorityTarget( validSession );
    UpdateStatus( ' Have target: ' + validSession.targetFindName);
  }
  tsxDebug('************************');
  return validSession;
}

// **************************************************************
function getHigherPriorityTarget( validSession ) {
  // tsxDebug('************************');
  tsxDebug(' *** getHigherPriorityTarget: ' + validSession.targetFindName);

  var targetSessions = TargetSessions.find({enabledActive: true }).fetch();
  var numSessions = targetSessions.length;

  for (var i = 0; i < numSessions; i++) {
    var chkSession = targetSessions[i];
    if( validSession._id != chkSession._id ) {
      var canStart = canTargetSessionStart( chkSession );
      if( canStart ) {
        tsxDebug( 'canStart: ' + chkSession.targetFindName );
        var valPriority = Number(validSession.priority);
        var chkPriority = Number(chkSession.priority);
        var chk = valPriority - chkPriority;
        if( (chk > 0) ) {
              validSession = chkSession;
              UpdateStatus( 'Priority Candidate: ' + validSession.targetFindName);
        }
      }
    }
  }
  return validSession;

}

// **************************************************************
function isTargetComplete( target ) {
  // tsxDebug('************************');
  tsxDebug(' *** isTargetComplete: ' + target.targetFindName );

  var planned = TargetSessions.findOne({_id: target._id}).totalImagesPlanned();
  var taken = TargetSessions.findOne({_id: target._id}).totalImagesTaken();
  // tsxDebug( target.targetFindName + ' ' + taken + '/' + planned );
  if( taken < planned ) {
    return false;
  }
  return true;
}
// *************************** ***********************************

function hasStartTimePassed( target ) {
  // tsxDebug('************************');
  tsxDebug(' *** hasStartTimePassed: ' + target.targetFindName );

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
  // tsxDebug('************************');
  tsxDebug(' *** isTimeBeforeCurrentTime: ' + ts );

  if( typeof ts == 'undefined') {
    return true; // as undefined....
  }

  var cur_dts = new Date();
  var cur_time = cur_dts.getHours()+(cur_dts.getMinutes()/60);
  // tsxDebug('Current time: ' + cur_time );

  // add 24 to the morning time so that
  ((cur_time < 8) ? cur_time=cur_time+24 : cur_time);

  // tsxDebug('Start time: ' + start_time );
  var hrs = ts.split(':')[0].trim();
  // tsxDebug('Start hrs: ' + hrs );
  var min = ts.split(':')[1].trim();
  // tsxDebug('Start min: ' + min );
  ts = Number(hrs) + Number(min/60);
  ((ts < 8) ? ts=ts+24 : ts);
  // tsxDebug('curtime: ' + cur_time + ' vs ' + ts);
  var curBefore = ((ts < cur_time ) ? true : false);
  return curBefore;
}

// *************************** ***********************************
// This method is used to confirm the target can be used.
// All of its conditions are valid.
// This method does not check if there is a getHigherPriorityTarget()
//
export function canTargetSessionStart( target ) {
  // tsxDebug('************************');
  tsxDebug(' *** canTargetSessionStart: ' + target.targetFindName );

  UpdateImagingTargetReport( target );
  var canStart = true;

  tsxDebug( ' Is target active: ' + target.enabledActive );
  if(!target.enabledActive){
    UpdateStatus( ' ' + target.targetFindName + ': not enabled' );
    return false; // the session is disabled
  }

  // check for target not ready
  var isComplete = isTargetComplete( target );
  tsxDebug( ' Is target complete: ' + isComplete );
  if( isComplete ) {
    UpdateStatus( ' ' + target.targetFindName + ': is completed' );
    return false;
  }

  // check start time pasted
  var hasPassed = hasStartTimePassed( target );
  tsxDebug( ' Is target start ready: ' + hasPassed );
  if( !(hasPassed) ) {
    UpdateStatus( ' ' + target.targetFindName + ': too early ' + target.startTime );
    return false;
  }

  // check stoptime pasted
  var hasStopped = hasStopTimePassed( target );
  tsxDebug( ' Is target stop reached: ' + hasStopped );
  if( hasStopped ) {
    UpdateStatus( ' ' + target.targetFindName + ': too late ' + target.stopTime );
    return false;
  }

  // check if TSX says okay... Altitude and here
  // ready also checks for the sun to be below specific altitude e.g. -18 degrees
  var result =   UpdateImagingTargetReport( target );
  tsxDebug( ' Is target ready: ' + result.ready );
  if( !result.ready ) {
    UpdateStatus( ' ' + target.targetFindName + ' per report ready: ' + result.ready );
    return false;
  }

  // can be redundant with ready above... ready above can also mean not found
  var minAlt = tsx_reachedMinAlt( target );
  tsxDebug( ' Is target minAlt: ' + minAlt );
  if( minAlt ) {
    UpdateStatus( ' ' + target.targetFindName + ' altitude below: ' + target.minAlt );
    return false;
  }

  var isDark = tsx_isDarkEnough( target );
  tsxDebug(' Is dark enough for target: ' + isDark );
  if( isDark === false ) {
    // tsxDebug( 'inside canstart to return false' );
    UpdateStatus( ' ' + target.targetFindName + ': Not dark enough' );
    return false;
  }
  // tsxDebug( 'inside canstart did not return false' );

  return canStart;
}

// **************************************************************
// **************************************************************
// **************************************************************








// **************************************************************
// **************************************************************
// **************************************************************
Meteor.methods({

  // **************************************************************
  connectToTSX() {
    tsxDebug(' ******************************* ');
    var isOnline = tsx_ServerIsOnline();
    tsxDebug('tsx_ServerIsOnline: ' + isOnline);
    // *******************************
    //  GET THE CONNECTED EQUIPEMENT
    tsxDebug(' ******************************* ');
    tsxDebug('Loading devices');

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
     tsxDebug('************************');
     prepareTargetForImaging();
   },

   // **************************************************************
  tsx_Test() {
    tsxDebug('************************');
    tsxDebug('tsx_Test');
    var imagingSession = getValidTargetSession();
    if (typeof imagingSession == 'undefined') {
      tsxDebug('*** No session found');

    } else {

    }
    tsxDebug('Starting the autoguide');
    SetUpAutoGuiding(imagingSession);

  },

  // **************************************************************
  // Used to pass RA/DEC to target editors
  targetFind(target) {
    tsxDebug('************************');
    tsxDebug(' *** targetFind: ' + target.targetFindName);
    return UpdateImagingTargetReport(target);

  },

  // **************************************************************
  // 7. Start session run:
  //    - take image
  startImagingTest(targetSession) {
    tsxDebug('************************');
    tsxDebug(' *** startImagingTest: ' + targetSession.targetFindName);
    // use the order of the series
    var series = targetSession.takeSeries.series[0];
    tsxDebug('\nProcesing filter: ' + series.filter);
    tsxDebug('Series repeat: ' + series.repeat);
    tsxDebug('Series taken: ' + series.taken);
    var remainingImages = series.repeat - series.taken;
    tsxDebug('number of images remaining: ' + remainingImages);
    tsxDebug('Launching take image for: ' + series.filter + ' at ' + series.exposure + ' seconds');

    var slot = getFilterSlot( series.filter );
    //  cdLight =1, cdBias, cdDark, cdFlat
    var frame = getFrame(series.frame);
    out = tsx_takeImage(slot,series.exposure, frame);
    tsxDebug('Taken image: ' +res);

    return;
  },

  // **************************************************************
  // Manually start the imaging on the target...
  // Something like a one target Only
  // Assumes that CLS, Focus, Autoguide already running
  startImaging(target) {
    tsxDebug('************************');
    tsxDebug(' *** startImaging: ' + target.name );
    UpdateImagingSesionID( target._id )
    UpdateImagingTargetReport (target.targetFindName);

    // Will process target until end condition found
    processTargetTakeSeries( target );
    tsx_AbortGuider();
  },

  testTargetPicking() {
    tsxDebug('************************');
    tsxDebug(' *** testTargetPicking' );
    var target = findTargetSession();
    if( typeof target == 'undefined') {
      tsxDebug('No target found');
    }
    else {
      tsxDebug('Found: ' + target.targetFindName);
    }
  },

  testEndConditions() {
    tsxDebug('************************');
    tsxDebug(' *** testEndConditions' );
    var target = findTargetSession();
    if( typeof target == 'undefined') {
      tsxDebug('No target found');
    }
    else {
      tsxDebug('Found: ' + target.targetFindName);
      var endCond = isTargetConditionsInValid( target );
      tsxDebug(target.targetFindName + ' ending=' + endCond );
    }
  },

  testTryTarget() {
    tsxDebug('************************');
    tsxDebug(' *** testEndConditions' );

    // neeed to get a session here...
    var targets = TargetSessions.find().fetch();
    var target;
    if( targets.length > 0 ) {
      target = targets[0]; // get first target
    }

    return  UpdateImagingTargetReport( target );

  },

  testDither( target ) {
    tsxDebug('************************');
    tsxDebug(' *** testDither' );

    return tsx_dither( target );

  },

  testFocus3( target ) {
    tsxDebug('************************');
    tsxDebug(' *** testFocus3' );

    return InitialFocus( target );

  },

  testGuide( target ) {
    tsxDebug('************************');
    tsxDebug(' *** testGuide' );

    return SetUpAutoGuiding( target );

  },

  testAbortGuiding( target ) {
    tsxDebug('************************');
    tsxDebug(' *** testAbortGuiding' );

    return tsx_AbortGuider();
  },

  testSolve( target ) {
    tsxDebug('************************');
    tsxDebug(' *** testSolve' );

    return SetUpAutoGuiding( target );

  },

  testMatchRotation( target ) {
    tsxDebug('************************');
    tsxDebug(' *** testMatchRotation' );

    return tsx_MatchRotation( target );

  },

  centreTarget( target ) {
    UpdateStatus( ' Centre : ' + target.targetFindName );
    var result = tsx_CLS( target);
    return result;
  },

  getTargetReport( target ) {
    UpdateStatus( ' Getting report : ' + target.targetFindName );
    var result = tsx_TargetReport( target );
    UpdateStatus( ' Received report' );
    return result;
  },

  getTargetReports( targetArray ) {
    UpdateStatus( ' Getting report : ' + target.targetFindName );
    for (var i = 0; i < targetArray.length; i++) {
      var target = targetArray[i];
      var result = tsx_TargetReport( target );
    }
    UpdateStatus( ' Received report' );
    return result;
  },

  park( ) {
    var filter = tsx_GetServerStateValue('defaultFilter');
    var result = tsx_MntPark(filter, false ); // use default filter
    return result;
  }


});
