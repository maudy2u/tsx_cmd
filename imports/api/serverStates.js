import { TheSkyXInfos } from './theSkyXInfos.js';

export const tsx_ServerStates = {
  currentStage: 'currentStage', // this is a status line update for the dashboard
  initialFocusTemperature: 'initialFocusTemperature',
  initialRA: 'initialRA',
  initialDEC: 'initialDEC',
  initialMHS: 'initialMHS',
  initialMntDir: 'initialMntDir',
  initialMntAlt: 'initialMntAlt',

  curentTargetName: 'curentTargetName',
  targetRA: 'targetRA',
  targetDEC: 'targetDEC',
  targetALT: 'targetALT',
  targetAZ: 'targetAZ',
  isCurrentlyImaging: 'isCurrentlyImaging',

  currentImagingName: 'currentImagingName',
  imagingSessionId: 'imagingSessionId',
  imagingSession: 'imagingSession', // use to report current imaging targets
  imagingRA: 'imagingRA',
  imagingDEC: 'imagingDEC',
  imagingALT: 'imagingALT',
  imagingAZ: 'imagingAZ',

  defaultMinAltitude: 'defaultMinAltitude',

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
  TheSkyXInfos.update( {_id: tsx._id }, {
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
