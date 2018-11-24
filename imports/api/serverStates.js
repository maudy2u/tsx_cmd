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

export const tsx_ServerStates = {
  tsx_version: 'tsx_version',
  tsx_date: 'tsx_date',
  ip: 'ip',
  port: 'port',
  activeMenu: 'Settings',
  currentStage: 'currentStage', // this is a status line update for the dashboard
  scheduler_running: 'scheduler_running',
  SchedulerStatus: 'SchedulerStatus',
  scheduler_report: 'scheduler_report', // used by monitor to get target report
  currentJob: 'currentJob',
  tsx_progress: 'tsx_progress', // used for monitor progress minute increment
  tsx_total: 'tsx_total', // use for monitor progress total planned value
  tsx_message: 'tsx_message', // used for the monitor progress label

  initialFocusTemperature: 'initialFocusTemperature',
  mntRA: 'mntRA',
  mntDEC: 'mntDEC',
  mntMHS: 'mntMHS',
  mntMntDir: 'mntMntDir',
  mntMntAlt: 'mntMntAlt',
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

  isCurrentlyImaging: 'isCurrentlyImaging',
  imagingSessionId: 'imagingSessionId',
  imagingSession: 'imagingSession', // use to report current imaging targets
  imagingSessionDither: 'imagingSessionDither',

  // Dithering related states
  defaultDithering: 'defaultDithering',
  imagingPixelSize: 'imagingPixelSize',
  imagingFocalLength: 'imagingFocalLength',
  minDitherFactor: 'minDitherFactor',
  maxDitherFactor: 'maxDitherFactor',

  defaultFilter: 'defaultFilter',
  defaultMinAlt: 'defaultMinAlt',
  defaultCoolTemp: 'defaultCoolTemp',
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
  isFocus3Binned: 'isFocus3Binned',
  isGuideSettlingEnabled: 'isGuideSettlingEnabled',
  guidingPixelErrorTolerance: 'guidingPixelErrorTolerance',
  guiderPixelSize: 'guiderPixelSize',

  fovAngle: 'fovAngle',
  fovPositionAngleTolerance: 'fovPositionAngleTolerance',
  isFOVAngleEnabled: 'isFOVAngleEnabled',

  lastTargetDirection: 'lastTargetDirection',
  lastCheckMinSunAlt: 'lastCheckMinSunAlt',
  lastFocusPos: 'lastFocusPos',
  lastFocusTemp: 'lastFocusTemp',

  defaultCLSRepeat: 'defaultCLSRepeat',
  isCLSRepeatEnabled: 'isCLSRepeatEnabled',

  isCalibrationEnabled: 'isCalibrationEnabled',
  calibrationFrameSize: 'calibrationFrameSize',

  tool_calibrate_via: 'tool_calibrate_via',
  tool_calibrate_ra: 'tool_calibrate_ra',
  tool_calibrate_dec: 'tool_calibrate_dec',

  tool_rotator_type: 'tool_rotator_type',
  tool_rotator_num: 'tool_rotator_num',

  flatSettings: 'flatSettings',
  flatPosition: 'flatPosition',
};

export function postStatus( info ) {
  tsx_SetServerState('updateClientData', info );
 //  // Create a job:
 //  var job = new Job(scheduler, 'updateClientData', // type of job
 // // Job data that you define, including anything the job
 // // needs to complete. May contain links to files, etc...
 //   {
 //     status: info,
 //     reportedAt: new Date(),
 //     timestamp: new Date(),
 //   }
 // );
 //
 // // Set some properties of the job and then submit it
 // // the same submit the start time to the scheduler...
 // // at this time could add a tweet :)
 // job.priority('normal');
 //   // .retry({ retries: 5,
 //   //   wait: 5*60*1000 }) //15*60*1000 })  // 15 minutes between attempts
 //   // .delay(0);// 60*60*1000)     // Wait an hour before first try
 // var jid = job.save();               // Commit it to the server
};

export function postProgressTotal( info ) {
   // Create a job:
   tsx_SetServerState('tsx_total', info );

  //  var job = new Job(scheduler, 'updateProgressTotal', // type of job
  // // Job data that you define, including anything the job
  // // needs to complete. May contain links to files, etc...
  //   {
  //     total: info,
  //     reportedAt: new Date(),
  //     timestamp: new Date(),
  //   }
  // );
  //
  // // Set some properties of the job and then submit it
  // // the same submit the start time to the scheduler...
  // // at this time could add a tweet :)
  // job.priority('normal');
  //   // .retry({ retries: 5,
  //   //   wait: 5*60*1000 }) //15*60*1000 })  // 15 minutes between attempts
  //   // .delay(0);// 60*60*1000)     // Wait an hour before first try
  // var jid = job.save();               // Commit it to the server
};

export function postProgressIncrement( info ) {
  // Create a job:
  tsx_SetServerState('tsx_progress', info );

  // var job = new Job(scheduler, 'updateProgressIncrement', // type of job
  // // Job data that you define, including anything the job
  // // needs to complete. May contain links to files, etc...
  // {
  //   progress: info,
  //   reportedAt: new Date(),
  //   timestamp: new Date(),
  //
  // });
  //
  // // Set some properties of the job and then submit it
  // // the same submit the start time to the scheduler...
  // // at this time could add a tweet :)
  // job.priority('normal');
  // // .retry({ retries: 5,
  // //   wait: 5*60*1000 }) //15*60*1000 })  // 15 minutes between attempts
  // // .delay(0);// 60*60*1000)     // Wait an hour before first try
  // var jid = job.save();               // Commit it to the server
};

export function postProgressMessage( info ) {
  // Create a job:
  tsx_SetServerState('tsx_message', info );

  // var job = new Job(scheduler, 'updateProgressMessage', // type of job
  // // Job data that you define, including anything the job
  // // needs to complete. May contain links to files, etc...
  // {
  //   message: info,
  //   reportedAt: new Date(),
  //   timestamp: new Date(),
  // });
  //
  // // Set some properties of the job and then submit it
  // // the same submit the start time to the scheduler...
  // // at this time could add a tweet :)
  // job.priority('normal');
  // // .retry({ retries: 5,
  // //   wait: 5*60*1000 }) //15*60*1000 })  // 15 minutes between attempts
  // // .delay(0);// 60*60*1000)     // Wait an hour before first try
  // var jid = job.save();               // Commit it to the server
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

export function tsx_UpdateServerState( name, value) {
  var tsx = tsx_GetServerState( name );
  var id = TheSkyXInfos.update( {_id: tsx._id }, {
    $set: {
      value: value,
      timestamp: new Date(),
     }
  })
};

export function tsx_GetServerState( name ) {
  var val = TheSkyXInfos.findOne( {name: name });
  return val;
};

export function tsx_GetServerStateValue( name ) {
  var val = TheSkyXInfos.findOne( {name: name });
  if( typeof val != 'undefined' ) {
    if( typeof val.value != 'undefined' ) {
      return val.value;
    }
  }
  return '';
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
