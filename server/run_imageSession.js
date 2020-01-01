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
import {
  ImagingSessionLogs,
  addImageReport,
  updateImageReport,
} from '../imports/api/imagingSessionLogs.js';
import {
  TargetReports,
  updateTargetReport,
} from '../imports/api/targetReports.js';
import { TakeSeriesTemplates } from '../imports/api/takeSeriesTemplates.js';
import { Seriess } from '../imports/api/seriess.js';
import { Filters } from '../imports/api/filters.js';
import { TheSkyXInfos } from '../imports/api/theSkyXInfos.js';
import {
  TargetAngles,
  recordRotatorPosition,
} from '../imports/api/targetAngles.js';

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
  UpdateImagingSesionID,
} from '../imports/api/serverStates.js'

import {
  tsx_feeder,
  tsx_cmd,
  tsx_has_error,
} from './tsx_feeder.js'

import {
  getFilterName,
  getFrameNumber,
  getFrameName,
  getFilterSlot,
} from './filter_wheel.js'

var tsxHeader =  '/* Java Script *//* Socket Start Packet */';
var tsxFooter = '/* Socket End Packet */';
var forceAbort = false;

// *******************************
export function isSchedulerStopped() {
  tsxDebug(' *** isSchedulerStopped ' );
  var sched = tsx_GetServerStateValue('scheduler_running');
  var runScheduler =   tsx_SetServerState('runScheduler', '');
  if(
    (sched != 'Stop' && runScheduler != '')
  ) {
    tsxDebug('scheduler_running: ' + sched);
    return false; // exit
  }
  tsx_SetServerState('targetName', 'No Active Target');
  tsx_SetServerState('scheduler_report', '');
  // THis line is needed in the tsx_feeder
  tsx_SetServerState('imagingSessionId', '');

  return true;
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


// *******************************
export function tsx_IsParked() {
  tsxDebug('************************');
  tsxDebug(' *** tsx_IsParked' );

  var out = false;
  var cmd = tsx_cmd('SkyX_JS_IsParked');

  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
    var result = tsx_return.split('|')[0].trim();
    tsxDebug( result );
    out = result;
    tsx_is_waiting = false;
  }));
  while( tsx_is_waiting ) {
    Meteor.sleep( 1000 );
  }
  return out;
}


// **************************************************************
export function tsx_MntUnpark() {
  tsxDebug('************************');
  UpdateStatus(' Unparking mount' );
  var cmd = tsx_cmd('SkyX_JS_UnparkMount');

  var Out = '';
  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        var result = tsx_return.split('|')[0].trim();
        tsxDebug( ' *** result: ' + result );
        if( result == 'unparked' ) {
          UpdateStatus(' Unparked mount' );
        }
        else {
          UpdateStatusErr( ' !!! Unparking err: ' + result );
        }

        Out = result;
        tsx_is_waiting = false;
  }));
  tsxDebug ( ' unpark waiting ') ;
  while( tsx_is_waiting ) {
    Meteor.sleep( 1000 );
  }
  tsxDebug ( ' unpark done ') ;
  return Out;
}


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
    UpdateStatus(' Parking... ');
  }
  var cmd = tsx_cmd('SkyX_JS_ParkMount');
  cmd = cmd.replace("$000", slot ); // set filter
  cmd = cmd.replace("$001", softPark ); // set filter

  var Out;
  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        var result = tsx_return.split('|')[0].trim();
        tsxDebug( ' park result: ' + result );
        if( result == 'Parked' || result == 'Soft Parked' ) {
          UpdateStatus( ' ' + result );
        }
        else {
          UpdateStatusErr( ' !!! Parking err: ' + result );
        }

        Out = result;
        tsx_is_waiting = false;
  }));
  tsxDebug( ' Park waiting' );
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
  tsxDebug( ' Park wait done' );
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

// just do calibration
export function CalibrateAutoGuider() {
  if( !isSchedulerStopped() ) {
    tsxDebug(' Calibrating Exiting - Scheduler active');
    return;
  }
  // tsxDebug('************************');
  var enabled = tsx_GetServerStateValue('isAutoguidingEnabled');
  if( !enabled ) {
    tsxDebug(' *** @Autoguiding disabled');
    return;
  }

  tsx_TakeAutoGuideImage();
  var star = tsx_FindGuideStar();

  // Handle no star found
  if ( star !== '') {
    // Calibrate....
    var cal_res = tsx_CalibrateAutoGuide( star.guideStarX, star.guideStarY );
    if( cal_res ) {
      tsxLog(' AutoGuider Calibrated');
    }
  }
}

// **************************************************************
// Breakup into reusable sections...
// tsx_ will send TSX commands
// non-tsx_ functions are higher level
function SetUpAutoGuiding( target, doCalibration ) {
  // tsxDebug('************************');
  tsxDebug(' *** SetUpAutoGuiding: ' + target.targetFindName );
  var enabled = tsx_GetServerStateValue('isAutoguidingEnabled');
  if( !enabled ) {
    tsxDebug(' *** @Autoguiding disabled: ' + target.targetFindName);
    return;
  }

  UpdateStatus(' ' + target.targetFindName + ": Autoguider setup");
  tsx_TakeAutoGuideImage( );
  if( isSchedulerStopped() ) {
    return;
  }

  var star = tsx_FindGuideStar();
  if( isSchedulerStopped() ) {
    return;
  }

  // Calibrate.... only if a star is found...
  if( star !== '') {
    if( doCalibration == true ) {
      UpdateStatus(' ' + target.targetFindName + ": AutoGuider Calibration STARTED");
      var cal_res = tsx_CalibrateAutoGuide( star.guideStarX, star.guideStarY );
      if( cal_res ) {
        UpdateStatus(' ' + target.targetFindName + ": AutoGuider Calibrated");
      }
      if( isSchedulerStopped() ) {
        return;
      }
    }

    tsx_StartAutoGuide( star.guideStarX, star.guideStarY );
    if( isSchedulerStopped() ) {
      return;
    }
    tsx_SettleAutoGuide( target );
    if( isSchedulerStopped() ) {
      return;
    }
    UpdateStatus(' ' + target.targetFindName + ": Autoguiding Active");
  }
}

// **************************************************************
function tsx_TakeAutoGuideImage( ) {
  // tsxDebug('************************');
  var enabled = tsx_GetServerStateValue('isAutoguidingEnabled');
  if( !enabled ) {
    tsxDebug(' *** @Autoguiding disabled ');
    return;
  }

  var cmd = tsx_cmd('SkyX_JS_TakeGuideImage');
  var exp = tsx_GetServerStateValue('defaultGuideExposure');

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
  var enabled = tsx_GetServerStateValue('isAutoguidingEnabled');
  var out = '';
  if( !enabled ) {
    tsxDebug(' *** @Autoguiding disabled: ' + target.targetFindName);
    return;
  }

  tsx_is_waiting = true;
  var guideStarX = 0;
  var guideStarY = 0;
  // var cmd = tsxCmdFindGuideStar();
  var cmd = tsx_cmd('SkyX_JS_FindAutoGuideStar');
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
    try {
      tsxDebug(' Guide star info: ' + tsx_return);
      guideStarX = tsx_return.split('|')[0].trim();
      if( guideStarX == "TypeError:") {
        throw("Guider Star not found!")
      }
      guideStarY = tsx_return.split('|')[1].trim();
      tsxDebug( " --- Guide star: "+guideStarX+", "+guideStarY );
      out = {
        guideStarX: guideStarX,
        guideStarY: guideStarY,
      };
    }
    catch( e ) {
      UpdateStatusErr( " --- Guide star: NOT FOUND - " + e );
    }
    finally {
      tsx_is_waiting = false;
    }
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
  var enabled = tsx_GetServerStateValue('isCalibrationEnabled');
  if( !enabled ) {
    tsxDebug(' *** Autoguider calibration disabled');
    return false;
  }
  enabled = tsx_GetServerStateValue('isAutoguidingEnabled');
  if( !enabled ) {
    tsxDebug(' *** Autoguider disabled ');
    return false;
  }
  var fSize = tsx_GetServerStateValue('calibrationFrameSize');
  if( typeof fSize == 'undefined' || fSize === '' ) {
    fSize = 300;
    UpdateStatusErr(' *** Autoguider calibration frame needs setting ');
  }

  tsx_is_waiting = true;
  // var cmd = tsxCmdFindGuideStar();
  var cmd = tsx_cmd('SkyX_JS_AutoguideCalibrate');
  cmd = cmd.replace('$000', guideStarX );
  cmd = cmd.replace('$001', guideStarY );
  cmd = cmd.replace('$002', fSize );

  var success = false;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
    var result = tsx_return.split('|')[0].trim();
    if( result != 'Success') {
      UpdateStatusErr(' *** FAILED- calibrating autoguider: ' + result);
    }
    else {
      success = true;
    }

    tsx_is_waiting = false;
  }));
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
  if( !success ) {
  }
  return success;
}


// **************************************************************
function tsx_StartAutoGuide(guideStarX, guideStarY) {
  tsxDebug(' *** tsx_StartAutoGuide' );
  var enabled = tsx_GetServerStateValue('isAutoguidingEnabled');
  if( !enabled ) {
    tsxDebug(' *** Autoguider disabled ');
    return;
  }

  // star guiding
  tsx_is_waiting = true;
  // var cmd = tsxCmdFindGuideStar();
  var cmd = tsx_cmd('SkyX_JS_FrameAndGuide');
  cmd = cmd.replace('$000', guideStarX );
  cmd = cmd.replace('$001', guideStarY );

  var camScale = tsx_GetServerStateValue( 'imagingPixelSize');
  var guiderScale = tsx_GetServerStateValue( 'guiderPixelSize');
  var guidingPixelErrorTolerance = tsx_GetServerStateValue( 'guidingPixelErrorTolerance');
  var isGuideSettlingEnabled = tsx_GetServerStateValue( 'isGuideSettlingEnabled');
  tsxDebug( ' Settle autoguider: ' + isGuideSettlingEnabled ) ;
  tsxDebug( ' camScale: ' + camScale ) ;
  tsxDebug( ' guiderScale: ' + guiderScale ) ;
  tsxDebug( ' guidingPixelErrorTolerance: ' + guidingPixelErrorTolerance ) ;
  if( typeof camScale === 'undefined' || camScale === '') {
    camScale = 0;
  }
  if( typeof guiderScale === 'undefined' || guiderScale === '') {
    guiderScale = 0;
  }
  if( typeof guidingPixelErrorTolerance === 'undefined' || guidingPixelErrorTolerance === '') {
    guidingPixelErrorTolerance = 0;
  }
  if( typeof isGuideSettlingEnabled === 'undefined' || isGuideSettlingEnabled === '') {
    isGuideSettlingEnabled = false;
  }
  // Need to convert booleans to 0~false, 1~true, else fails in TSX
  if( isGuideSettlingEnabled == true ) {
    isGuideSettlingEnabled = 1;
  }
  else {
    isGuideSettlingEnabled = 0;
  }
  var fSize = tsx_GetServerStateValue('calibrationFrameSize');
  if( typeof fSize == 'undefined' || fSize === '' ) {
    fSize = 300;
    UpdateStatus(' *** Autoguider calibration frame needs setting ');
  }

  cmd = cmd.replace("$002", fSize ); // set subframe
  cmd = cmd.replace("$004", camScale ); // set cameraImageScale
  cmd = cmd.replace("$005", guiderScale ); // set guiderImageScale
  cmd = cmd.replace("$006", guidingPixelErrorTolerance ); // set guidingPixelErrorTolerance
  cmd = cmd.replace("$007", isGuideSettlingEnabled ); // set guidingPixelErrorTolerance
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {

    tsx_is_waiting = false;
  }));
  while( tsx_is_waiting ) {
    Meteor.sleep( 1000 );
  }
}

// **************************************************************
function tsx_SettleAutoGuide( target ) {
  // tsxDebug('************************');
  tsxDebug(' *** tsx_SettleAutoGuide' );
  var enabled = tsx_GetServerStateValue('isAutoguidingEnabled');
  if( !enabled ) {
    tsxDebug(' *** Autoguider disabled ');
    return;
  }

  var isGuideSettlingEnabled = tsx_GetServerStateValue( 'isGuideSettlingEnabled');
  if( typeof isGuideSettlingEnabled === 'undefined' || isGuideSettlingEnabled === '') {
    isGuideSettlingEnabled = false;
  }

  if( !isGuideSettlingEnabled ) {
    tsxDebug(' *** Autoguider Settling is disabled ');
    return;
  }

  var camScale = tsx_GetServerStateValue( 'imagingPixelSize');
  var guiderScale = tsx_GetServerStateValue( 'guiderPixelSize');
  var guidingPixelErrorTolerance = tsx_GetServerStateValue( 'guidingPixelErrorTolerance');
  tsxDebug( ' Settle autoguider enabled: ' + isGuideSettlingEnabled ) ;
  tsxDebug( ' camScale: ' + camScale ) ;
  tsxDebug( ' guiderScale: ' + guiderScale ) ;
  tsxDebug( ' guidingPixelErrorTolerance: ' + guidingPixelErrorTolerance ) ;
  if( typeof camScale === 'undefined' || camScale === '') {
    camScale = 0;
  }
  if( typeof guiderScale === 'undefined' || guiderScale === '') {
    guiderScale = 0;
  }
  if( typeof guidingPixelErrorTolerance === 'undefined' || guidingPixelErrorTolerance === '') {
    guidingPixelErrorTolerance = 0;
  }
  // Need to convert booleans to 0~false, 1~true, else fails in TSX
  if( isGuideSettlingEnabled == true ) {
    isGuideSettlingEnabled = 1;
  }
  else {
    isGuideSettlingEnabled = 0;
  }
  // star guiding
  tsx_is_waiting = true;
  // var cmd = tsxCmdFindGuideStar();
  var cmd = tsx_cmd('SkyX_JS_GuideSettle');

  cmd = cmd.replace("$004", camScale ); // set cameraImageScale
  cmd = cmd.replace("$005", guiderScale ); // set guiderImageScale
  cmd = cmd.replace("$006", guidingPixelErrorTolerance ); // set guidingPixelErrorTolerance
  cmd = cmd.replace("$007", isGuideSettlingEnabled ); // set guidingPixelErrorTolerance

  tsxDebug(' --- Autoguider Settling to: ' + guidingPixelErrorTolerance );
  let quality = 'unknown';
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
    var result = tsx_return.split('|')[0].trim();
    if( result != 'Success') {
      UpdateStatusErr(' *** Autoguiding Failed: ' + result);
    }
    else {
      quality = tsx_return.split('|')[1].trim()
    }
    tsx_is_waiting = false;
  }));
  while( tsx_is_waiting ) {
    Meteor.sleep( 1000 );
  }
  UpdateStatus( ' ' + target.targetFindName + ': Autoguider Settling(' + guidingPixelErrorTolerance + '):' + quality );
}

// **************************************************************
//    B. Slew to target
function tsx_Slew( target ) {
  // tsxDebug('************************');
  tsxDebug(' *** tsx_Slew: ' + target.targetFindName );
  //var cmd = tsx_cmd('SkyX_JS_Slew');
  Out = tsx_SlewTargetName (target.targetFindName)
  return Out;
}

export function tsx_SlewTargetName( targetName ) {
  tsxDebug(' *** tsx_SlewTargetName: ' + targetName );

  var cmd = tsx_cmd('SkyX_JS_SlewTarget');
  cmd = cmd.replace('$000',  targetName  );
  var result = '';
  var tsx_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
    result = tsx_return.split('|')[0].trim();
    // tsxDebug('Any error?: ' + result);
    if( result != 'Success') {
      forceAbort = true;
      tsxDebug(' *** Slew failed: ' + result);
    }
    else {
      tsxDebug(' Slew finished');
    }
    tsx_is_waiting = false;
  }));
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
  return result;
}

export function tsx_SlewCmdCoords( cmd, ra, dec ) {
  // tsxDebug('************************');
  tsxDebug(' *** tsx_SlewCmdCoords: ' + ra + ', ' + dec );

  var result = false;
  var cmd = tsx_cmd(cmd);
  cmd = cmd.replace('$000',  ra  );
  cmd = cmd.replace('$001',  dec  );

  var tsx_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
    result = tsx_return.split('|')[0].trim();
    // tsxDebug('Any error?: ' + result);
    if( result != 'Success') {
      forceAbort = true;
      tsxDebug('Slew Failed. Error: ' + result);
    }
    else {
      tsxDebug('Slew finished');
      result = true;
    }
    tsx_is_waiting = false;
  }));
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
  return result;
}

export function tsx_StopTracking() {
  tsxLog(' *** tsx_StopTracking' );

  let result = '';
  let cmd = tsx_cmd('SkyX_JS_StopTracking');

  let tsx_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
    result = tsx_return.split('|')[0].trim();

    if( result != 'Success') {
      forceAbort = true;
      tsxLog('Stop tracking Failed. Error: ' + result);
    }
    else {
      tsxLog('Stop tracking finished');
    }
    tsx_is_waiting = false;
  }));
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
  return result;
}

// *******************************
// #TODO set the target.isCloudy = false;
function updateTargetIsCloudy( target, isCloudy ) {
  if( isCloudy == -1 ) {
    // it is cloudy so update target
    TargetSessions.upsert({_id: target._id}, {
      $set:{
        isCloudy: true,
      }
    });

  }
  else {
    // it is not cloudy... angle/FOV rotation found, so set not cloudy
    TargetSessions.upsert({_id: target._id}, {
      $set:{
        isCloudy: false,
      }
    });

  }
}


// **************************************************************
//    B. CLS to target
function tsx_CLS( target ) {
  // tsxDebug('************************');
  tsxInfo(' *** tsx_CLS: ' + target.targetFindName );
  var Out = false;
  var doCLS = tsx_GetServerStateValue( 'defaultCLSEnabled' );
  if( doCLS == false ) {
    tsxInfo(' *** tsx_CLS: disabled, slewing' );
    // If CLS not enabled then Slew...
    Out = tsx_Slew( target );
    return Out;
  }

  var clsSuccess = tsx_CLS_target( target.targetFindName, target.clsFilter );
  // Update the target angle...
  if( clsSuccess ) {
    Out = true;
  }
  updateTargetIsCloudy( target, clsSuccess );

  return Out;
}

function resetCLSTimeCheck () {
  var defaultCLSRepeat = tsx_GetServerState('defaultCLSRepeat');
  if( typeof defaultCLSRepeat === 'undefined' ) {
    tsxDebug( ' Check if to CLS again - needs a value.');
    tsx_SetServerState('defaultCLSRepeat', 0); // default is off
    defaultCLSRepeat = tsx_GetServerState('defaultCLSRepeat');
  }
  tsx_SetServerState('defaultCLSRepeat', defaultCLSRepeat.value);
}

function tsx_CLS_target( target, filter ) {
  // tsxDebug('************************');
  tsxDebug(' *** tsx_CLS_target: ' + target );
  var clsSuccess =false;
  var tsx_is_waiting = true;
  var retries = tsx_GetServerStateValue( 'defaultCLSRetries' );
  if( typeof retries === 'undefined' || retries === '' ) {
    retries =0;
    tsxWarn(' ' + target.targetFindName + ': CLS retries not set. Set to zero');
  }

  // var cmd = tsxCmdCLS();
  var cmd = tsx_cmd('SkyX_JS_CLS');
  cmd = cmd.replace("$000", target );
  var slot = getFilterSlot(filter);
  // tsxDebug('Found slot: ' + slot);
  cmd = cmd.replace("$001", slot);
  cmd = cmd.replace("$002", retries);

  let tsx_err = false;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
      tsx_err = tsx_has_error( tsx_return );
      tsxInfo( ' CLS res: ' + tsx_return );
      var result = tsx_return.split('|')[0].trim();
      if( result != 'Success') {
        // So if we fail here... what do we do...
        UpdateStatusErr(' !!! CLS Failed (centring): ' + tsx_return);
        tsx_err = true;
      }
      else {
        clsSuccess = true;
        tsxInfo(' ' + target + ': centred' );
        var angle = tsx_return.split('|')[1].trim();
        tsxInfo(' ' + target + ': Position Angle: ' + angle );
        var rotPos;
        try {
          rotPos = tsx_return.split('|')[2].trim();
          tsxWarn( ' tsx_CLS_target did not set rotator position');
        }
        finally {
          // all good do nothing
          // reset dithering....
          resetCLSTimeCheck();
          tsx_SetServerState('imagingSessionDither', 0);
        }
      }
      tsx_is_waiting = false;
  }));

  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
  if( tsx_err != false ) {
    throw( 'TSX_ERROR|Cloudy? Is Tsx Running?');
  }
  return clsSuccess;
}

// **************************************************************
function tsx_RunFocus3( target ) {
  // tsxDebug('************************');
  tsxDebug(' *** tsx_RunFocus3: ' + target.targetFindName );

  var Out;
  var enabled = tsx_GetServerStateValue('isFocus3Enabled');
  var doCLS = tsx_GetServerStateValue( 'defaultCLSEnabled' );
  tsxDebug(' ??? @Focus3 enabled found to be: ' + enabled );
  if( enabled == true  ) {

    var runFocus3 = isFocusingNeeded( target );
    if( runFocus3 == false ) {
      tsxDebug(' ??? ' + target.targetFindName +': @Focus3 not needed');
      Out = ''; // get last temp
      return Out;
    }
    var focusSamples = tsx_GetServerStateValue( 'focus3Samples' );
    if( focusSamples == '' || typeof focusSamples == 'undefined') {
      tsx_SetServerState('focus3Samples', 5 ); // arbitrary default
      focusSamples = 5;
    }

    var focusFilter = getFilterSlot(target.focusFilter);
    var focusExp = target.focusExposure;
    var focusTarget = target.focusTarget;

    // do not bother CLS to star target... assume that the mount is prepared
    if( focusTarget != '' ) {
      if( doCLS == false ) {
        // If CLS not enabled then Slew...
        var res = tsx_SlewTargetName( focusTarget );
      }
      else {
        var res = tsx_CLS_target( focusTarget );
        updateTargetIsCloudy( target, res );
      }
    }

    var cmd = tsx_cmd('SkyX_JS_Focus-3');
    tsxDebug( ' ??? @Focusing-3 samples: ' + focusSamples );
    tsxDebug( ' ??? @Focusing-3 filter: ' + focusFilter );
    tsxDebug( ' ??? @Focusing-3 exposure: ' + focusExp );
    cmd = cmd.replace("$000", focusFilter ); // set filter
    cmd = cmd.replace("$001", focusExp ); // set Bin
    cmd = cmd.replace("$002", focusSamples ); // set samples

    var lastFocusTemp = tsx_GetServerStateValue( 'initialFocusTemperature' ); // get last temp
    let curFocusTemp = target.report.focusTemp; // read new temp
    tsxDebug( ' curFocusTemp temp: ' + curFocusTemp );
    if( typeof curFocusTemp == 'undefined' ) {
      curFocusTemp = lastFocusTemp;
    }

    if( focusTarget != '' ) {
      //  NGC7023: @Focus3 started: 13737 for temp 13.2
      UpdateStatus(' ' + target.targetFindName +': @Focus3 started (using ' + focusTarget + ') for current temp ' + lastFocusTemp + ', vs ' + curFocusTemp );
    }
    else {
      UpdateStatus(' ' + target.targetFindName +': @Focus3 started: for current temp ' + lastFocusTemp  + ', vs ' + curFocusTemp );
    }
    var position = '';
    var temp = '';
    var tsx_is_waiting = true;
    tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
      //[[B^[[B^[[BI20180708-01:53:13.485(-3)?   [SERVER]|2018-07-08|01:53:13|[DEBUG]| ??? @Focusing-3 returned: TypeError: Error code = 5 (5). No additional information is available.|No error. Error = 0
      tsxDebug( ' ??? @Focusing-3 returned: ' + tsx_return );
      temp = tsx_return.split('|')[1].trim();
      position = tsx_return.split('|')[0].trim();
      if( temp == 'TypeError: Error code = 5 (5). No additional information is available.') {
          temp = tsx_GetServerStateValue( 'initialFocusTemperature' );
          UpdateStatusErr( ' !!! Error find focus.' );
      }
      //TypeError: @Focus diverged.  Error = 7001
      else if (temp =='TypeError: @Focus diverged.  Error = 7001.') {
        temp = tsx_GetServerStateValue( 'initialFocusTemperature' );
        UpdateStatusErr( ' !!! Error find focus.' );
      }
      else if( typeof temp == 'undefined' || temp === 'No error. Error = 0.') {
        temp = '';
      }
      if( position == 'Simulator') {
        temp = position;
      }
      // Focuser postion (1232345345) using LUM Filter
      tsxDebug(' *** Focuser postion (' + position + ') and temp ('+temp+') using ' + target.focusFilter + ' filter.');

      Out = temp;
      tsx_is_waiting = false;
    }));
    while( tsx_is_waiting ) {
     Meteor.sleep( 1000 );
    }
    if( focusTarget != '' ) {
      if( doCLS == false ) {
        // If CLS not enabled then Slew...
        var res = tsx_Slew( target );
      }
      else {
        var res = tsx_CLS( target );
        updateTargetIsCloudy( target, res );
      }
    }

    UpdateStatus(' ' + target.targetFindName +': @Focus3 finished: ' + position + ' for temp ' + temp);
  }
  else {
    tsxDebug(' *** ' + target.targetFindName +': @Focus3 disabled');
    Out = ''; // get last temp
  }
  return Out;
}

// **************************************************************
function InitialFocus( target ) {
  // tsxDebug('************************');
  tsxDebug(' *** ' + target.targetFindName +': @Focus3 Needed');

  var temp = tsx_RunFocus3( target ); // need to get the focus position
  tsxInfo( ' *** ' + target.targetFindName +': Initial Focus temp: ' + temp );

  if( temp != '') {
    tsx_SetServerState( 'initialFocusTemperature', temp);
  }
}

// **************************************************************
export function tsx_GetFocusTemp( target ) {
  // tsxDebug('************************');
  tsxDebug( ' *** ' + target.targetFindName + ': tsx_GetFocusTemp ' );

  var cmd = tsx_cmd('SkyX_JS_GetFocTemp');

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
  }));
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
      azimuth: tsx_return.split('|')[3].trim(),
      direction: tsx_return.split('|')[5].trim(),
      altitude: tsx_return.split('|')[4].trim(),
      pointing: tsx_return.split('|')[5].trim(),
    }
    tsx_SetServerState( 'mntMntRA', Out.ra );
    tsx_SetServerState( 'mntMntDEC', Out.dec );
    tsx_SetServerState( 'mntMntMHS', Out.hms );
    tsx_SetServerState( 'mntMntDir', Out.direction );
    tsx_SetServerState( 'mntMntAlt', Out.altitude );
    tsx_SetServerState( 'mntMntAz', Out.azimuth );
    tsx_SetServerState( 'mntMntPointing', Out.pointing );

    tsx_is_waiting = false;
  }));
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
  return Out;
}


// 1. get report on the targetTransit
// 2. Slew to target - do not CLS in the case focus/calibration/FOV are done
// 3. Check focus and if so, do it.
// 4. Check for FOV, and if so do it.
// 5. Check for calibration, and if so do it.
// 6. CLS.
// 7. Guide...
// **************************************************************
function SetUpForImagingRun(target, doRotator, doCalibration ) {
  tsxDebug('************************');
  tsxDebug(' *** SetUpForImagingRun: ' + target.targetFindName );

  Meteor.sleep(3000); // pause 3 seconds
  // UpdateStatus(  " Stopping autoguider" );
  // tsx_AbortGuider(); // now done in CLS

  var tryTarget = UpdateImagingTargetReport( target );
  tsxInfo( ' ' + target.targetFindName + ': refreshed info' );
	if( !tryTarget.ready ) {
    tsxDebug(target.targetFindName + ' ' + tryTarget.msg);
    throw( 'TSX_ERROR|Target Report Failed. TSX Running?');
  }
  else {
    // Used to update the monitor, as it is this target to continue
    tsx_SetServerState('scheduler_report', target.report );
  }

  // *******************************
  // SLEW: get close to the target
  // tsx_AbortGuider(); // SLEW has built in Guider Abort
  var Out = tsx_Slew( target );
  if( isSchedulerStopped() ) {
    return false; // exit
  }

  // *******************************
  // get initial focus....
  // needs initial focus temp
  InitialFocus( target );
  if( isSchedulerStopped() ) {
    return false; // exit
  }

  // *******************************
  //    C. Match Rotation/Angle if provided:
  //      a) if entered for session
  //      b) obtained from image
  var rotateSucess = false;
  //  UpdateStatus( ' ' + target.targetFindName + ': matching angle' );
  if( doRotator ) {
    rotateSucess = tsx_MatchRotation( target );
    if( isSchedulerStopped() ) {
      return false; // exit
    }
  }

  // *******************************
  // CLS: put target in the centre
  UpdateStatus( ' ' + target.targetFindName + ': centring' );
	var cls = tsx_CLS(target); 						//# Call the Closed-Loop-Slew function to go to the target
  updateTargetIsCloudy( target, cls );
  if( !cls ) {
    UpdateStatus( ' Target centred FAILED: ' + cls.angle);
    throw( 'TSX_ERROR|Cloudy? Is Tsx Running?');
  }
  if( isSchedulerStopped() ) {
    return false; // exit
  }

  // *******************************
  UpdateStatus( ' ' + target.targetFindName + ': centred' );
  // Get Mount Coords and Orientations
	var mntOrient = tsx_GetMountReport();
  if( isSchedulerStopped() ) {
    return false; // exit
  }

  // *******************************
  // UpdateStatus( " Setup guider: " + target.targetFindName );
	SetUpAutoGuiding( target, doCalibration );			// Setup & Start Auto-Guiding.
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
    tsxDebug(' Failed to find a valid target session.');
  }
  else {
    tsxDebug(' Valid target: ' + target.targetFindName);
    var result = UpdateImagingTargetReport (target);
    tsx_SetServerState( 'targetName', target.targetFindName);

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
        UpdateStatus(' Devices Updated');
	       tsxDebug( tsx_return );
         return;
      }
      if( tsx_return.split('|')[0].trim() === "TypeError: The operation failed because there is no connection to the device. Error = 200.") {
	      tsxDebug( tsx_return );
        UpdateStatus('The operation failed because there is no connection to the device.');
	      return;
      }
      try {
        tsx_UpdateDevice(
          'guider',
          tsx_return.split('|')[1].trim(),
          tsx_return.split('|')[3].trim(),
        );
      } catch (e) {
        tsxDebug( ' No guider found.' );
      }

      try {
        tsx_UpdateDevice(
          'camera',
          tsx_return.split('|')[5].trim(),
          tsx_return.split('|')[7].trim(),
        );
      } catch (e) {
        tsxDebug( ' No camera found.' );
      }

      try {
        tsx_UpdateDevice(
          'efw',
          tsx_return.split('|')[9].trim(),
          tsx_return.split('|')[11].trim(),
        );
      } catch (e) {
        tsxDebug( ' No EFW found.' );
      }

      try {
        tsx_UpdateDevice(
          'focuser',
          tsx_return.split('|')[13].trim(),
          tsx_return.split('|')[15].trim(),
        );
      } catch (e) {
        tsxDebug( ' No focuser found.' );
      }

      try {
        tsx_UpdateDevice(
          'mount',
          tsx_return.split('|')[17].trim(),
          tsx_return.split('|')[19].trim(),
        );
      } catch (e) {
        tsxErr( ' No mount found.' );
      }

      try {
         tsx_UpdateDevice(
           'rotator',
           tsx_return.split('|')[21].trim(),
           tsx_return.split('|')[23].trim(),
         );
       } catch (e) {
         tsxDebug( ' No rotator found.' );
       }


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
         let name = tsx_return.split('|')[index+i].trim();
         let filter = Filters.findOne({name: name });
         let exp = 0;
         if( typeof filter != 'undefined' ) {
           exp = filter.flat_exposure;
         }
         Filters.upsert( {slot: i }, {
           $set: {
             name: name,
             flat_exposure: exp,
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
	var chkTwilight = tsx_GetServerStateValue('isTwilightEnabled');
  tsxDebug(' Twilight check enabled: ' + chkTwilight);
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
    tsxDebug(' *** Twilight disabled');
    return true;
  }
}

// **************************************************************
export function tsx_isDark() {
  // tsxDebug('************************');
  tsxDebug(' *** tsx_isDark' );
	var chkTwilight = tsx_GetServerStateValue('isTwilightEnabled');
  var defaultMinSunAlt = tsx_GetServerStateValue('defaultMinSunAlt');
  tsxDebug(' Twilight check enabled: ' + chkTwilight);
  var isDark = '';
  var tsx_is_waiting = true;
	if( chkTwilight ) {
    var cmd = tsx_cmd('SkyX_JS_Twilight');
    cmd = cmd.replace('$000', defaultMinSunAlt );
    tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
      var result = tsx_return.split('|')[0].trim();
      tsxDebug('Any error?: ' + result);
      if( result == "Light" || result == "Dark" ) {
        isDark = result;
        tsxLog( ' Sun altitude: ' + tsx_return.split('|')[1].trim());
      }
      else {
        forceAbort = true;
        tsxLog('SkyX_JS_Twilight Failed. Error: ' + result);
      }
      tsx_is_waiting = false;
    }));
    while( tsx_is_waiting ) {
      Meteor.sleep( 1000 );
    }

    tsxDebug(' Dark enough: ' + isDark);
    if( isDark == 'Light') {
      tsxDebug( ' Not Dark enough.');
      return false;
    }
    else {
      tsxDebug( ' Dark enough.');
      return true;
    }
	}
  else {
    tsxDebug(' *** Twilight disabled');
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
		targetMinAlt = tsx_GetServerStateValue(tsx_ServerStates.defaultMinAltitude);
	}
	var curAlt = target.report.ALT;
	tsxInfo(' ' + target.targetFindName + ': altitude (' + curAlt + ') <'+ ' minAlt (' + targetMinAlt + ')' );
	if( curAlt < targetMinAlt ) {
		tsxInfo( ' ' + target.targetFindName + ': Stoped, below Minimum Altitude.' );
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
  tsxDebug( ' --- check meridian (' + lastDir + '), cf. previous (' + curDir +')');
  if( curDir == 'West' && lastDir == 'East') {
    // we need to flip
    tsxDebug( ' ' + target.targetFindName + ': merdian flip needed.' );
    return true;
  }
  else {
    tsxDebug( ' ' + target.targetFindName + ': NO merdian flip needed.' );
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

  let lastFocusTemp = tsx_GetServerStateValue( 'initialFocusTemperature' ); // get last temp

  if( lastFocusTemp == 'Simulator' ) {
    tsxDebug(' !!! Simulator will not do focus calculations');
    return false;
  }
  else if( lastFocusTemp == '' || typeof lastFocusTemp == 'undefined' ) {
    tsxLog(' *** ' + target.targetFindName + ': Initial focus not found trying again.');
    return true;
  }
  tsxDebug( ' lastFocus temp: ' + lastFocusTemp );

  let time_t = lastFocusTemp.timestamp;
  // assume needed within 6 hours: 60sec *60 min * 6 hr
  let didTimePass = hasTimePassed( 21600, time_t );
  if( didTimePass ) {
    return true;
  }
  // check temp difference
  else {
    let curFocusTemp = target.report.focusTemp; // read new temp
    tsxDebug( ' curFocusTemp temp: ' + curFocusTemp );
    if( typeof curFocusTemp == 'undefined' ) {
      curFocusTemp = lastFocusTemp;
    }
    let focusDiff = Math.abs(curFocusTemp - lastFocusTemp).toFixed(2);
//    let targetDiff = target.tempChg; // diff for this target
    let tempDiff = tsx_GetServerStateValue( 'defaultFocusTempDiff' ); // get last temp
    if( typeof tempDiff == 'undefined' ) {
      tsxWarn(' !!! Focus temp diff is not set in defaults');
      return false;
    }
    else {
      tsxDebug(' --- Check Focus('+tempDiff+'): ' + focusDiff + '='+curFocusTemp +'-'+lastFocusTemp );
      if( focusDiff >= tempDiff ) {
      // returning true tell caller to run  @Focus3
        return true;
      }
    }
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
export function UpdateImagingTargetReport( target ) {
  // tsxDebug('************************');
  tsxDebug(' *** UpdateImagingTargetReport: ' + target.targetFindName );

  // how old is report... if less than 1 minute get report
  var tRprt = target.report;
  if( typeof tRprt == 'undefined'
    || typeof tRprt.updatedAt == 'undefined'
    || tRprt == ''
    || tRprt == false ) {
      tsxDebug(' Creating TargetReport: ' + target.targetFindName);
      tRprt = tsx_TargetReport( target );
      if( typeof tRprt == 'undefined' ) {
        return {
          ready: false,
        };
      }
  }

  // var cTime = new Date();
  // tsxDebug('Current time: ' + cTime );
  tsxDebug( '!!! updatedAt: ' + tRprt.updatedAt );
  // var msecDiff = cTime - tRprt.updatedAt;
  // tsxDebug('Report time diff: ' + msecDiff);
  // var mm = Math.floor(msecDiff / 1000 / 60);
  if( hasTimePassed( 60, tRprt.updatedAt ) ) { // one minte passed so update report.
    tsxDebug(' Refresh TargetReport: ' + target.targetFindName);
    tRprt = tsx_TargetReport( target );
  }
  else {
    tsxDebug(' Reuse TargetReport: ' + target.targetFindName);
    tRprt = target.report;
  }

  // Now have reprt and need to set the variables
  // the other checks use
  if( tRprt.ready != false && typeof tRprt != 'undefined' && tRprt != '') {
    TargetSessions.upsert({_id: target._id}, {
      $set:{
        report: tRprt,
      }
    });
  }

  return tRprt;
}


// need to return true if to stop
function isTargetConditionInValid(target) {
  tsxDebug('************************');
  tsxDebug(' *** isTargetConditionInValid: ' + target.targetFindName );
  tsxDebug(' ' + target.targetFindName + ': target evaluation');

  // *******************************
  tsxDebug( ' --- check stop conditions');

  // Were checks just run
  let timeToCheck = tsx_GetServerStateValue('isTargetConditionInValidExpired');
  if( typeof timeToCheck == 'undefined') {
    timeToCheck = new Date();
    tsx_SetServerState('isTargetConditionInValidExpired', timeToCheck );
  }

  // Only check ever minute
  let didTimePass = hasTimePassed( 60, timeToCheck ); // expire after one minute
  if( !didTimePass ) {
    if( isSchedulerStopped() ) {
      forceAbort = true;
      return true;
    }
    else {
      return false;
    }
  }
  else {
    timeToCheck = new Date();
    tsx_SetServerState('isTargetConditionInValidExpired', timeToCheck );
  }

  if( isSchedulerStopped() ) {
    forceAbort = true;
    return true; // exit
  }


  // *******************************
  // reassess the target state
  if( !(canTargetSessionStart( target )) ) {
    tsxDebug(' ' + target.targetFindName + ' cannot continue!!');
    forceAbort = true;
    return true;
  }
  else {
    // Used to update the monitor, as it is this target to continue
    tsx_SetServerState('scheduler_report', target.report );
  }

  // *******************************
  // confirm should use same target... and not higher priority
  var priorityTarget = getHigherPriorityTarget( target ); // no return
  if( priorityTarget.targetFindName != target.targetFindName ) {
    tsxDebug(' ' + target.targetFindName + ' has been replaced by ' + priorityTarget.targetFindName );
    forceAbort = true;
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
    UpdateStatus( ' ' + target.targetFindName + ': MERIDIAN FLIP NEEDED...');
    let res = prepareTargetForImaging( target, false, false ) ;

    return false; // all good continue
  }

  // *******************************
  // check if time to redo CLS
  var isCLSRepeatEnabled = tsx_GetServerStateValue('isCLSRepeatEnabled');
  if( isCLSRepeatEnabled === true ) {
    // now retry
    var defaultCLSRepeat = tsx_GetServerState('defaultCLSRepeat');
    if( typeof defaultCLSRepeat === 'undefined' ) {
      tsxDebug( ' Check if to CLS again - needs a value.');
      tsx_SetServerState('defaultCLSRepeat', 0); // default is off
      defaultCLSRepeat = tsx_GetServerState('defaultCLSRepeat');
    }

    // only SetUpForImagingRun if greater than zero
    var pTime = howMuchTimeHasPassed(defaultCLSRepeat.value, defaultCLSRepeat.timestamp);
    tsxDebug( ' --- checking CLS: ' + pTime+ ' of ' + defaultCLSRepeat.value + ' sec');

    if( defaultCLSRepeat.value > 0  ) {
      tsxDebug( ' Check if time to CLS again: ' + defaultCLSRepeat.value );
      tsxDebug( ' Check time: ' + defaultCLSRepeat.timestamp );
      var doCLS = hasTimePassed( defaultCLSRepeat.value, defaultCLSRepeat.timestamp )
      if( doCLS === true ) {
        UpdateStatus( ' ' + target.targetFindName + ': time to recentre ' + pTime+ ' of ' + defaultCLSRepeat.value + ' sec');
        // This will cause a calibration to happen...
        // do not need to calibrate wth a meridian flip
        //  SetUpForImagingRun( target, false, false );
        var cls = tsx_CLS(target); 						//# Call the Closed-Loop-Slew function to go to the target
        updateTargetIsCloudy( target, cls );
        if( !cls ) {
          UpdateStatusErr( ' Target centred FAILED: ' + cls.angle);
          throw( 'TSX_ERROR|Cloudy? Is Tsx Running?');
        }
        // UpdateStatus( " Setup guider: " + target.targetFindName );
      	SetUpAutoGuiding( target, false );			// Setup & Start Auto-Guiding.

        return false;
      }
      else {
        tsxDebug( ' ' + target.targetFindName + ': NOT recentring');
      }
    }
    else {
      tsxDebug( ' ' + target.targetFindName + ': NOT recentring');
    }
  }

  // *******************************
  // NOW CONTINUE ON WITH CURRENT SPOT...
  // FOCUS AND DITHER IF NEEDED
  //
	// *******************************
	// check if reFocusTemp - needs to refocus
  let runFocus3 = isFocusingNeeded( target );
  if( runFocus3 ) {
    tsx_AbortGuider();
    InitialFocus( target );
    // no need to return false... can keep going.
    tsxDebug( ' --- refocus, and redo autoguider');
    let didDither = false;
    let doDither = isDitheringNeeded( target );
    if( doDither == true  ) {
      didDither = tsx_dither( target ); //  runs SetUpAutoGuiding
    }
    else {
      SetUpAutoGuiding( target, false );			// Setup & Start Auto-Guiding.
    }
  }
  else {
    //
    // *******************************
    // Recheck if only dither is needed
    let didDither = false;
    let doDither = isDitheringNeeded( target );
    if( doDither == true ) {
      didDither = tsx_dither( target ); //  runs SetUpAutoGuiding
    }
  }
  tsxDebug( ' isTargetConditionInValid returns false to continue.');
  return false;
}

function isDitheringNeeded (target ) {
  tsxDebug(' *** isDitheringNeeded: ' + target.targetFindName);

  var ditherAt = targetDither( target );
  if( ditherAt <= 0 ) {
    return false;
  }
  var lastDither = Number(tsx_GetServerStateValue('imagingSessionDither'));
  var dCount = lastDither;; // +1;
  var doDither = (Math.round(dCount) >= Math.round(ditherAt));
  tsxDebug( ' --- check dithering needed: ' + doDither );
  return doDither;
}

// **************************************************************
function tsx_dither( target ) {
  // tsxDebug('************************');
  var Out = false;
  var ditherTarget = targetDither( target );
  var lastDither = Number(tsx_GetServerStateValue('imagingSessionDither'));
  var doDither = isDitheringNeeded( target );
  if( ditherTarget > 0 ) {
    if( doDither ) { // adding a plus one so the zero works and if one is passed it will rung once.

      // first abort Guiding
      // tsx_AbortGuider(); // not needed as put into dither

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

      tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        var result = tsx_return.split('|')[0].trim();
        tsxDebug('Any error?: ' + result);
        if( result != 'Success') {
          UpdateStatusWarn('!!! SkyX_JS_NewDither Failed. Error: ' + result);
        }
        else {
          // tsxLog('Dither success');
          UpdateStatus(' ' + target.targetFindName +': dither succeeded');
          // dither succeeded so reset count
          tsx_SetServerState('imagingSessionDither', 0);
        }
        Out = true;
        tsx_is_waiting = false;
      }));
      while( tsx_is_waiting ) {
        Meteor.sleep( 1000 );
      }
      // now redo Autoguiding...
      tsxDebug( ' Dither commands AutoGuide Redo');
      SetUpAutoGuiding( target, false );
    }
    else {
      // moved this line to happen right after taking a light Image
      // tsx_SetServerState('imagingSessionDither', lastDither+1);
      tsxDebug(' ' + target.targetFindName +': not dithering');
    }
  }
  else{
    tsxLog(' --- check dithering disabled');
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
  if( typeof sunAlt === 'undefined'  || sunAlt == '') {
    // hard coded to ~ nautical twilight
    // #TODO put the sun altitude into Settings
    sunAlt = -15;
  }

  cmd = cmd.replace('$001', sunAlt);
  cmd = cmd.replace('$002', target.minAlt);
  tsxDebug(' TargetReport.target:', target.targetFindName);
  tsxDebug(' TargetReport.sunAlt:', sunAlt);
  tsxDebug(' TargetReport.minAlt:', target.minAlt);
  var Out = {
    ready: false,
  };
  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
    if( tsx_has_error(tsx_return) == false ) {
      // e.g.
      // false|6.812618943699146|
      // true|West|42.2|5.593339690591149|22.023446766485247|3.4187695344846833|16.2723491463255240.0|0|
      // No error. Error = 0.
      tsxDebug( tsx_return );
      var result = tsx_return.split('|')[0].trim();
      if( result == 'TypeError: Object not found. Error = 250.') {
        UpdateStatusErr('!!! TargetReport failed. Target not found.');
        tsxLog( tsx_return );
      }
      else {
        var results = tsx_return.split('|');
        if( results.length > 0) {
          var result = results[0].trim();
          if( result == 'Success') {
            success = true;
          }
          for( var i=1; i<results.length;i++) {
            var token=results[i].trim();
            var param=token.split("=");
            switch( param[0] ) {

              case 'focusPosition':
                updateTargetReport( target._id, 'focusPosition', param[1] );
                break;
              case 'focusTemp':
                updateTargetReport( target._id, 'focusTemp', param[1] );
                break;
              case 'readyMsg':
                updateTargetReport( target._id, 'readyMsg', param[1] );
                break;
              case 'ready':
                updateTargetReport( target._id, 'ready', param[1] );
                break;
              case 'isDark':
                updateTargetReport( target._id, 'isDark', param[1] );
                break;
              case 'sunAltitude':
                updateTargetReport( target._id, 'sunAltitude', param[1] );
                break;
              case 'isValid':
                updateTargetReport( target._id, 'isValid', param[1] );
                break;
              case 'AZ':
                updateTargetReport( target._id, 'AZ', param[1] );
                break;
              case 'ALT':
                updateTargetReport( target._id, 'ALT', param[1] );
                break;
              case 'RA':
                updateTargetReport( target._id, 'RA', param[1] );
                break;
              case 'DEC':
                updateTargetReport( target._id, 'DEC', param[1] );
                break;
              case 'HA':
                updateTargetReport( target._id, 'HA', param[1] );
                break;
              case 'TRANSIT':
                updateTargetReport( target._id, 'TRANSIT', param[1] );
                break;
              case 'isValid':
                UpdateStatusErr('!!! TargetReport failed. Not found ('+target.targetFindName+'): ' + param[1]);
                break;
              case 'pointing':
                updateTargetReport( target._id, 'pointing', param[1] );
                break;
              default:

            }
          }
        }

        var rpt = TargetReports.findOne({target_id: target._id });
        target.report = rpt;

        tsx_SetServerState( tsx_ServerStates.targetRA, rpt.RA );
        tsx_SetServerState( tsx_ServerStates.targetDEC, rpt.DEC );
        tsx_SetServerState( tsx_ServerStates.targetALT, rpt.ALT );
        tsx_SetServerState(tsx_ServerStates.targetAZ, rpt.AZ );
        tsx_SetServerState( tsx_ServerStates.targetHA, rpt.HA );
        tsx_SetServerState( tsx_ServerStates.targetTransit, rpt.TRANSIT );
        tsx_SetServerState( 'mntMntPointing', rpt.pointing );

        tsxDebug( target.targetFindName + ' ' + rpt.ALT);
        Out=rpt;
      }
    }
    tsx_is_waiting = false;
  }));
  while( tsx_is_waiting ) {
    Meteor.sleep( 1000 );
  }
  return Out;
}

// **************************************************************
function tsx_MatchRotation( target ) {
  // tsxDebug('************************');
  var rotateSucess = false;
  try {
    tsxDebug(' *** tsx_MatchRotation: ' + target.targetFindName);

    var isEnabled = tsx_GetServerStateValue( 'isFOVAngleEnabled');
    if( typeof isEnabled === 'undefined') {
      tsx_SetServerState( 'isFOVAngleEnabled', false );
      isEnabled = false; // assume within one degree default
    }

    var angle = target.angle;
    let foundFOV = false;
    tsxDebug( ' Founds target FOV: ' + angle );
    if( typeof angle === 'undefined' || angle === '') {
      var str = ' Matching Angle: no target angle set.';
      tsxDebug( str );
    }
    else {
      foundFOV = true;
    }

    if( isEnabled && foundFOV ) {
      var pixelSize = tsx_GetServerStateValue( 'imagingPixelSize');
      if( typeof pixelSize === 'undefined') {
        var str =  ' *** Rotating failed: fix by setting default image pixel size';
        UpdateStatusErr( str );
        tsxError( str );
        return rotateSucess;
      }
      var focalLength = tsx_GetServerStateValue( 'imagingFocalLength');
      if( typeof focalLength === 'undefined') {
        var str =  ' *** Rotating failed: fix by setting default focal length';
        UpdateStatusErr( str );
        tsxError( str );
        return rotateSucess;
      }
      var fovExposure = tsx_GetServerStateValue( 'defaultFOVExposure');
      if( typeof fovExposure === 'undefined') {
        tsx_SetServerState( 'fovExposure', 4 );
        var str = ' *** Rotating FIXED: set to a default 4 sec, check on default page';
        UpdateStatusErr( str );
        tsxWarn( str );
      }
      var ACCURACY = tsx_GetServerStateValue( 'fovPositionAngleTolerance');
      if( typeof ACCURACY === 'undefined') {
        ACCURACY = 1; // assume within one degree default
      }

      var cmd = tsx_cmd('SkyX_JS_MatchAngle');
      cmd = cmd.replace('$001', pixelSize);
      cmd = cmd.replace('$002', focalLength);
      cmd = cmd.replace('$003', ACCURACY);

      UpdateStatus( ' ' + target.targetFindName + ': setting FOV to ('+ angle +')' );
      cmd = cmd.replace('$000', angle );
      cmd = cmd.replace('$004', 0); // ImageLink Angle

      tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        var result = tsx_return.split('|')[0].trim();
        //e.g. Success|imageLinkAng=0.00|targetAngle=0.00|rotPos=-0.3305915915429978|newPos=-0.32895315919987494
        tsxDebug('Any error?: ' + result);
        if( result != 'Success') {
          forceAbort = true;
          tsxWarn(' !!! SkyX_JS_MatchAngle Failed. Error: ' + result);
        }
        else {
          rotateSucess = true;
  //        var resMsg = "imageLinkAng=NA|targetAngle=NA|rotPos=" + TARGETANG + "|newPos=" + rotPos;

          var linkAngle = tsx_return.split('|')[1].trim();
          var angle = linkAngle.split('=')[1].trim();
          UpdateStatus(' ' + target.targetFindName + ': Rotator FOV angle: ' + angle);
        }
        tsx_is_waiting = false;
      }));
      while( tsx_is_waiting ) {
        Meteor.sleep( 1000 );
      }
    }
    else {
      var str = ' *** ' + target.targetFindName + ': match angle disabled, or no angle set.';
      tsxDebug( str );
    }
  }
  catch( e ) {
    var str = ' *** Match angle FAILED';
    tsxDebug( str );
  }
  return rotateSucess;
}

// **************************************************************
export function tsx_RotateCamera( position, cls ) {
  // tsxDebug('************************');
  tsxDebug(' *** tsx_RotateCamera: ' + position);

  let rotateSucess = false;
  let fovExposure = tsx_GetServerStateValue( 'defaultFOVExposure');
  let pixelSize = tsx_GetServerStateValue( 'imagingPixelSize');
  let focalLength = tsx_GetServerStateValue( 'imagingFocalLength');
  if(
    typeof position === 'undefined' || position === ''
  ) {
    let str = ' !!! Rotating failed: Exiting - type or position needed.';
    UpdateStatusErr( str );
    tsxErr( str );
    return rotateSucess;
  }
  if( typeof pixelSize === 'undefined') {
    let str =  ' !!! Rotating failed: fix by setting default image pixel size';
    UpdateStatusErr( str );
    tsxErr( str );
    return rotateSucess;
  }
  if( typeof focalLength === 'undefined') {
    let str =  ' !!! Rotating failed: fix by setting default focal length';
    UpdateStatusErr( str );
    tsxErr( str );
    return rotateSucess;
  }
  if( typeof fovExposure === 'undefined') {
    tsx_SetServerState( 'fovExposure', 4 );
    let str = ' *** Rotating FIXED: set to a default 4 sec, check on default page';
    UpdateStatusErr( str );
    tsxWarn( str );
  }
  let ACCURACY = tsx_GetServerStateValue( 'fovPositionAngleTolerance');
  if( typeof ACCURACY === 'undefined') {
    ACCURACY = 1; // assume within one degree default
    tsxWarn( " *** Using default accuracy of 1 degree" );
  }

  let cmd = tsx_cmd('SkyX_JS_MatchAngle');
  cmd = cmd.replace('$000', position );
  cmd = cmd.replace('$001', pixelSize);
  cmd = cmd.replace('$002', focalLength);
  cmd = cmd.replace('$003', ACCURACY);
  cmd = cmd.replace('$004', cls); // 1 = rotate; 0 = imagelink
  if( cls == 1) {
    UpdateStatus(' MANUAL: Rotator/Camera rotating position: ' + position);
  }
  else {
    UpdateStatus(' MANUAL: ImageLINK FOV: ' + position);
  }
  let tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
    let result = tsx_return.split('|')[0].trim();
    //e.g. Success|imageLinkAng=0.00|targetAngle=0.00|rotPos=-0.3305915915429978|newPos=-0.32895315919987494
    tsxDebug('Any error?: ' + result);
    if( result != 'Success') {
      forceAbort = true;
      tsxWarn('!!! SkyX_JS_MatchAngle Failed. Error: ' + result);
    }
    else {
      rotateSucess = true;
      var resMsg = tsx_return.split('|')[3].trim();
      tsxLog( resMsg);
      var pos = resMsg.split('=')[1].trim();
     UpdateStatus(' MANUAL: Rotator/Camera set: ' + Number(pos).toFixed(3));
    }
    tsx_is_waiting = false;
  }));
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
      tsxDebug(' Found progress to update: ' + taken);
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
  tsxDebug(' Updated target progress');

  return taken;
}

// **************************************************************
// this function resets the progress when a series needs to report
function resetTargetImageProcess(target, series ) {
  // tsxDebug('************************');
  tsxDebug(' *** resetTargetImageProcess: ' + target.targetFindName);
  var progress = target.progress;
  if( typeof progress == 'undefined') {
    progress = [];
  }
  var found = false;
  for (var i = 0; i < progress.length; i++) {
    if (progress[i]._id == series._id ) {
      progress[i].taken=0;
      found = true;
      break;
    }
  }
  if (!found) { // we are adding to the series
    progress.push( {_id:series._id, taken: 0} );
  }
  TargetSessions.update({_id: target._id}, {
    $set: {
      progress: target.progress,
    }
  });
  return progress;
}

// **************************************************************
// this function is used to obtain how many images have been taken
// for the series
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
export function tsx_takeImage( filterNum, exposure, frame, target, delay, binning ) {
  // tsxDebug('************************');
  tsxDebug(' *** tsx_takeImage: ' + filterNum );

  var success = false;

  var cmd = tsx_cmd('SkyX_JS_TakeImage');
  postProgressTotal(exposure);

  if( delay == '' || typeof delay == 'undefined' ) {
    delay = 1;
  }
  if( binning == '' || typeof binning == 'undefined' ) {
    binning = 1;
  }

  cmd = cmd.replace("$000", filterNum ); // set filter
  cmd = cmd.replace("$001", exposure );  // set exposure
  cmd = cmd.replace("$002", frame );     // set Light/Dark/Flat/Bias
  cmd = cmd.replace("$003", target.targetFindName ); // set target
  cmd = cmd.replace("$004", delay );   // set target
  cmd = cmd.replace("$005", binning ); // set target

  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
    // e.g.
    // Success|RMS_ERROR=0.00|ROTATOR_POS_ANGLE=-350|ANGLE=349.468|FOCUS_POS=0.000
    tsxDebug(' TakeImage return: ' + tsx_return );
    if( tsx_has_error(tsx_return) == false ) {
      var results = tsx_return.split('|');
      if( results.length > 0) {
        var result = results[0].trim();
        if( result == 'Success' ) {
          success = true;
          var iid = addImageReport( target.targetFindName );
          for( var i=1; i<results.length;i++) {
            var token=results[i].trim();
            // RunJavaScriptOutput.writeLine(token);
            var param=token.split("=");
            switch( param[0] ) {

              case 'ALT':
                updateImageReport( iid, 'ALT', param[1] );
                updateTargetReport( target._id, 'ALT', param[1] );
                break;

              case 'AZ':
                updateImageReport( iid, 'AZ', param[1] );
                updateTargetReport( target._id, 'AZ', param[1] );
                break;

              case 'RA':
                updateImageReport( iid, 'RA', param[1] );
                updateTargetReport( target._id, 'RA', param[1] );
                break;

              case 'DEC':
                updateImageReport( iid, 'DEC', param[1] );
                updateTargetReport( target._id, 'DEC', param[1] );
                break;

              case 'pointing':
                updateImageReport( iid, 'pointing', param[1] );
                updateTargetReport( target._id, 'pointing', param[1] );
                break;

              case 'ANGLE':
                updateImageReport( iid, 'ANGLE', param[1] );
                updateTargetReport( target._id, 'pointing', param[1] );
                break;

              case 'HA':
                updateImageReport( iid, 'HA', param[1] );
                updateTargetReport( target._id, 'HA', param[1] );
                break;

              case 'TRANSIT':
                updateImageReport( iid, 'TRANSIT', param[1] );
                updateTargetReport( target._id, 'TRANSIT', param[1] );
                break;

              case 'FOCUS_POS':
                updateImageReport( iid, 'FOCUS_POS', param[1] );
                updateTargetReport( target._id, 'focusPosition', param[1] );
                break;

              case 'sunAltitude':
                updateImageReport( iid, 'sunAltitude', param[1] );
                updateTargetReport( target._id, 'sunAltitude', param[1] );
                break;

              case 'focusTemp':
                updateImageReport( iid, 'focusTemp', param[1] );
                updateTargetReport( target._id, 'focusTemp', param[1] );
                break;

              case 'ROTATOR_POS_ANGLE':
                updateImageReport( iid, 'ROTATOR_POS_ANGLE', param[1] );
                updateTargetReport( target._id, 'ROTATOR_POS_ANGLE', param[1] );
                break;

              case 'RMS_ERROR':
                updateImageReport( iid, 'RMS_ERROR', param[1] );
//                updateTargetReport( target._id, 'pointing', param[1] );
                break;

              case 'fileName':
                updateImageReport( iid, 'fileName', param[1] );
                break;

              default:
                //RunJavaScriptOutput.writeLine(param[0]+' not found.');
            }
          }

          updateImageReport( iid, 'target', target.targetFindName );
          updateImageReport( iid, 'subFrameTypes', getFrameName(frame) );
          updateImageReport( iid, 'filter', getFilterName(filterNum) );
          updateImageReport( iid, 'exposure', exposure );
//          updateImageReport( iid, 'level', tName );
          updateImageReport( iid, 'binning', 1 );

          // increment Dither count
          if( frame == '1 ' ) { // 1 = Light
            var lastDither = Number(tsx_GetServerStateValue('imagingSessionDither'));
            tsx_SetServerState('imagingSessionDither', lastDither+1);
          }
        }
      }
    }
    else {
      tsxWarn(' Image failed: ' + tsx_return);
    }
    Meteor.sleep( 500 ); // needs a sleep before next image
    tsx_is_waiting = false;
  }));
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
   if( isSchedulerStopped() ) {
     tsxDebug('Stop Waiting Image - scheduler Stopped');
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
  cmd = cmd.replace("$000", target.targetFindName.trim() ); // set filter

  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        tsxDebug(' Image: ' + tsx_return);

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

  tsxDebug(' Series repeat: ' + series.repeat);
  var taken = takenImagesFor(target, series._id);
  tsxDebug(' In series taken: ' + taken);
  var remainingImages = series.repeat - taken;
  tsxDebug(' In series remaining: ' + remainingImages);
  tsxDebug(' Series: ' + series.filter + ' at ' + series.exposure + ' seconds');

  // *******************************
  // Take the image
  var slot = getFilterSlot( series.filter );
  var frame = getFrame( series.frame );//  cdLight =1, cdBias, cdDark, cdFlat
  var num = taken+1;
  if( (remainingImages <= series.repeat) && (remainingImages > 0) ) {
    UpdateStatus( ' ' + target.targetFindName + ': ' + series.frame + ' ' + series.filter + ' at ' + series.exposure + ' seconds, ' + num + '/' +series.repeat + ' TAKING' );

    var res = tsx_takeImage( slot, series.exposure, frame, target );
    if( res != false ) {
      UpdateStatus( ' ' + target.targetFindName + ': ' + series.frame + ' ' + series.filter + ' at ' + series.exposure + ' seconds, ' + num + '/' +series.repeat + ' DONE' );
      // *******************************
      // Update progress
      // tsxLog(' *** Image taken: ' + series.filter + ' at ' + series.exposure + ' seconds');
      incrementTakenFor( target, series._id );

      // *******************************
      // ADD THE FOCUS AND ROTATOR POSITIONS INTO THE FITS HEADER
      //   tsx_UpdateFITS( target );
      //   Now done after taking the image
    }
  }
  else {
    UpdateStatus( target.targetFindName + ': ' + series.frame + ' ' + series.filter + ' at ' + series.exposure + ' seconds: ' + num + '/' +series.repeat + ' COMPLETED' );
  }
  var jid = tsx_GetServerState('runScheduler');
  if( jid == '' ) {
    // the process was stopped...
    tsxDebug('Throwing in imaging...');
    throw(' *** END SESSIONS');
  }
  return;
}

function targetDither( target ) {
  let ditherAt = 0;
  let template;
  try {
    template = TakeSeriesTemplates.findOne( {_id:target.series._id});
    let ditherTarget = template.defaultDithering;
    if( ditherTarget == '' || typeof ditherTarget == 'undefined') {
      ditherAt = 0;
    }
    else {
      ditherAt = ditherTarget;
    }
  }
  catch( e ) {
    UpdateStatus(' !!! Failed - series dither: ' + target.targetFindName + '>> ' + e);
  }
  return Number( ditherAt );
}

// **************************************************************
export function processTargetTakeSeries( target ) {
  // process for each filter
  tsxDebug( ' === ' + target.targetFindName + ": Target started");
  tsxDebug(' === processTargetTakeSeries: ' + target.targetFindName);

  var template = TakeSeriesTemplates.findOne( {_id:target.series._id});
  if( typeof template == 'undefined') {
    UpdateStatusErr(' !!! Failed - check series for: ' + target.targetFindName);
    return;
  }
  tsxDebug(' === Loading TakeSeriesTemplates:' + target.series.value );
  var seriesProcess = template.processSeries;
  tsxDebug(' === Imaging process: ' + seriesProcess );
  var numSeries = template.series.length;
  tsxDebug(' === Number of takeSeries: ' + numSeries );

  // load the filters
  var takeSeries = [];
  for (var i = 0; i < numSeries; i++) {
    var series = Seriess.findOne({_id:template.series[i].id});
    if( typeof series != 'undefined') {
      tsxDebug(' === Found - ' + template.name + ' - filter: ' + series.filter);
      takeSeries.push(series);
    }
  }
  tsxDebug(' === Number of filters: ' + takeSeries.length);

  // sort the by the order.
  takeSeries.sort(function(a, b){return a.order-b.order});
  tsxDebug(' === Sorted series order: ' + takeSeries.length);

  // create report
  var seriesReport = ' === Series Name: ' +template.name;
  UpdateStatus( seriesReport );
  UpdateStatus(' === Process: ' + template.processSeries);
  for (var i = 0; i < numSeries; i++) {
    var series = Seriess.findOne({_id:template.series[i].id});
    if( typeof series != 'undefined') {
      UpdateStatus(' === Filter: ' + series.filter + '@' + series.exposure + ' sec, ' + series.repeat + ' times');
    }
  }

  UpdateStatus(' === Dithering: ' + targetDither( target ));
  if( template.repeatSeries == true ) {
    UpdateStatus(' === Repeating: ' + template.repeatSeries );
  }
  tsxLog( ' -------------------------------');
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
          taken = takenImagesFor(target, series._id);
        }
        // need to check if we repeat the list
        if( taken < series.repeat && template.repeatSeries != true ) {
          // series has more images so repeat across
          remainingImages = true;
        }

        // #TODO - check end conditions - and skip if NOT light Frame
        if( series.frame == 'Light' ) { // if frame is light....
          stopTarget = isTargetConditionInValid(target);
          if( stopTarget != true ) {
            let didDither = tsx_dither( target );
          }
        }
        else {
          tsxInfo(' Skipping end conditions - not Light Frame');
          stopTarget = false;
        }
      }

      // reset to check across series again
      if( remainingImages ) {
        i=-1; //  set to -1 so that it is incremented back to zero...

        // so the issue is in here... for some reason the continue to processSeries
        // the next image is not happening..

        tsxDebug( ' --- there are remaining images.');
      }
      else {
        if( template.repeatSeries == true ) {
          tsxDebug(' *** Repeating Series ***');
          for( var s = 0; s < takeSeries.length; s ++ ) {
              var ser = takeSeries[s];
              target.progress = resetTargetImageProcess( target, ser);
          }
          i=-1;
        }
        else {
          UpdateStatus(' *** TARGET COMPLETED ***');
        }
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
      tsxDebug( ' Taken: ' + taken + ', Remaining: ' + ', series.repeat: ' + series.repeat );

      // take remaining images
      for (var perSeries = 0; perSeries < remainingImages && !stopTarget && (!isSchedulerStopped()); perSeries++) {

        // take image
        takeSeriesImage(target, series);

        // check end conditions
        if( series.frame == 'Light' ) { // if frame is light....
          stopTarget = isTargetConditionInValid(target);
          if( stopTarget != true ) {
            let didDither = tsx_dither( target );
          }
        }
        else {
          tsxInfo(' *** Skipping end conditions - not Light Frame');
          stopTarget = false;
        }
      }
      // now switch to next filter
      // and check for a repeat...
      if( template.repeatSeries == true && (i+1) >= takeSeries.length) {
          tsxDebug(' *** Repeating Series ***');
          // reset series counts
          for( var s = 0; s < takeSeries.length; s ++ ) {
              var series = takeSeries[s];
              target.progress = resetTargetImageProcess( target, series);
          }
          i =- 1;
      }
    }
    else {
      tsxWarn('!!! FAILED to process seriess');
    }
  }

  tsx_AbortGuider();
  var filter = tsx_GetServerStateValue('defaultFilter');
  UpdateStatus( ' === ' + target.targetFindName + ": Target stopped");
  tsxLog( ' =============================== ');
  return;
}

// **************************************************************
export function prepareTargetForImaging( target, doRotator, doCalibration ) {
  tsxDebug(' ***********************');
  tsxDebug(' *** prepareTargetForImaging: ' + target.targetFindName);
  forceAbort = false;
  if( typeof target == 'undefined') {
    target = 'No target found. Check constraints.'
    UpdateStatus( " Selecting failed: "+ target);
    return false;
  }
  else {
    UpdateImagingSesionID( target._id );
    UpdateStatus( ' '+ target.targetFindName + ": SELECTED");
    tsx_SetServerState('targetName', target.targetFindName);

    var targetCoords = UpdateImagingTargetReport( target );
    var curDir = targetCoords.direction;
    tsx_SetServerState('lastTargetDirection', curDir);
    UpdateStatus( ' '+ target.targetFindName + ": pointing " + curDir);

    var ready = SetUpForImagingRun( target, doRotator, doCalibration );
    if( ready ) {
//      var rpt = TargetReports.findOne({ target_id: target._id })
      tsx_SetServerState('scheduler_report', target.report );
    }
    // So if the setup is "false"... then no target.... who is going to redirect...
    // the target selection needs to know this...
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

  var targetSessions = TargetSessions.find({
    enabledActive: true,
    isCalibrationFrames: false,
  }).fetch();
  var numSessions = targetSessions.length;
  tsxInfo(' Targets to check: ' + numSessions);

  // get first validSession
  var validSession;
  var foundSession = false;
  for (var i = 0; i < numSessions; i++) {
    var canStart = canTargetSessionStart( targetSessions[i]);
    // tsxLog( 'Checked ' + targetSessions[i].targetFindName + ': ' + canStart);
    if( canStart ) {
      validSession = targetSessions[i];
      foundSession = true;
      tsxInfo( ' Candidate: ' + validSession.targetFindName);
      break;
    }
  }

  // now iterate the sessions to find anyting with higher
  // priotiry
  if( foundSession ) {
    validSession = getHigherPriorityTarget( validSession );
    tsxDebug( ' chose: ' + validSession.targetFindName );
  }
  tsxDebug('************************');
  return validSession;
}

// *******************************
// Check for calibration sessions
export function findCalibrationSession() {
  // tsxDebug('************************');
  tsxDebug(' *** findCalibrationSession: ' );
  var calFrames = '';
  var calSessions = TargetSessions.find({
    enabledActive: true,
    isCalibrationFrames: true,
  }).fetch();
  if( calSessions.length > 0 ) {
    calFrames = calSessions;
  }
  return calFrames;
}

// **************************************************************
function getHigherPriorityTarget( validSession ) {
  // tsxDebug('************************');
  tsxDebug(' *** getHigherPriorityTarget: ' + validSession.targetFindName);

  var targetSessions = TargetSessions.find({
    enabledActive: true,
    isCalibrationFrames: false,
  }).fetch();
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
              tsxDebug( ' *** priority given: ' + validSession.targetFindName);
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
// Assuming a time in seconds is provided and a Date Object
export function hasTimePassed( duration, timestamp ) {
  var now = new Date();
  var diff = parseInt(now - timestamp)/1000; // Difference in seconds
  if( diff >= duration) {
    return true;
  }
  return false;
}
// *************************** ***********************************
// Assuming a time in seconds is provided and a Date Object
export function howMuchTimeHasPassed( duration, timestamp ) {
  var now = new Date();
  var diff = parseInt(now - timestamp)/1000; // Difference in seconds
  return diff;
}

export function hasStartTimePassed( target ) {
  // tsxDebug('************************');
  tsxDebug(' *** hasStartTimePassed: ' + target.targetFindName );

  var start_time = target.startTime;
  var canStart = isTimeBeforeCurrentTime( start_time );
  // do not start if undefined
  return canStart;
}

export function isDateBeforeCurrentDate( chkDate ) {
  var cur_dts = new Date();
  var cur_time = cur_dts.getHours()+(cur_dts.getMinutes()/60);
  // tsxDebug('Current time: ' + cur_time );

  // add 24 to the morning time so that
  ((cur_time < 8) ? cur_time=cur_time+24 : cur_time);

  chkDate = chkDate.getHours()+(chkDate.getMinutes()/60);


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

// **************************************************************
// #TODO used this for one consistent time comparing function
//
// 24hrs e.g.
// 21:00
// return true if undedefined
export function isTimeBeforeCurrentTime( ts ) {
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

  var result =  UpdateImagingTargetReport( target );
  if( !result.ready ) {
    tsxDebug( ' !!! Target not found: ' + target.targetFindName );
    return false;
  }
  var canStart = true;
  tsxDebug( ' Is target active: ' + target.enabledActive );
  if(!target.enabledActive){
    UpdateStatus( ' *** ' + target.targetFindName + ': not enabled' );
    return false; // the session is disabled
  }

  // check for target not ready
  var isComplete = isTargetComplete( target );
  tsxDebug( ' Is target complete: ' + isComplete );
  try {
    let isRepeating = TakeSeriesTemplates.findOne({_id: target.series._id }).repeatSeries;
    if( isComplete && target.isCalibrationFrames == false && !isRepeating ) {
      UpdateStatus( ' ' + target.targetFindName + ': is completed' );
      return false;
    }
  }
  catch( e ) {
    UpdateStatus( ' !!! Needs serie assigned: ' + target.targetFindName);
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
  // see up above... do not redo... var result =   UpdateImagingTargetReport( target );
  tsxDebug( ' Is target ready: ' + result.ready );
  if( !result.ready ) {
    UpdateStatus( ' ' + target.targetFindName + ' per report ready: ' + result.ready );
    return false;
  }

  // can be redundant with ready above... ready above can also mean not found
  var minAlt = tsx_reachedMinAlt( target );
  tsxDebug( ' Is target minAlt: ' + minAlt );
  if( minAlt ) {
    UpdateStatus( target.targetFindName+': current alt. ('+result.ALT+')' + ' vs. minimum (' + target.minAlt + ')');
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
    tsx_SetServerState( 'tool_active', true );

    tsxDebug(' ******************************* ');
    UpdateStatus(' Refreshing Devices...');
    try {
      var isOnline = tsx_ServerIsOnline();
      tsxDebug('tsx_ServerIsOnline: ' + isOnline);
      // *******************************
      //  GET THE CONNECTED EQUIPEMENT
      tsxDebug(' ******************************* ');
      tsxDebug('Loading devices');
      var out = tsx_DeviceInfo();
    }
    catch( e ) {
      if( e == 'TsxError' ) {
        UpdateStatus('!!! TheSkyX connection is no longer there!');
      }
    }
    finally {
      tsx_SetServerState( 'tool_active', false );
    }
   },

   // this from the monitor
   // it is used to test the image session
/*

Use this to set the last focus

*/
  //
  // **************************************************************
  // Used to pass RA/DEC to target editors
  targetFind(target) {
    tsx_SetServerState( 'tool_active', true );

    tsxDebug('************************');
    tsxDebug(' *** targetFind: ' + target.targetFindName);
    var res = '';
    try {
      res = UpdateImagingTargetReport(target);
    }
    catch( e )  {
      if( e == 'TsxError' ) {
        UpdateStatus('!!! TheSkyX connection is no longer there!');
      }
    }
    finally {
      tsx_SetServerState( 'tool_active', false );
    }
    return res;

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
    out = tsx_takeImage(slot,series.exposure, frame, targetSession );
    tsxDebug('Taken image: ' +res);

    return;
  },

  // **************************************************************
  // Manually start the imaging on the target...
  // Something like a one target Only
  // Assumes that CLS, Focus, Autoguide already running
  // DEPRECATED
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
      var endCond = isTargetConditionInValid( target );
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

    return SetUpAutoGuiding( target, true );

  },

  testAbortGuiding( target ) {
    tsxDebug('************************');
    tsxDebug(' *** testAbortGuiding' );

    return tsx_AbortGuider();
  },

  testSolve( target ) {
    tsxDebug('************************');
    tsxDebug(' *** testSolve' );

    return SetUpAutoGuiding( target, true );

  },

  testMatchRotation( target ) {
    tsxDebug('************************');
    tsxDebug(' *** testMatchRotation' );

    return tsx_MatchRotation( target );

  },

  centreTarget( target ) {
    tsx_SetServerState( 'tool_active', true );
    UpdateStatus( ' TOOLBOX: centring (CLS) ' + target.targetFindName );
    var result =  '';
    try {
      result = tsx_CLS( target);
      updateTargetIsCloudy( target, result );
      tsxDebug( '??? Debuging the manual Centring: ' + result );
      if( result.angle == -1 || result == false ) {
        UpdateStatusErr('  !!! Failed centring: ' + target.targetFindName);
      }
      else {
        UpdateStatus(' TOOLBOX: centred (CLS) ' + target.targetFindName);
      }
    }
    catch( e )  {
      if( e == 'TsxError' ) {
        UpdateStatus('!!! TheSkyX connection is no longer there!');
        tsx_SetServerState( 'tool_active', false );
      }
    }
    finally {
      tsx_SetServerState( 'tool_active', false );
    }
    return result;
  },


  getTargetReport( target ) {
    tsx_SetServerState( 'tool_active', true );
    UpdateStatus( ' Getting report : ' + target.targetFindName );
    try {
      var result = tsx_TargetReport( target );
      UpdateStatus( ' Refresh complete' );
    }
    catch( e )  {
      if( e == 'TsxError' ) {
        UpdateStatus('!!! TheSkyX connection is no longer there!');
      }
    }
    finally {
      tsx_SetServerState( 'tool_active', false );
    }
    return;
  },

  getTargetReports( targetArray ) {
    tsx_SetServerState( 'tool_active', true );
    UpdateStatus( ' Getting report : ' + target.targetFindName );
    try {
      for (let i = 0; i < targetArray.length; i++) {
        let target = targetArray[i];
        let result = tsx_TargetReport( target );
        UpdateStatus( ' Received report' );
      }
      UpdateStatus( ' Refresh complete' );
    }
    catch( e )  {
      if( e == 'TsxError' ) {
        UpdateStatus('!!! TheSkyX connection is no longer there!');
      }
    }
    finally {
      tsx_SetServerState( 'tool_active', false );
    }
    return;
  },

  refreshTargetReports() {
    tsx_SetServerState( 'tool_active', true );
    UpdateStatus( ' Refreshing targets' );
    try {
      let reports = TargetReports.find({}).fetch();

      for (let i = 0; i < reports.length; i++) {
        let report = reports[i];
        let target = TargetSessions.findOne({ _id: report.target_id });
        if( typeof target != 'undefined') {
          let rpt = tsx_TargetReport( target );
          UpdateStatus( ' --- Refreshed ' + target.targetFindName + ': ' + rpt.ready );
        }
      }
      UpdateStatus( ' Refresh complete' );
    }
    catch( e )  {
      if( e == 'TsxError' ) {
        UpdateStatus('!!! TheSkyX connection is no longer there!');
      }
    }
    finally {
      tsx_SetServerState( 'tool_active', false );
    }
  },

  park( ) {
    tsx_SetServerState( 'tool_active', true );
    let filter = tsx_GetServerStateValue('defaultFilter');
    let result = '';
    try {
      result = tsx_MntPark(filter, false ); // use default filter
    }
    catch( e )  {
      if( e == 'TsxError' ) {
        UpdateStatus('!!! TheSkyX connection is no longer there!');
      }
    }
    finally {
      tsx_SetServerState( 'tool_active', false );
    }
    return result;
  }


});
