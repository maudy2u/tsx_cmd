import { TheSkyXInfos } from './theSkyXInfos.js';
import { scheduler } from './theProcessors.js';

import { Logger }     from 'meteor/ostrio:logger';
import { LoggerFile } from 'meteor/ostrio:loggerfile';


export const tsx_ServerStates = {
  ip: 'ip',
  port: 'port',
  currentStage: 'currentStage', // this is a status line update for the dashboard
  SchedulerStatus: 'SchedulerStatus',
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

  // Dithering related states
  defaultDithering: 'defaultDithering',
  imagingPixelSize: 'imagingPixelSize',
  minDitherFactor: 'minDitherFactor',
  maxDitherFactor: 'maxDitherFactor',

  defaultFilter: 'defaultFilter',
  defaultMinAlt: 'defaultMinAlt',
  defaultCoolTemp: 'defaultCoolTemp',
  defaultFocusTempDiff: 'defaultFocusTempDiff',
  defaultMeridianFlip: 'defaultMeridianFlip',
  defaultStartTime: 'defaultStartTime',
  defaultStopTime: 'defaultStopTime',
  defaultPriority: 'defaultPriority',
  defaultSoftPark: 'defaultSoftPark',
  defaultSleepTime: 'defaultSleepTime',
  defaultGuideExposure: 'defaultGuideExposure',

  defaultMinSunAlt: 'defaultMinSunAlt',
  isTwilightEnabled: 'isTwilightEnabled',
  isFocus3Enabled: 'isFocus3Enabled',
  isFocus3Binned: 'isFocus3Binned',

  lastTargetDirection: 'lastTargetDirection',
  lastCheckMinSunAlt: 'lastCheckMinSunAlt',
  lastFocusPos: 'lastFocusPos',
  lastFocusTemp: 'lastFocusTemp',
};

export function postStatus( info ) {
  // Create a job:
  var job = new Job(scheduler, 'updateClientData', // type of job
 // Job data that you define, including anything the job
 // needs to complete. May contain links to files, etc...
   {
     status: info,
     reportedAt: new Date(),
   }
 );

 // Set some properties of the job and then submit it
 // the same submit the start time to the scheduler...
 // at this time could add a tweet :)
 job.priority('normal');
   // .retry({ retries: 5,
   //   wait: 5*60*1000 }) //15*60*1000 })  // 15 minutes between attempts
   // .delay(0);// 60*60*1000)     // Wait an hour before first try
 var jid = job.save();               // Commit it to the server
};

export function postProgressTotal( info ) {
   // Create a job:
   var job = new Job(scheduler, 'updateProgressTotal', // type of job
  // Job data that you define, including anything the job
  // needs to complete. May contain links to files, etc...
    {
      total: info,
      reportedAt: new Date(),
    }
  );

  // Set some properties of the job and then submit it
  // the same submit the start time to the scheduler...
  // at this time could add a tweet :)
  job.priority('normal');
    // .retry({ retries: 5,
    //   wait: 5*60*1000 }) //15*60*1000 })  // 15 minutes between attempts
    // .delay(0);// 60*60*1000)     // Wait an hour before first try
  var jid = job.save();               // Commit it to the server
};

export function postProgressIncrement( info ) {
  // Create a job:
  var job = new Job(scheduler, 'updateProgressIncrement', // type of job
  // Job data that you define, including anything the job
  // needs to complete. May contain links to files, etc...
  {
    progress: info,
    reportedAt: new Date(),
  });

  // Set some properties of the job and then submit it
  // the same submit the start time to the scheduler...
  // at this time could add a tweet :)
  job.priority('normal');
  // .retry({ retries: 5,
  //   wait: 5*60*1000 }) //15*60*1000 })  // 15 minutes between attempts
  // .delay(0);// 60*60*1000)     // Wait an hour before first try
  var jid = job.save();               // Commit it to the server
};

export function postProgressMessage( info ) {
  // Create a job:
  var job = new Job(scheduler, 'updateProgressMessage', // type of job
  // Job data that you define, including anything the job
  // needs to complete. May contain links to files, etc...
  {
    message: info,
    reportedAt: new Date(),
  });

  // Set some properties of the job and then submit it
  // the same submit the start time to the scheduler...
  // at this time could add a tweet :)
  job.priority('normal');
  // .retry({ retries: 5,
  //   wait: 5*60*1000 }) //15*60*1000 })  // 15 minutes between attempts
  // .delay(0);// 60*60*1000)     // Wait an hour before first try
  var jid = job.save();               // Commit it to the server
};

export function tsx_SetServerState( name, value) {
  TheSkyXInfos.upsert( {name: name }, {
    $set: { value: value }
  })
};

export function tsx_UpdateDevice( name, man, mod) {
  TheSkyXInfos.upsert( {name: name }, {
    $set: {
      model: mod,
      manufacturer: man,
     }
  })
};

export function tsx_UpdateServerState( name, value) {
  var tsx = tsx_GetServerState( name );
  var id = TheSkyXInfos.update( {_id: tsx._id }, {
    $set: { value: value }
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
};
