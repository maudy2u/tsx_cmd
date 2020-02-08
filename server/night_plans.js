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
  tsx_feeder,
  tsx_cmd,
  tsx_has_error,
} from './tsx_feeder.js'


export function TargetPlans() {
  // Get the users planned Sun Altitude limit times
  let DEFMINALT = tsx_GetServerStateValue('defaultMinAlt');
  if( DEFMINALT == '' || typeof DEFMINALT == 'undefined') {
    DEFMINALT = 45;
  }
  let SUNALT = tsx_GetServerStateValue('defaultMinSunAlt');
  if( SUNALT == '' || typeof SUNALT == 'undefined') {
    SUNALT = -12; // Use Nautical Twilight
  }

  let MOONRISE = 'Moon|0';
  let SUNRISE = 'Sun|'+SUNALT;
  // Object/Target times:
  // tsx_method: object, altitude

  // Get the targets to report
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
    tsx_data += target.targetFindName +'|'+ target.minAlt;
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
  // tsxDebug('************************');
  tsxInfo(' *** tsx_AltTimesForTargets: ' + targets.length );
  let Out = [];
  let tsx_is_waiting = true;

  let STARTTIME = tsx_GetServerStateValue('defaultStartTime');
  if( STARTTIME == '' || typeof STARTTIME == 'undefined') {
    STARTTIME = '18:00'; // Nautical Twilight
  }
  let ENDTIME = tsx_GetServerStateValue('defaultStopTime');
  if( ENDTIME == '' || typeof ENDTIME == 'undefined') {
    ENDTIME = '6:00'; // Nautical Twilight
  }
  let cmd = tsx_cmd('SkyX_JS_AltTimesTargetReports');
  cmd = cmd.replace("$000", targets );
  let tsx_err = false;
  tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
      try {
        tsx_err = tsx_has_error( tsx_return );
        tsxDebug( ' tsx_AltTimesForTargets: ' + tsx_return );
        /*
        tsx_AltTimesForTargets: Sun|-12|06:49|18:00##Sun|-11.5|06:52|17:57##M81|30|18:22|12:14|No error. Error = 0.
        */
        let result = tsx_return.split('##');
        tsxDebug( 'result: ' + result );
        /*
        result: Sun|-12|06:49|18:00##Sun|-11.5|06:52|17:57##M81|30|18:22|12:14
        */
        for( let i=0; i<result.length; i++ ) {
          let rpt = result[i].trim();
          let obj = rpt.split('|')[0].trim();
          let alt = rpt.split('|')[1].trim();
          let sTime = rpt.split('|')[2].trim();
          let eTime = rpt.split('|')[3].trim();
          if( obj != 'Sun' && obj != 'Moon') {
            let target = TargetSessions.findOne({ targetFindName: obj });
            if( typeof target == 'undefined' ) {
              tsxLog( ' cannot find: ' + obj);
              continue;
            }
            Out.push({
              target: obj,
              alt: alt,
              start: target.startTime,
              end: target.stopTime,
              alt_start: sTime,
              alt_end: eTime,
            });
          }
          else {
            Out.push({
              target: obj,
              alt: alt,
              start: STARTTIME,
              end: ENDTIME,
              alt_start: sTime,
              alt_end: eTime,
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
  tsx_SetServerState( 'night_plan', Out );
  return Out;
}

Meteor.methods({

  planData() {
    tsx_SetServerState( 'night_plan_report', true );
    tsxDebug( ' --- Night Plan: Computing');
    let plan = TargetPlans();
    tsx_SetServerState( 'night_plan_report', true );
    tsxDebug( ' --- Night Plan: Loaded');
    return plan;
  },

});
