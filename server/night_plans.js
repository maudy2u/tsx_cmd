import { Meteor } from 'meteor/meteor';
import { TargetSessions } from '../imports/api/targetSessions.js';
import { TargetReports } from '../imports/api/targetReports.js';
//import { TakeSeriesTemplates } from '../imports/api/takeSeriesTemplates.js';
//import { Seriess } from '../imports/api/seriess.js';
//import { Filters } from '../imports/api/filters.js';
//import { TheSkyXInfos } from '../imports/api/theSkyXInfos.js';
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
  updateTargetReport,
} from '../imports/api/targetReports.js';

import {
  tsx_feeder,
  tsx_cmd,
  tsx_has_error,
} from './tsx_feeder.js'


export function TargetPlans() {
  // Get the users planned Sun Altitude limit times
  let DEFMINALT = tsx_GetServerStateValue( tsx_ServerStates.defaultMinAlt );
  if( DEFMINALT == '' || typeof DEFMINALT == 'undefined') {
    DEFMINALT = 45;
  }
  let SUNALT = tsx_GetServerStateValue( tsx_ServerStates.defaultMinSunAlt );
  if( SUNALT == '' || typeof SUNALT == 'undefined') {
    SUNALT = -12; // Use Nautical Twilight
  }

  //let MOONRISE = 'Moon|0';
  let MOONRISE = 'Moon|0|Moon';
  //let SUNRISE = 'Sun|'+SUNALT;
  let SUNRISE = 'Sun|' + SUNALT + '|Sun';
  // Object/Target times:
  // tsx_method: object, altitude

  // Get the targets to report
  // All add dirty flag for checking times...
  //    start/end - is a date timeout
  //    Alt is a change...
  // so need the time target last checked

  let targets = TargetSessions.find({ isCalibrationFrames: false, enabledActive: true }, { sort: { enabledActive: -1, targetFindName: 1 } }).fetch();
  let tsx_data = MOONRISE + '##' + SUNRISE;
  // get all targets and their limiting altitudes
  for( let i=0; i<targets.length; i++ ) {
    let target = targets[i];
    if( tsx_data != '' ) {
      tsx_data += '##';
    }
    if( target.minAlt == '' || typeof target.minAlt == 'undefined') {
      target.minAlt = DEFMINALT;
    }
    // CAN NEED TO ADD THE _ID HERE, e.g.
    tsx_data += target.targetFindName +'|'+ target.minAlt+'|'+ target._id;
    // THis will allow finding the right target upon returning
    // tsx_data += target.targetFindName +'|'+ target.minAlt;
  }

  /*
    night plan : [
      {
        object name: '',
        alt_start: '',
        alt_end: '',
        start_time: '',
        end_time: '',
      }
    ]
  */
  let plan = tsx_AltTimesForTargets( tsx_data );
  // plan = target.targetFindName +'|'+ target.minAlt +'|'+ target.startTime +'|'+target.stopTime +'##';

  return plan;
}


export function tsx_AltTimesForTargets( targets ) {
  // tsxInfo('************************');
  tsxInfo(' *** tsx_AltTimesForTargets: ' + targets.length );
  let Out = [];
  let tsx_is_waiting = true;

  let STARTTIME = tsx_GetServerStateValue( tsx_ServerStates.defaultStartTime );
  if( STARTTIME == '' || typeof STARTTIME == 'undefined') {
    STARTTIME = '18:00'; // Nautical Twilight
  }
  let ENDTIME = tsx_GetServerStateValue( tsx_ServerStates.defaultStopTime );
  if( ENDTIME == '' || typeof ENDTIME == 'undefined') {
    ENDTIME = '6:00'; // Nautical Twilight
  }
  let cmd = tsx_cmd('SkyX_JS_AltTimesTargetReports');
  cmd = cmd.replace("$000", targets );
  let tsx_err = false;
  tsxDebug( '[SkyX_JS_AltTimesTargetReports] send: '+targets );
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
      try {
        tsx_err = tsx_has_error( tsx_return );
        tsxInfo( ' tsx_AltTimesForTargets: ' + tsx_return );
        /*
        tsx_AltTimesForTargets: Sun|-12|06:49|18:00##Sun|-11.5|06:52|17:57##M81|30|18:22|12:14|No error. Error = 0.
        */
        let result = tsx_return.split('##');
        tsxDebug( '[SkyX_JS_AltTimesTargetReports] recv: '+tsx_return );
        /*
        result: Sun|-12|06:49|18:00##Sun|-11.5|06:52|17:57##M81|30|18:22|12:14
        */
        for( let i=0; i<result.length; i++ ) {
          let rpt = result[i].trim();
          let obj = rpt.split('|')[0].trim();
          let alt = rpt.split('|')[1].trim();
          let sTime = rpt.split('|')[2].trim();
          let eTime = rpt.split('|')[3].trim();
          let ref_id = rpt.split('|')[4].trim(); // passthru id
          let maxAlt = rpt.split('|')[5].trim(); // passthru id


          // THIS IS THE PROBLEM IF THE FINDNAME IS USED MORE THAN ONCE
          // THIS CAN MEAN THE NEED FOR A REFERENCE ID, SUCH AS THE TARGET._id
          if( obj != 'Sun' && obj != 'Moon') {
            let target = TargetSessions.findOne({ _id: ref_id });
            if( typeof target == 'undefined' ) {
              tsxErr( ' cannot find: ' + obj);
              continue;
            }
            Out.push({
              target: obj,
              alt: alt,
              start: target.startTime,
              end: target.stopTime,
              alt_start: sTime,
              alt_end: eTime,
              passthru:ref_id,
              maxAlt: maxAlt,
            });

            // set target not dirty...
            updateTargetReport( target._id, 'dirty', false );
            updateTargetReport( target._id, 'maxAlt', maxAlt );

          }
          else {
            Out.push({
              target: obj,
              alt: alt,
              start: STARTTIME,
              end: ENDTIME,
              alt_start: sTime,
              alt_end: eTime,
              passthru:ref_id,
              maxAlt: maxAlt,
            });
          }
        }
      }
      catch ( e ) {
        // This is need in case the trim function fails
        UpdateStatus( ' !!! Check if TheSkyX is running: - ' + e );
      }
      finally {
        tsx_is_waiting = false;
      }
    }
  ));

  while( tsx_is_waiting ) {
   Meteor.sleep( 1000 );
  }
  if( tsx_err != false ) {
    throw( 'TSX_ERROR|Is Tsx Running?');
  }
  tsx_SetServerState( tsx_ServerStates.night_plan, Out );
  return Out;
}

// if report is dirty then it needs updating
function isReportDirty() {

// 1. were the default times changed
// 2. is it a new imaging night... (check scheduler to determine imaging date)

// ANY OF THE ABOVE WILL STATE DIRTY

}

// if a target is dirty then it needs updating
function isTargetDirty() {

// 3. was a target added, no update needed if removed
// 4. was a target's minAlt changed.

// ANY OF THE ABOVE WILL STATE DIRTY

}

Meteor.methods({

  planData() {

    tsx_SetServerState( tsx_ServerStates.night_plan_report, true );
    UpdateStatus( ' [PLANNER] Computing...');
    let plan = TargetPlans();
    tsx_SetServerState( tsx_ServerStates.night_plan_report, true );
    UpdateStatus( ' [PLANNER] Done');
    return plan;
  },

});
