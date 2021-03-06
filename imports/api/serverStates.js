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

import { TheSkyXInfos } from './theSkyXInfos.js';
// import { scheduler } from './theProcessors.js';

import {
  tsxInfo,
  tsxLog,
  tsxErr,
  tsxWarn,
  tsxDebug,
} from './theLoggers.js';

// SERVER STATE VARIABLE FOUND BY NAME
export const tsx_ServerStates = {
  tsx_version: 'tsx_version',
  tsx_date: 'tsx_date',
  tsx_build: 'tsx_build',
  tsx_ip: 'tsx_ip',
  tsx_port: 'tsx_port',

  ip: 'ip',
  port: 'port',
  activeMenu: 'Settings',
  currentStage: 'currentStage', // this is a status line update for the dashboard
  scheduler_running: 'scheduler_running',
//  SchedulerStatus: 'SchedulerStatus',
  scheduler_report: 'scheduler_report', // used by monitor to get target report
  currentJob: 'currentJob',
  tsx_progress: 'tsx_progress', // used for monitor progress minute increment
  tsx_total: 'tsx_total', // use for monitor progress total planned value
  tsx_message: 'tsx_message', // used for the monitor progress label
  runScheduler: 'runScheduler',

  initialFocusTemperature: 'initialFocusTemperature',
  defaultImageAutoSavePattern: 'defaultImageAutoSavePattern',
  mntRA: 'mntRA',
  mntDEC: 'mntDEC',
  mntMHS: 'mntMHS',
  mntMntDir: 'mntMntDir',
  mntMntAlt: 'mntMntAlt',
  mntMntAz: 'mntMntAz',
  mntMntPointing: 'mntMntPointing',

  targetName: 'targetName',
  targetRA: 'targetRA',
  targetDEC: 'targetDEC',
  targetALT: 'targetALT',
  targetAZ: 'targetAZ',
  targetHA: 'targetHA',
  targetTransit: 'targetTransit',
  targetDither: 'targetDither',
  curentTargetName: 'curentTargetName',
  currentImagingName: 'currentImagingName',
  currentSessionReport: 'currentSessionReport',

  isCurrentlyImaging: 'isCurrentlyImaging',
  imagingSessionId: 'imagingSessionId',
  imagingSession: 'imagingSession', // use to report current imaging targets
  imagingSessionDither: 'imagingSessionDither',
  imagingBinning: 'imagingBinning',
  defaultUseImagingCooler_enabled: 'defaultUseImagingCooler_enabled',
  defaultCoolTemp: 'defaultCoolTemp',
  defaultMinAltitude: 'defaultMinAltitude', // used for scheduling
  //defautMinAlt: 'defautMinAlt', deprecated
  defaultFocusTemp: 'defaultFocusTemp',

  // Dithering related states
  defaultDithering: 'defaultDithering',
  imagingPixelSize: 'imagingPixelSize',
  imagingPixelMaximum: 'imagingPixelMaximum',
  imagingFocalLength: 'imagingFocalLength',
  minDitherFactor: 'minDitherFactor',
  maxDitherFactor: 'maxDitherFactor',
  isDitheringEnabled: 'isDitheringEnabled',

  defaultFilter: 'defaultFilter',
  defaultMinAlt: 'defaultMinAlt',
  defaultFocusTempDiff: 'defaultFocusTempDiff',
  defaultFocusExposure: 'defaultFocusExposure',

  defaultCLSRetries: 'defaultCLSRetries',
  defaultCLSEnabled: 'defaultCLSEnabled',
  defaultMeridianFlip: 'defaultMeridianFlip',
  defaultStartTime: 'defaultStartTime',
  defaultStopTime: 'defaultStopTime',
  defaultPriority: 'defaultPriority',
  defaultSoftPark: 'defaultSoftPark',
  defaultSleepTime: 'defaultSleepTime',
  defaultGuideExposure: 'defaultGuideExposure',
  defaultFOVExposure: 'defaultFOVExposure',

  defaultMinSunAlt: 'defaultMinSunAlt',
  isTwilightEnabled: 'isTwilightEnabled',
  isFocus3Enabled: 'isFocus3Enabled',
  focus3Samples: 'focus3Samples',
  isFocus3Binned: 'isFocus3Binned',
  isAutoguidingEnabled: 'isAutoguidingEnabled',
  isGuideSettlingEnabled: 'isGuideSettlingEnabled',
  guidingPixelErrorTolerance: 'guidingPixelErrorTolerance',
  guiderPixelSize: 'guiderPixelSize',
  guider_camera_delay: 'guider_camera_delay',
  defaultGuiderBin: 'defaultGuiderBin',

  fovAngle: 'fovAngle',
  fovPositionAngleTolerance: 'fovPositionAngleTolerance',
  isFOVAngleEnabled: 'isFOVAngleEnabled',

  lastTargetDirection: 'lastTargetDirection',
  lastCheckSunAlt: 'lastCheckSunAlt',

  lastFocusPos: 'lastFocusPos',
  lastFocusTemp: 'lastFocusTemp',
  focusRequiresCLS: 'focusRequiresCLS',

  defaultCLSRepeat: 'defaultCLSRepeat',
  isCLSRepeatEnabled: 'isCLSRepeatEnabled',

  isCalibrationEnabled: 'isCalibrationEnabled',
  calibrationFrameSize: 'calibrationFrameSize',
  disconnectCameraWhenCalibrationIsDone: 'disconnectCameraWhenCalibrationIsDone',

  tool_calibrate_via: 'tool_calibrate_via',
  tool_calibrate_location: 'tool_calibrate_location',
  tool_calibrate_DecAlt: 'tool_calibrate_dec_az',

  tool_rotator_type: 'tool_rotator_type',
  tool_rotator_num: 'tool_rotator_num',
  tool_rotator_fov: 'tool_rotator_fov',

  tool_active: 'tool_active',

  flatSettings: 'flatSettings',
  flatPosition: 'flatPosition',

  tool_flats_via: 'tool_flats_via',
  tool_flats_location: 'tool_flats_location',
  tool_flats_dec_az: 'tool_flats_dec_az',

  night_plan: 'night_plan',
  night_plan_reset: 'night_plan_reset',

  flatbox_enabled: 'flatbox_enabled',
  flatbox_ip: 'flatbox_ip',
  flatbox_device: 'flatbox_device',
  flatbox_camera_delay: 'flatbox_camera_delay',
  flatbox_lamp_level: 'flatbox_lamp_level',
  flatbox_lamp_on: 'flatbox_lamp_on',
  flatbox_monitor_max_pixel: 'flatbox_monitor_max_pixel',
  flatbox_imagingPixelMaximumOccurance: 'flatbox_imagingPixelMaximumOccurance',

  session_report: 'session_report',

  metroBlueReportWidget: 'metroBlueReportWidget',
  clearSkyReportWidget: 'clearSkyReportWidget',

  isNoVNCEnabled: 'isNoVNCEnabled',
  noVNCPWD: 'noVNCPWD',
  noVNCPort: 'noVNCPort',

  indigo_web_panel: 'indigo_web_panel',
  isTargetConditionInValidExpired: 'isTargetConditionInValidExpired',

  last_PA: 'last_PA',

};

export function getDefaultStateValue( param ) {
  var val = TheSkyXInfos.find(function(element) {
    return element.name === param;
  }).value;
  if( typeof val !== 'undefined' ) {
    return val;
  }
  return '';
}

// Should be using this version for all and not within the API
export function saveDefaultStateValue( param, val ) {

  Meteor.call( 'updateServerState', param, val , function(error, result) {

      if (error && error.error === "logged-out") {
        // show a nice error message
        Session.set("errorMessage", "Please fix.");
      }
  });//.bind(this));
}

// Should be using this version for all and not within the API
export function updateTargetStateValue( id, param, val ) {

  Meteor.call( 'updateTargetState', id, param, val , function(error, result) {

      if (error && error.error === "logged-out") {
        // show a nice error message
        Session.set("errorMessage", "Please fix.");
      }
  });//.bind(this));
}

export function updateTakeSeriesStateValue( id, param, val ) {

  Meteor.call( 'updateTakeSeriesState', id, param, val , function(error, result) {

      if (error && error.error === "logged-out") {
        // show a nice error message
        Session.set("errorMessage", "Please fix.");
      }
  });//.bind(this));
}

export function updateTargetSeriesStateValue( id, sid ) {

  Meteor.call( 'updateTargetSeriesState', id, sid, function(error, result) {

      if (error && error.error === "logged-out") {
        // show a nice error message
        Session.set("errorMessage", "Please fix.");
      }
  });//.bind(this));
}


export function postStatus( info ) {
  tsx_SetServerState('updateClientData', info );
};

export function postProgressTotal( info ) {
   // Create a job:
   tsx_SetServerState('tsx_total', info );
};

export function postProgressIncrement( info ) {
  // Create a job:
  tsx_SetServerState('tsx_progress', info );
};

export function postProgressMessage( info ) {
  // Create a job:
  tsx_SetServerState('tsx_message', info );
};

export function updateServerState( name, value) {
  var dts = new Date();
  TheSkyXInfos.update( {name: name }, {
    $set: {
      value: value,
      timestamp: dts,
     }
  })
};

export function updateServerStatus(value) {
  var dts = new Date();
  TheSkyXInfos.update( {name: 'currentStage' }, {
    $set: {
      value: value,
      timestamp: dts,
     }
  })
};

export function tsx_SetServerState( name, value) {
  var dts = new Date();
  TheSkyXInfos.upsert( {name: name }, {
    $set: {
      value: value,
      timestamp: dts,
     }
  })
};

export function tsx_UpdateDevice( name, man, mod) {
  TheSkyXInfos.upsert( {name: name }, {
    $set: {
      model: mod,
      manufacturer: man,
      timestamp: new Date(),
     }
  })
};

export function tsx_UpdateDeviceManufacturer( name, man) {
  TheSkyXInfos.upsert( {name: name }, {
    $set: {
      manufacturer: man,
      timestamp: new Date(),
     }
  })
};

export function tsx_UpdateDeviceModel( name, mod) {
  TheSkyXInfos.upsert( {name: name }, {
    $set: {
      model: mod,
      timestamp: new Date(),
     }
  })
};

export function tsx_UpdateServerState( name, value) {
  var tsx = tsx_GetServerState( name );
  if( typeof tsx === 'undefined' ) {
    // state not found so create...
    TheSkyXInfos.insert( {name: name }, {
      $set: {
        value: value,
        timestamp: new Date(),
       }
    })
  }
  else {
    var id = TheSkyXInfos.update( {_id: tsx._id }, {
      $set: {
        value: value,
        timestamp: new Date(),
       }
    })
  }
};

export function tsx_GetServerState( name ) {
  var val = TheSkyXInfos.findOne( {name: name });
  return val;
};

export function tsx_GetServerStateValue( name ) {
  var val = TheSkyXInfos.findOne( {name: name });
  if( typeof val !== 'undefined' ) {
    if( typeof val.value !== 'undefined' ) {
      return val.value;
    }
  }
  return '';
};

// **************************************************************
export function LogToReport( status ) {
  tsx_SetServerState( 'currentStage', status );
  tsxReport( status );
};

// **************************************************************
export function UpdateStatus( status ) {
  tsx_SetServerState( 'currentStage', status );
  tsxLog( status );
};

// **************************************************************
export function UpdateStatusErr( status ) {
  tsx_SetServerState( 'currentStage', status );
  tsxErr( status );
};

// **************************************************************
export function UpdateStatusWarn( status ) {
  tsx_SetServerState( 'currentStage', status );
  tsxWarn( status );
};

export function UpdateImagingSesionID( t_id ) {
  tsx_SetServerState( 'imagingSessionId', t_id );
};
