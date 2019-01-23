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

export function TargetPlans() {

  // Get teh users planned start and stop hours
  let STARTTIME = tsx_GetServerStateValue('defaultStartTime');
  if( STARTTIME == '' || typeof STARTTIME == 'undefined') {
    STARTTIME = '18:00'; // guess
  }
  let ENDTIME = tsx_GetServerStateValue('defaultStopTime');
  if( ENDTIME == '' || typeof ENDTIME == 'undefined') {
    ENDTIME = '6:00'; // guess
  }

  // Get the users planned Sun Altitude limit times
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
    return TargetPlans();
  },

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

Meteor.publish("targetSessions", function pub_targetSessions() {
  return TargetSessions.find();
});

Meteor.publish("tsxIP", function pub_tsxIP() {
  return TheSkyXInfos.find({name: 'ip'});
});

Meteor.publish("scheduler_running", function pub_scheduler_running() {
  return TheSkyXInfos.find({name: 'scheduler_running'});
});

Meteor.publish("tsxInfo", function pub_tsxInfo() {
  return TheSkyXInfos.find({});
});


/*
Meteor.publish('tool_calibrate_via', function pubThis() {
  return TheSkyXInfos.find({name: 'tool_calibrate_via'});
});
Meteor.publish('tool_calibrate_location', function pubThis() {
  return TheSkyXInfos.find({name: 'tool_calibrate_location'});
});
Meteor.publish('tool_rotator_num', function pubThis() {
  return TheSkyXInfos.find({name: 'tool_rotator_num'});
});
Meteor.publish('tool_rotator_type', function pubThis() {
  return TheSkyXInfos.find({name: 'tool_rotator_type'});
});
Meteor.publish('tool_active', function pubThis() {
  return TheSkyXInfos.find({name: 'tool_active'});
});
Meteor.publish('tool_flats_dec_az', function pubThis() {
  return TheSkyXInfos.find({name: 'tool_flats_dec_az'});
});
Meteor.publish('tool_flats_location', function pubThis() {
  return TheSkyXInfos.find({name: 'tool_flats_location'});
});
Meteor.publish('tool_flats_via', function pubThis() {
  return TheSkyXInfos.find({name: 'tool_flats_via'});
});

// SESSION Controls
Meteor.publish('defaultMeridianFlip', function pubThis() {
  return TheSkyXInfos.find({name: 'defaultMeridianFlip'});
});
Meteor.publish('defaultCLSEnabled', function pubThis() {
  return TheSkyXInfos.find({name: 'defaultCLSEnabled'});
});
Meteor.publish('defaultSoftPark', function pubThis() {
  return TheSkyXInfos.find({name: 'defaultSoftPark'});
});

Meteor.publish('isFOVAngleEnabled', function pubThis() {
  return TheSkyXInfos.find({name: 'isFOVAngleEnabled'});
});
Meteor.publish('isFocus3Enabled', function pubThis() {
  return TheSkyXInfos.find({name: 'isFocus3Enabled'});
});
Meteor.publish('isFocus3Binned', function pubThis() {
  return TheSkyXInfos.find({name: 'isFocus3Binned'});
});

Meteor.publish('isAutoguidingEnabled', function pubThis() {
  return TheSkyXInfos.find({name: 'isAutoguidingEnabled'});
});
Meteor.publish('isCalibrationEnabled', function pubThis() {
  return TheSkyXInfos.find({name: 'isCalibrationEnabled'});
});
Meteor.publish('isGuideSettlingEnabled', function pubThis() {
  return TheSkyXInfos.find({name: 'isGuideSettlingEnabled'});
});

Meteor.publish('isCLSRepeatEnabled', function pubThis() {
  return TheSkyXInfos.find({name: 'isCLSRepeatEnabled'});
});
Meteor.publish('isTwilightEnabled', function pubThis() {
  return TheSkyXInfos.find({name: 'isTwilightEnabled'});
});

// App stuf
Meteor.publish('currentStage', function pubThis() {
  return TheSkyXInfos.find({name: 'currentStage'});
});
Meteor.publish('tsxInfo', function pubThis() {
  return TheSkyXInfos.find({});
});
Meteor.publish('tsx_version', function pubThis() {
  return TheSkyXInfos.find({name: 'tsx_version'});
});
Meteor.publish('tsx_date', function pubThis() {
  return TheSkyXInfos.find({name: 'tsx_date'});
});
Meteor.publish('tsxIP', function pubThis() {
  return TheSkyXInfos.find({name: 'ip'});
});
Meteor.publish('tsxPort', function pubThis() {
  return TheSkyXInfos.find({name: 'port'});
});
Meteor.publish('srvLog', function pubThis() {
  return AppLogsDB.find({}, {sort:{time:-1}});
});
Meteor.publish('activeMenu', function pubThis() {
  return TheSkyXInfos.find({name: 'activeMenu'});
});

Meteor.publish('flatSettings', function pubThis() {
  return TheSkyXInfos.find({name: 'flatSettings'});
});
Meteor.publish('targetName', function pubThis() {
  return TheSkyXInfos.find({name: 'targetName'});
});
Meteor.publish('tsx_total', function pubThis() {
  return  TheSkyXInfos.find({name: 'tsx_total'});
});
Meteor.publish('tsx_message', function pubThis() {
  return TheSkyXInfos.find({name: 'tsx_message'});
});
Meteor.publish('scheduler_running', function pubThis() {
  return TheSkyXInfos.find({name: 'scheduler_running'});
});
Meteor.publish('scheduler_report', function pubThis() {
  return TheSkyXInfos.find({name: 'scheduler_report'});
});
Meteor.publish('filters', function pubThis() {
  return Filters.find({}, { sort: { slot: 1 } });
});
Meteor.publish('flatSeries', function pubThis() {
  return FlatSeries.find({});
});
Meteor.publish('takeSeriesTemplates', function pubThis() {
  return TakeSeriesTemplates.find({ isCalibrationFrames: false }, { sort: { name: 1 } });
});
Meteor.publish('targetSessions', function pubThis() {
  return TargetSessions.find({ isCalibrationFrames: false }, { sort: { enabledActive: -1, targetFindName: 1 } });
});
// targetSessions: TargetSessions.find({ }, { sort: { enabledActive: -1, targetFindName: 1 } }),
Meteor.publish('target_reports', function pubThis() {
  return TargetReports.find({});
});

Meteor.publish('night_plan', function pubThis() {
  return TheSkyXInfos.find({name: 'NightPlan'});
});
Meteor.publish('night_plan_updating', function pubThis() {
  return TheSkyXInfos.find({name: 'night_plan_updating'});
});

Meteor.publish("currentStage", function pub_currentStage() {
  return TheSkyXInfos.find({name: 'currentStage'});
});

Meteor.publish('files.skySafari.all', () => {
  return SkySafariFiles.collection.find({});
});

Meteor.publish('tsx_progress', function tsxPortPublication() {
  var param = TheSkyXInfos.findOne({name: 'tsx_progress'});
  if( typeof param == 'undefined') {
    var did = TheSkyXInfos.upsert({name: 'tsx_progress'}, {
      $set: {
        value: '',
      }
    });
    param = TheSkyXInfos.findOne({_id: did});
  }
  return param.value;
});

*/

/*

if (Meteor.isClient) {
  Meteor.subscribe('files.skySafari.all');
}


Meteor.publish('tsx_progress', function pubThis() {
  return TheSkyXInfos.find({name: 'tsx_progress'});
});

*/
