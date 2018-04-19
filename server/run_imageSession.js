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

import { tsx_feeder } from './tsx_feeder.js'

import {shelljs} from 'meteor/akasha:shelljs';
var shell = require('shelljs');

var tsxHeader =  '/* Java Script *//* Socket Start Packet */';
var tsxFooter = '/* Socket End Packet */';
var forceAbort = false;

// **************************************************************
function UpdateStatus( status ) {
  tsx_SetServerState( 'currentStage', status );
}

// **************************************************************
function getFilterSlot(filterName) {
  // need to look up the filters in TSX
  var filter = Filters.findOne({name: filterName});
  console.log('Found Filter ' + filterName + ' at slot: ' + filter.slot);
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
  console.log('Found '+frame+' frame number: ' + num);
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
  console.log(' *** tsx_cmd: ' + script);
  // var src =
  var path = Npm.require('path');
  var rootPath = path.resolve('.');
  var src = rootPath.split(path.sep + '.meteor')[0];
  // var c = Meteor.absolutePath;
  // console.log('Root: ' + src);
  return src +'/imports/tsx/'+ script+'.js';
}

// **************************************************************
export function tsx_Connect() {
  console.log(' *** tsx_Connect[ing] ...');
  var success = false;
  var cmd = shell.cat(tsx_cmd('SkyX_JS_Connect'));

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
  console.log(' *** tsx_Disconnect[ing] ...');
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
    console.log(String(dts) + ': Soft park... ');
  }
  else {
    console.log(String(dts) + ': Full Park... ');
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
  console.log(' *** tsx_AbortGuider ...');
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
function tsx_SetUpAutoGuiding(targetSession) {
  console.log(' *** tsx_SetUpAutoGuiding: ' + targetSession.targetFindName);

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

  tsx_is_waiting = true;
  var guideStarX = 0;
  var guideStarY = 0;
  // var cmd = tsxCmdFindGuideStar();
  var cmd = String( shell.cat(tsx_cmd('SkyX_JS_FindAutoGuideStar')) );
  // cmd = cmd.replace('$000', targetSession.guideExposure );
  // cmd = cmd.replace('$001', targetSession.scale);
  // cmd = cmd.replace('$002', targetSession.exposure);
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        // console.log('Any error?: ' + tsx_return);
        guideStarX = tsx_return.split('|')[0].trim();
        guideStarY = tsx_return.split('|')[1].trim();
        UpdateStatus(  "Best guide star candidate: "+guideStarX+", "+guideStarY );
        tsx_is_waiting = false;
      }
    )
  );
  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }

  //
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

// **************************************************************
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
  ));
}

// **************************************************************
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

// **************************************************************
function tsx_RunFocus3( target ) {
  console.log(' *** tsx_RunFocus3: ' + target.targetFindName);
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

// **************************************************************
function tsx_InitialFocus( target ) {
  console.log(' *** tsx_InitialFocus: ' + target.targetFindName);
  var dts = new Date();
  console.log(String(dts) + ': Geting intial @focus3... ');
  var result = tsx_RunFocus3( target ); // need to get the focus position
  var temp = tsx_GetFocusTemp( target ); // temp and position set inside
}

// **************************************************************
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
      console.log(' *** focusTemp: ' + lastFocusTemp);

      lastFocusPos = tsx_return.split('|')[1].trim();
      tsx_SetServerState( 'lastFocusPos', lastFocusPos );
      console.log(' *** focPosition: ' + lastFocusPos);
      Out = {
        focusTemp: tsx_GetFocusTemp,
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
  var dts = new Date();
  console.log(String(dts) + ': Geting mount coordinates... ');

  var cmd = shell.cat(tsx_cmd('SkyX_JS_GetMntCoords'));

  var Out;

  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
      // console.log(tsx_return);
        Out = {
          ra: tsx_return.split('|')[0].trim(),
          dec: tsx_return.split('|')[1].trim(),
          hms: tsx_return.split('|')[2].trim(),
        }
        tsx_SetServerState( 'mntMntRA', tsx_return.split('|')[0].trim() );
        tsx_SetServerState( 'mntMntDEC', tsx_return.split('|')[1].trim() );
        tsx_SetServerState( 'mntMntMHS', tsx_return.split('|')[2].trim() );

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
  var dts = new Date();
  console.log(String(dts) + ': Geting mount orientiation... ');

  var cmd = String(shell.cat(tsx_cmd('SkyX_JS_GetMntOrient')) );

  var Out;
  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {

        Out = {
          direction: tsx_return.split('|')[0].trim(),
          altitude: tsx_return.split('|')[1].trim(),
        }
        tsx_SetServerState( 'mntMntDir', tsx_return.split('|')[0].trim() );
        tsx_SetServerState( 'mntMntAlt', tsx_return.split('|')[1].trim() );

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
        tsx_SetServerState( tsx_ServerStates.targetName, targetFindName);

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
	tsx_CLS(targetSession); 						//# Call the Closed-Loop-Slew function to go to the target

  // needs initial focus temp
  UpdateStatus( 'currentStage', "Recording intial temp" );
  // tsx_InitialFocus( targetSession );   //# Force a starting focus in case of mirror shift or because I forgot to.

  // Get Mount Coords and Orientations
	var mntCoords = tsx_GetMountCoords();
  var mntOrient = tsx_GetMountOrientation();

  // *******************************
  //    C. Match Rotation/Angle if provided:
  //      a) if entered for session
  //      b) obtained from image
  var rotateSucess = false;
  UpdateStatus( "Rotating to target angle" );
  // rotateSucess = tsx_MatchRotation( targetSession );

  UpdateStatus( "Setup guider" );
	tsx_SetUpAutoGuiding( targetSession );			// Setup & Start Auto-Guiding.

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
    console.log('Failed to find a valid target session.');
  }
  else {
    console.log('Found: ' + target.name);
    var result = tsx_GetTargetRaDec (target.targetFindName);
  }
  return target;
}

// **************************************************************
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
  console.log('************************');
  var targetFindName = target.targetFindName;
  console.log(' *** tsx_isDarkEnough for: ' + targetFindName);
	var chkTwilight = tsx_GetServerState('isTwilightEnabled').value;
  var tsx_is_waiting = true;
	var Out = false;
	if( chkTwilight ) {

	  var file = tsx_cmd('SkyX_JS_Twilight');
	  var cmd = shell.cat(file);
	  cmd = cmd.replace("$000", targetFindName ); // set filter

	  tsx_feeder(String(cmd), Meteor.bindEnvironment((tsx_return) => {
    		var result = tsx_return.split('|')[0].trim();
    		if( result  == 'Light' || result == 'Dark') {
    			if( result == 'Light') {
    				UpdateStatus( 'Stop|' + tsxSays.split('|')[1].trim() );
            // UpdateStatus( 'Stop|Twilight - Not dark' );
    				console.log('Not dark enough');
    				Out = false;
    			}
    			else {
            Out = true;
          }
			 }
       tsx_is_waiting = false;
   	}));
    while( tsx_is_waiting ) {
    	Meteor.sleep( 1000 );
    }
	}
  else {
    console.log('Twilight disabled');
    return true;
  }

  return Out;
}

// **************************************************************
// check minAlt - stop - find next
function tsx_reachedMinAlt( target ) {
  console.log('************************');
  console.log(' *** tsx_reachedMinAlt for: ' + target.targetFindName);
  var targetMinAlt = target.minAlt;
	if( typeof targetMinAlt == 'undefined' ) {
		targetMinAlt = tsx_GetServerState(tsx_ServerStates.defaultMinAltitude).value;
	}
	var result = tsx_GetTargetRaDec(target.targetFindName);
	var curAlt = result.alt;
	console.log(' *** is curAlt ' + curAlt + '<'+ ' minAlt ' + targetMinAlt);
	if( curAlt < targetMinAlt ) {
		UpdateStatus( 'Stop|Minimum Altitude Crossed' );
		return true;
	}
}

// **************************************************************
function isPriorityTarget( target ) {
  console.log('************************');
  console.log(' *** isPriorityTarget: ' + target.targetFindName);

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
function tsx_reachedStopTime( target ) {
  console.log('************************');
  console.log(' *** tsx_reachedStopTime: ' + target.targetFindName);
  var cur_dts = new Date();
  var cur_time = cur_dts.getHours()+(cur_dts.getMinutes()/60);
  console.log('Current time: ' + cur_time );

  // add 24 to the morning time so that
  ((cur_time < 8) ? cur_time=cur_time+24 : cur_time);

  var end_time = target.stopTime;
  console.log('End time: ' + end_time );
  var hrs = end_time.split(':')[0].trim();
  console.log('End hrs: ' + hrs );
  var min = end_time.split(':')[1].trim();
  console.log('End min: ' + min );
  end_time = Number(hrs)+ 24 + Number(min/60);
  console.log(' *** is cur_time ' + cur_time + '<'+ ' end_time ' + end_time );
  var reachStop = ((cur_time < end_time) ? false : true);
  if( reachStop ){
    return true;
  }
  return false;
}

// **************************************************************
function tsx_flipTime( target ) {
  console.log('************************');
  console.log(' *** tsx_flipTime: ');// + target.targetFindName);
  var mntCoords = tsx_GetMountOrientation();

  var curDir = mntCoords.direction;
  console.log( ' *** Mount pointing: ' + curDir );
  if( curDir == "East") {
    // do we need to flip
    var targetCoords = tsx_GetTargetRaDec( target.targetFindName );
    var tarDir = targetCoords.direction;
    console.log( ' *** Target pointing: ' + tarDir );
    if( tarDir == 'West') {
      // we need to flip
      console.log( ' *** Flip: Mount East & target ' + tarDir );

      // call CLS???

      return true;
    }
  }
  else {
    // do nothing already pointing west
  }
}

// **************************************************************
/*
// Java Script
focPos = ccdsoftCamera.focPosition;
focTemp = ccdsoftCamera.focTemperature;
out = focPos + '|' + focTemp + '|(position,temp)';
*/
function tsx_checkFocus(target) {
  console.log('************************');
  console.log(' *** tsx_checkFocus: ' + target.targetFindName);
  var lastFocusTemp = tsx_GetServerState( 'lastFocusTemp' ).value; // get last temp
  tsx_GetFocusTemp( target ); // read new temp
  var curFocusTemp = tsx_GetServerState( 'lastFocusTemp' ).value; // get new temp
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
  console.log(' *** hasReachedEndCondition: ' + target.targetFindName);

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
  var atStopTime = tsx_reachedStopTime( target );
  if( atStopTime ) {
    return true;
  }

	// *******************************
	// if not meridian - dither...
	// if meridian  - flip/slew... - preRun: focus - CLS - rotation - guidestar - guiding...
  var doFlip = tsx_flipTime( target );
  if( doFlip ) {
    // okay we have a lot to do...
    // execute the pre-run...
    SetUpForImagingRun( target);
    return false; // do not need to focus or dither as part of prerun
  }


	// *******************************
	// check reFocusTemp - refocus
  var runFocus3 = tsx_checkFocus( target );
  if( runFocus3) {
    tsx_RunFocus3(target);
    return false;
  }

  // #TODO: Finshed Dither
  console.log(' *******************************');
  console.log(' *******************************');
  console.log(' Finish dither');
  console.log(' *******************************');
  console.log(' *******************************');
  // var ditherTarget = tsx_GetServerState('targetDither').value;
  // if( ditherTarget ) {
  //   var dither = tsx_dither( target );
  // }

  return false;
}

// **************************************************************
function tsx_dither( target ) {
  console.log('************************');
  console.log(' *** tsx_dither: ' + target.targetFindName);
  var Out = false;
  // var cmd = tsxCmdMatchAngle(targetSession.angle,targetSession.scale, target.expos);
  var cmd = shell.cat(tsx_cmd('SkyX_JS_NewDither'));

  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        var result = tsx_return.split('|')[0].trim();
        console.log('Any error?: ' + result);
        if( result != 'Success') {
          console.log('SkyX_JS_MatchAngle Failed. Error: ' + result);
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
  console.log('************************');
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

// **************************************************************
function incrementTakenFor(target, seriesId) {
  console.log('************************');
  console.log(' *** incrementTakenFor: ' + target.targetFindName);
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
      console.log('Found progress to update: ' + taken);
      break;
    }
  }
  if (!found) { // we are adding to the series
    console.log('added the series to progress');
    progress.push( {_id:seriesId, taken: 1} );
  }
  TargetSessions.update({_id: target._id}, {
    $set: {
      progress: progress,
    }
  });
  console.log('Updated target progress');

  return taken;
}

// **************************************************************
function takenImagesFor(target, seriesId) {
  console.log('************************');
  console.log(' *** takenImagesFor: ' + target.targetFindName);
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
  console.log('************************');
  console.log(' *** tsx_takeImage: ' );

  console.log('Starting image');
  var success = 'Failed';

  var cmd = shell.cat(tsx_cmd('SkyX_JS_TakeImage'));
  console.log('Switching to filter number: ' + filterNum );

  cmd = cmd.replace("$000", filterNum ); // set filter
  cmd = cmd.replace("$001", exposure ); // set exposure
  cmd = cmd.replace("$002", frame ); // set exposure

  var tsx_is_waiting = true;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        var result = tsx_return.split('|')[0].trim();
        console.log('Image: ' + result);
        if( result === "Success") {
          success = result;
        }
        else {
          console.log('Image failed: ' + tsx_return);
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
        console.log('Image: ' + tsx_return);

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
  var out = false;
  console.log('************************');
  console.log(' *** takeSeriesImage: ' + target.targetFindName);
  console.log('Series repeat: ' + series.repeat);
  var taken = takenImagesFor(target, series._id);
  console.log('In series taken: ' + taken);
  var remainingImages = series.repeat - taken;
  console.log('In series remaining: ' + remainingImages);
  if( (remainingImages <= series.repeat) && (remainingImages > 0) ) {
    console.log('Series: ' + series.filter + ' at ' + series.exposure + ' seconds');

    // *******************************
    // Take the image
    var slot = getFilterSlot( series.filter );
    var frame = getFrame( series.frame );//  cdLight =1, cdBias, cdDark, cdFlat
    tsx_takeImage( slot, series.exposure, frame );
    // *******************************
    // Update progress
    console.log(' *** Image taken: ' + series.filter + ' at ' + series.exposure + ' seconds');
    incrementTakenFor( target, series._id );

    // *******************************
    // ADD THE FOCUS AND ROTATOR POSITIONS INTO THE FITS HEADER
    tsx_UpdateFITS( target );

    out = true; // need to return something
  }
  else {
    console.log(' *** Completed: ' + series.filter + ' at ' + series.exposure + ' seconds');
  }
  return out;
}

// **************************************************************
export function processTargetTakeSeries( target ) {
  // process for each filter
  console.log('************************');
  console.log(' *** processTargetTakeSeries: ' + target.targetFindName);
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
  takeSeries.sort(function(a, b){return a.order-b.order});
  console.log('Sorted series: ' + takeSeries.length);

  // set up for the cycle through the filters
  var stopTarget = false; // #IDEA #TODO can use the current jobId to potentially top
  for (var i = 0; i < takeSeries.length && !stopTarget; i++) {

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
        console.log(' *******************************\nSkipping end conditions');
        stopTarget = hasReachedEndCondition(target);

      }
      // reset to check across series again
      if( remainingImages ) {
        i=0;
      }
      else {
        console.log(' *** TARGET COMPLETED');
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
        console.log(' *******************************\nSkipping end conditions');
        stopTarget = hasReachedEndCondition(target);

      }
      // now switch to next filter
    }
    else {
      console.log('*** FAILED to process seriess');
    }
  }
}

// **************************************************************
export function prepareTargetForImaging( target ) {
  console.log(' *** prepareTargetForImaging: ' + target.targetFindName);

  if( typeof target == 'undefined') {
    target = 'No target found. Check constraints.'
    console.log(target);
    UpdateStatus( "Selecting failed: "+ target);
  }
  else {
    tsx_SetServerState( tsx_ServerStates.imagingSessionId, target._id );
    UpdateStatus( "Selected Target: "+ target.name);


    console.log(' ****tsx_GetTargetRaDec');
    var result = tsx_GetTargetRaDec(target.targetFindName);

    SetUpForImagingRun( target);

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
   // **************************************************************
   tsxTestImageSession() {
     console.log('************************');
     prepareTargetForImaging();
   },

   // **************************************************************
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

  // **************************************************************
  // Used to pass RA/DEC to target editors
  targetFind(targetFindName) {
    console.log('************************');
    console.log(' *** targetFind: ' + targetFindName);
    return tsx_GetTargetRaDec(targetFindName);

  },

  // **************************************************************
  // 7. Start session run:
  //    - take image
  startImagingTest(targetSession) {
    console.log('************************');
    console.log(' *** startImagingTest: ' + targetSession.targetFindName);
    // use the order of the series
    var series = targetSession.takeSeries.series[0];
    console.log('\nProcesing filter: ' + series.filter);
    console.log('Series repeat: ' + series.repeat);
    console.log('Series taken: ' + series.taken);
    var remainingImages = series.repeat - series.taken;
    console.log('number of images remaining: ' + remainingImages);
    console.log('Launching take image for: ' + series.filter + ' at ' + series.exposure + ' seconds');

    var slot = getFilterSlot( series.filter );
    //  cdLight =1, cdBias, cdDark, cdFlat
    var frame = getFrame(series.frame);
    out = tsx_takeImage(slot,series.exposure, frame);
    console.log('Taken image: ' +res);

    return;
  },

  // **************************************************************
  // Manually start the imaging on the target...
  // Something like a one target Only
  // Assumes that CLS, Focus, Autoguide already running
  startImaging(target) {
    console.log('************************');
    console.log(' *** startImaging: ' + target.name );
    tsx_SetServerState( tsx_ServerStates.imagingSessionId, target._id );
    tsx_GetTargetRaDec (target.targetFindName);

    // Will process target until end condition found
    processTargetTakeSeries( target );
  },

  testTargetPicking() {
    console.log('************************');
    console.log(' *** testTargetPicking' );
    var target = findTargetSession();
    if( typeof target == 'undefined') {
      console.log('No target found');
    }
    else {
      console.log('Found: ' + target.targetFindName);
    }
  },

  testEndConditions() {
    console.log('************************');
    console.log(' *** testEndConditions' );
    var target = findTargetSession();
    if( typeof target == 'undefined') {
      console.log('No target found');
    }
    else {
      console.log('Found: ' + target.targetFindName);
      var endCond = hasReachedEndCondition( target );
      console.log(target.targetFindName + ' ending=' + endCond );
    }
  },

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
    console.log( 'Checked ' + targetSessions[i].targetFindName + ': ' + canStart);
    if( canStart ) {
      validSession = targetSessions[i];
      foundSession = true;
      console.log( 'Candidate ' + validSession.targetFindName);
      break;
    }
  }

  // now iterate the sessions to find anyting with higher
  // priotiry
  if( foundSession ) {
    validSession = getHigherPriorityTarget( validSession );
  }
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
      console.log( 'canStart ' + chkSession.targetFindName + ': ' + canStart);
      if( canStart ) {
        var valPriority = Number(validSession.priority);
        var chkPriority = Number(chkSession.priority);
        var chk = valPriority - chkPriority;
        if( (chk > 0) ) {
          // if( validSession.minAlt > chk.minAlt  ) {
            // if( validSession.startTime > chk.startTime  ) {
              validSession = chkSession;
              console.log( 'New Candidate ' + validSession.targetFindName + ' - priority');
            // }
          // }
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
  console.log( target.targetFindName + ' ' + taken + '/' + planned );
  if( taken < planned ) {
    return false;
  }
  return true;
}
// *************************** ***********************************

function hasTargetStartTimePassed( target ) {
  console.log('************************');
  console.log(' *** canTargetStart: ' + target.targetFindName);
  var cur_dts = new Date();
  var cur_time = cur_dts.getHours()+(cur_dts.getMinutes()/60);
  console.log('Current time: ' + cur_time );

  // add 24 to the morning time so that
  ((cur_time < 8) ? cur_time=cur_time+24 : cur_time);

  var start_time = target.start_time;
  if( typeof start_time == 'undefined') {
    start_time = tsx_GetServerState('defaultStartTime').value;
  }
  console.log('Start time: ' + start_time );
  var hrs = start_time.split(':')[0].trim();
  console.log('Start hrs: ' + hrs );
  var min = start_time.split(':')[1].trim();
  console.log('Start min: ' + min );
  start_time = Number(hrs)+ 24 + Number(min/60);
  console.log(' *** is cur_time ' + cur_time + '>'+ ' start_time ' + start_time );
  var canStart = ((cur_time > start_time) ? false : true);
  if( canStart ){
    return true;
  }
  return false;

}

// *************************** ***********************************
// Check target... altitude ok, time okay,
export function canTargetSessionStart( target ) {
  console.log(' *** canTargetSessionStart: ' + target.targetFindName);

  var canStart = true;

  if(!target.enabledActive){
    return false; // the session is disabled
  }

  // check for target not ready
  if( isTargetComplete( target ) ) {
    console.log( target.targetFindName + ': is completed');
    return false;
  }

  // check start time pasted
  if( !hasTargetStartTimePassed( target ) ) {
    console.log( target.targetFindName + ': too early to start');
    return false;
  }

  // check if TSX says okay...
  var tsxSays = tsx_TryTarget( target.targetFindName, target.minAlt);
  var result = tsxSays.split('|')[0].trim();
  if( result != 'Success') {
    UpdateStatus( target.targetFindName + ' sunk below: ' + target.minAlt );
    console.log(target.targetFindName + ' sunk below: ' + target.minAlt);
    return false;
  }

  if( !tsx_isDarkEnough( target ) ) {
    // console.log(tsxSays);
    UpdateStatus( tsxSays.split('|')[1].trim() );
    console.log('Not dark enough');
    return false;
  }
  var currentTime = new Date();

  return canStart;
}
