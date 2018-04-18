import { TheSkyXInfos } from './theSkyXInfos.js';

export const tsx_ServerStates = {
  ip: 'ip',
  port: 'port',
  currentStage: 'currentStage', // this is a status line update for the dashboard

  initialFocusTemperature: 'initialFocusTemperature',
  initialRA: 'initialRA',
  initialDEC: 'initialDEC',
  initialMHS: 'initialMHS',
  initialMntDir: 'initialMntDir',
  initialMntAlt: 'initialMntAlt',

  targetName: 'targetName',
  targetRA: 'targetRA',
  targetDEC: 'targetDEC',
  targetALT: 'targetALT',
  targetAZ: 'targetAZ',
  targetHA: 'targetHA',
  targetTransit: 'targetTransit',
  curentTargetName: 'curentTargetName',
  currentImagingName: 'currentImagingName',

  isCurrentlyImaging: 'isCurrentlyImaging',
  imagingSessionId: 'imagingSessionId',
  imagingSession: 'imagingSession', // use to report current imaging targets

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

  isTwilightEnabled: 'isTwilightEnabled',
  isFocus3Enabled: 'isFocus3Enabled',
  isFocus3Binned: 'isFocus3Binned',
  lastFocusPos: 'lastFocusPos',
  lastFocusTemp: 'lastFocusTemp',
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
  return val.value;
};
