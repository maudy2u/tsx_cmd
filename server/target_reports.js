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

import {
  SkySafariFiles,
  skySafariFilesFolder,
  skysafariFraming,
  convertLon2RA,
  convertLat2Dec,
  convertORIENT2PA,
} from '../imports/api/skySafariFiles.js';

import {
  TargetSessions,
} from '../imports/api/targetSessions.js';

import {
  TargetReports,
  updateTargetReport,
} from '../imports/api/targetReports.js';

import {
  tsxInfo,
  tsxLog,
  tsxErr,
  tsxWarn,
  tsxDebug,
} from '../imports/api/theLoggers.js';

import {
  tsx_UpdateDevice,
  tsx_ServerStates,
  tsx_SetServerState,
  tsx_GetServerState,
  tsx_GetServerStateValue,
  UpdateStatus,
  UpdateStatusWarn,
  UpdateStatusErr,
} from '../imports/api/serverStates.js'

import {
  hasTimePassed,
  howMuchTimeHasPassed,
  hasStartTimePassed,
  isDateBeforeCurrentDate,
  isTimeBeforeCurrentTime,
} from './run_schedule_process.js';

import {
  tsx_feeder,
  tsx_cmd,
  tsx_has_error,
} from './tsx_feeder.js'

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
  // tsxInfo('************************');
  tsxInfo(' *** UpdateImagingTargetReport: ' + target.getFriendlyName() );

  // how old is report... if less than 1 minute get report
  var tRprt = TargetReports.findOne({target_id: target._id });

  // // no report so get one...
  // if( typeof tRprt === 'undefined' ) {
  //   tsxDebug(' Ran TargetReport for new report: ' + target.getFriendlyName());
  //   tRprt = tsx_TargetReport( target );
  // }

  // var msecDiff = cTime - tRprt.updatedAt;
  // tsxInfo('Report time diff: ' + msecDiff);
  // var mm = Math.floor(msecDiff / 1000 / 60);
  if( typeof tRprt === 'undefined' || typeof tRprt.updatedAt === 'undefined' || hasTimePassed( 60, tRprt.updatedAt ) ) { // one minte passed so update report.
    tsxDebug(' Ran TargetReport for new report: ' + target.getFriendlyName());
    tRprt = tsx_TargetReport( target );
  }
  else {
    tsxDebug(' Reuse TargetReport: ' + target.getFriendlyName());
    tRprt = target.report;
  }

  // Now have reprt and need to set the variables
  // the other checks use
  if( typeof tRprt != 'undefined' && tRprt.ready != false &&  tRprt != '') {
    TargetSessions.upsert({_id: target._id}, {
      $set:{
        report: tRprt,
      }
    });
  }

  return tRprt;
}

// **************************************************************
function update_monitor_coordinates( rpt, targetFindName ) {
  tsx_SetServerState( tsx_ServerStates.targetRA, rpt.RA );
  tsx_SetServerState( tsx_ServerStates.targetDEC, rpt.DEC );
  tsx_SetServerState( tsx_ServerStates.targetALT, rpt.ALT );
  tsx_SetServerState(tsx_ServerStates.targetAZ, rpt.AZ );
  tsx_SetServerState( tsx_ServerStates.targetHA, rpt.HA );
  tsx_SetServerState( tsx_ServerStates.targetTransit, rpt.TRANSIT );
  tsx_SetServerState( 'mntMntPointing', rpt.pointing );
  tsxInfo( targetFindName + ' ' + rpt.ALT);
}

// **************************************************************
export function tsx_TargetReport( target ) {
  // tsxInfo('************************');
  tsxInfo(' *** tsx_TargetReport: ' + target.getFriendlyName());

  // only get the new data if dirty or not existant
  // var org_rpt = TargetReports.findOne({target_id: target._id });
  // var dirty = true;
  updateTargetReport( target._id, 'dirty', true );

  // var cmd = tsxCmdMatchAngle(targetSession.angle,targetSession.scale, target.expos);
  var cmd = tsx_cmd('SkyX_JS_TargetReport');
  cmd = cmd.replace('$000', target.targetFindName );

  var sunAlt = tsx_GetServerStateValue( tsx_ServerStates.defaultMinSunAlt );
  if( typeof sunAlt === 'undefined'  || sunAlt == '') {
    // hard coded to ~ nautical twilight
    // #TODO put the sun altitude into Settings
    sunAlt = -15;
  }

  cmd = cmd.replace('$001', sunAlt);
  cmd = cmd.replace('$002', target.minAlt);
  tsxInfo(' TargetReport.target:', target.getFriendlyName());
  tsxInfo(' TargetReport.sunAlt:', sunAlt);
  tsxInfo(' TargetReport.minAlt:', target.minAlt);
  var Out = {
    ready: false,
  };
  var tsx_is_waiting = true;
  tsxDebug( '[SkyX_JS_TargetReport] sent: '+target.targetFindName+', '+sunAlt+', '+target.minAlt );

  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
    if( tsx_has_error(tsx_return) == false ) {
      // e.g.
      // false|6.812618943699146|
      // true|West|42.2|5.593339690591149|22.023446766485247|3.4187695344846833|16.2723491463255240.0|0|
      // No error. Error = 0.
      tsxDebug( '[SkyX_JS_TargetReport] recv: '+tsx_return );
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

              case 'LAT':
                updateTargetReport( target._id, 'LAT', param[1] );
                break;
              case 'LON':
                updateTargetReport( target._id, 'LON', param[1] );
                break;
              case 'focusPosition':
                updateTargetReport( target._id, 'focusPosition', param[1] );
                break;
              case 'maxAlt':
                updateTargetReport( target._id, 'maxAlt', param[1] );
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
                UpdateStatusErr('!!! TargetReport failed. Not found ('+target.getFriendlyName()+'): ' + param[1]);
                break;
              case 'pointing':
                updateTargetReport( target._id, 'pointing', param[1] );
                break;
              default:

            }
          }
        }
        updateTargetReport( target._id, 'dirty', false );
        var rpt = TargetReports.findOne({target_id: target._id });
        update_monitor_coordinates( rpt, target.targetFindName );
// *******************************
// THIS LINE IS OF UPTMOST IMPORTANCE... IT IS A REFERENCE AND UPDATES
// THE REPORT ON THE TARGET FOR ADDITIONALLY SUPPORT.
// *******************************
        target.report = rpt; // set the current target's report... it passes back
// *******************************
// *******************************
        Out=rpt;
        tsxInfo( ' --- Refreshed ' + target.getFriendlyName()  );
      }
    }
    tsx_is_waiting = false;
  }));
  while( tsx_is_waiting ) {
    Meteor.sleep( 1000 );
  }
  return Out;
}


Meteor.methods({

  getUpdateTargetReport(tid) {
    tsx_SetServerState( tsx_ServerStates.tool_active, true );
    var rpt = '';
    try {

      var target = TargetSessions.findOne({_id: tid});

      try {
        tsxLog( ' [TARGETREPORT] ' + target.getFriendlyName() );
        rpt = tsx_TargetReport( target )
      }
      catch( e ) {
        if( e == 'TsxError' ) {
          UpdateStatus('!!! TheSkyX connection is no longer there!');
        }
        rpt = {
          ready: false,
        }
      }
    }
    catch( e ) {
      if( e == 'tsxErr' ) {
        UpdateStatus(' [TARGETREPORT]!!! TheSkyX connection is no longer there!');
      }
    }
    finally {
      UpdateStatus(' [TARGETREPORT] Target updated');
      tsx_SetServerState( tsx_ServerStates.tool_active, false );
    }

    return rpt;
  },

  refreshEnabledTargetReports() {
    tsx_SetServerState( tsx_ServerStates.tool_active, true );
    UpdateStatus( ' [TARGETREPORT] Refreshing targets' );
    try {
      let targets = TargetSessions.find({ isCalibrationFrames: false, enabledActive: true }).fetch();

      for (let i = 0; i < targets.length; i++) {
        let target = TargetSessions.findOne({_id: targets[i]._id });
        if( typeof target != 'undefined') {
          UpdateStatus( ' [TARGETREPORT] Retrieving: ' + target.getFriendlyName() );
          let rpt = tsx_TargetReport( target );
          UpdateStatus( ' [TARGETREPORT] Completed: ' + target.getFriendlyName() );
        }
      }
      UpdateStatus( ' [TARGETREPORT] Refresh complete' );
    }
    catch( e )  {
      if( e == 'TsxError' ) {
        UpdateStatus(' [TARGETREPORT]!!! TheSkyX connection is no longer there!');
      }
    }
    finally {
      tsx_SetServerState( tsx_ServerStates.tool_active, false );
    }
  },


  getTargetReport( tid ) {
    tsx_SetServerState( tsx_ServerStates.tool_active, true );

    try {
      var target = TargetSessions.findOne({_id: tid});
      UpdateStatus( ' [TARGETREPORT] Retrieving: ' + target.getFriendlyName() );
      var result = tsx_TargetReport( target );
      UpdateStatus( ' [TARGETREPORT] Completed: ' + target.getFriendlyName() );
    }
    catch( e )  {
      if( e == 'TsxError' ) {
        UpdateStatus(' [TARGETREPORT]!!! TheSkyX connection is no longer there!');
      }
    }
    finally {
      tsx_SetServerState( tsx_ServerStates.tool_active, false );
    }
    return;
  },

  getTargetReports( targetArray ) {
    tsx_SetServerState( tsx_ServerStates.tool_active, true );
    try {
      for (let i = 0; i < targetArray.length; i++) {
        let target = TargetSessions.findOne({_id: targetArray[i]._id });
        UpdateStatus( ' [TARGETREPORT] Retrieving: ' + target.getFriendlyName() );
        let result = tsx_TargetReport( target );
        UpdateStatus( ' [TARGETREPORT] Completed: ' + target.getFriendlyName() );
      }
      UpdateStatus( ' [TARGETREPORT] All updated' );
    }
    catch( e )  {
      if( e == 'TsxError' ) {
        UpdateStatus(' [TARGETREPORT]!!! TheSkyX connection is no longer there!');
      }
    }
    finally {
      tsx_SetServerState( tsx_ServerStates.tool_active, false );
    }
    return;
  },

});
