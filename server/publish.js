import { TargetSessions } from '../imports/api/targetSessions.js';
import { TargetReports } from '../imports/api/targetReports.js';
import { TakeSeriesTemplates } from '../imports/api/takeSeriesTemplates.js';
import { Seriess } from '../imports/api/seriess.js';
import { Filters } from '../imports/api/filters.js';
import { TheSkyXInfos } from '../imports/api/theSkyXInfos.js';
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
} from './tsx_feeder.js'

import {
  tsx_has_error,
  tsx_cmd,
} from './run_imageSession.js'

function propValue( prop ) {
  let val = '';
  try {
    val = prop.value;
  }
  catch( e ) {
    val = ''
  }
  return val;
}

Meteor.publish("targetSessions", function pub_targetSessions() {
  return TargetSessions.find();
});

Meteor.publish("nightPlan", function pub_nightPlan() {
});

export function TargetPlan() {
  let STARTTIME = tsx_GetServerStateValue('defaultStartTime');
  if( STARTTIME == '' || typeof STARTTIME == 'undefined') {
    STARTTIME = '18:00'; // Nautical Twilight
  }
  let ENDTIME = tsx_GetServerStateValue('defaultStopTime');
  if( ENDTIME == '' || typeof ENDTIME == 'undefined') {
    ENDTIME = '6:00'; // Nautical Twilight
  }
  let SUNALT = tsx_GetServerStateValue('defaultMinSunAlt');

  if( SUNALT == '' || typeof SUNALT == 'undefined') {
    SUNALT = -12; // Nautical Twilight
  }

  // sun time:
  // tsx_method: object, altitude

  // get Nautical and user setting
  let targets = TargetSessions.find({ isCalibrationFrames: false, enabledActive: true }, { sort: { enabledActive: -1, targetFindName: 1 } }).fetch();
  let tsx_data = 'Sun|-12##Sun|'+SUNALT;
  // get all targets and their limiting altitudes
  for( let i=0; i<targets.length; i++ ) {
    let target = targets[i];
    if( tsx_data != '' ) {
      tsx_data += '##';
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

Meteor.methods({

  planData() {
    return TargetPlan();
  },

});

Meteor.publish("tsxIP", function pub_tsxIP() {
  return TheSkyXInfos.find({name: 'ip'});
});

Meteor.publish("scheduler_running", function pub_scheduler_running() {
  return TheSkyXInfos.find({name: 'scheduler_running'});
});

Meteor.publish("currentStage", function pub_currentStage() {
  return TheSkyXInfos.find({name: 'currentStage'});
});

Meteor.publish("tsxInfo", function pub_tsxInfo() {
  return TheSkyXInfos.find({});
});

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
        tsxLog( ' tsx_AltTimesForTargets: ' + tsx_return );
        /*
        tsx_AltTimesForTargets: Sun|-12|06:49|18:00##Sun|-11.5|06:52|17:57##M81|30|18:22|12:14|No error. Error = 0.
        */
        tsxLog( '1');
        let result = tsx_return.split('##');
        tsxLog( 'result: ' + result );
        /*
        result: Sun|-12|06:49|18:00##Sun|-11.5|06:52|17:57##M81|30|18:22|12:14
        */
        tsxLog( '2');
        for( let i=0; i<result.length; i++ ) {
          tsxLog( result);
          let rpt = result[i].trim();
          tsxLog( '4');
          let obj = rpt.split('|')[0].trim();
          tsxLog( '5');
          let alt = rpt.split('|')[1].trim();
          tsxLog( '7');
          let sTime = rpt.split('|')[2].trim();
          tsxLog( '8');
          let eTime = rpt.split('|')[3].trim();
          tsxLog( 'eTime: ' + eTime);
          if( obj != 'Sun') {
            let target = TargetSessions.findOne({ targetFindName: obj });
            if( typeof target == 'undefined' ) {
              tsxLog( ' cannot find: ' + obj);
              continue;
            }
            tsxLog( '6');
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
  tsx_SetServerState( 'NightPlan', Out );
  return Out;
}
