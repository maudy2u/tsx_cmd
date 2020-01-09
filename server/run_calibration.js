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

import { Filters } from '../imports/api/filters.js';
import { TheSkyXInfos } from '../imports/api/theSkyXInfos.js';
import { scheduler } from '../imports/api/theProcessors.js';
import { TargetAngles } from '../imports/api/targetAngles.js';

import { tsxInfo, tsxLog, tsxErr, tsxWarn, tsxDebug,
  logFileForClient, AppLogsDB
} from '../imports/api/theLoggers.js';

import {
  getFilterName,
  getFrameNumber,
  getFrameName,
  getFilterSlot,
} from './filter_wheel.js'

import {
  tsx_ServerStates,
  tsx_SetServerState,
  tsx_GetServerState,
  tsx_UpdateDevice,
  tsx_GetServerStateValue,
  UpdateStatus,
  UpdateStatusErr,
  postProgressTotal,
  postProgressIncrement,
  postProgressMessage,
  UpdateImagingSesionID,
} from '../imports/api/serverStates.js';

import {
  tsx_takeImage,
  tsx_ServerIsOnline,
  tsx_SlewTargetName,
  tsx_SlewCmdCoords,
  tsx_StopTracking,
  isSchedulerStopped,
} from './run_imageSession.js';

import {
  flatbox_connect,
  flatbox_disconnect,
  flatbox_on,
  flatbox_off,
  flatbox_status,
  flatbox_level,
  flatbox_setup,
} from './artesky_flatbox.js'

import {
  CalibrationFrames,
  calibrationTypes,
  addCalibrationFrame,
  updateCalibrationFrame,
 } from '../imports/api/calibrationFrames.js';

const settlePanel = 3*1000; // seconds

export function collect_calibration_images() {
  tsx_SetServerState( 'tool_active', true );

  // Confirm TheSkyX is running
  // if( tsx_Connect() != true ) {
  //   UpdateStatusErr( ' FAILED CALIBRATION SESSION: is TkeSkyX running?' );
  //   return;
  // }

  // Confirm TheSkyX is Running
  let cf; // get the enabled calibration calibrations
  cf = CalibrationFrames.find({ on_enabled: true }, { sort: { order: 1 } }).fetch();
  var fp_enabled = tsx_GetServerStateValue( 'flatbox_enabled');
  if( fp_enabled == '' ) {
    fp_enabled = false;
    tsx_SetServerState('flatbox_enabled', false);
    tsxLog( ' Flatbox: turned off by default')
  }
  if( fp_enabled ) {
    flatbox_setup(); // connect device
 //   Meteor.sleep(settlePanel);
    flatbox_connect();
 //   Meteor.sleep(settlePanel);
  }
  // for loop for Quantity
  tsxLog( ' Processing calibration frames: ' + cf.length );
  for( var i=0; i < cf.length; i ++ ) {
    if( isSchedulerStopped() != false ) {
      tsxLog( ' EXIT: Scheduler is NOT stopped' );
      break;
    }
    cal = cf[i];
    // what is the FOV position??
    tsxLog( ' DEPRECATED>> Rotator disabled: ' + cal.rotation );

    // check if level > 0; if so turn on light panel
    if( fp_enabled == true && cal.level > 0 ) {
 //     Meteor.sleep(settlePanel);
      flatbox_on();
 //     Meteor.sleep(settlePanel);
      flatbox_level( cal.level );
 //     Meteor.sleep(settlePanel);
    }
    else if( fp_enabled == true && cal.level <= 0 ) {
//     Meteor.sleep(settlePanel);
      flatbox_level( cal.level );
 //     Meteor.sleep(settlePanel);
      flatbox_off();
 //     Meteor.sleep(settlePanel);
    }
    // take_image to actually take the picture
    try {
      for( var sub=0; sub<cal.quantity; sub++) {
        if( isSchedulerStopped() == false ) {
            takeCalibrationImages( cal );
            var inc = sub+1;
            UpdateStatus( ' Calibration: ' + cal.subFrameTypes + ' ' +  cal.filter + ' ' + cal.exposure + ' sec: '  +inc+'/' + cal.quantity    );
        }
        else {
          UpdateStatus( " --- Calibrations Manually stopped.");
        }
      }
    }
    catch( err ) {
      tsxDebug( err )
      var res = err.split('|')[0].trim();
      if( res == 'TSX_ERROR' ) {
        UpdateStatusErr( ' *** UNKNOWN ERROR - Calibrating failed.' );
        // do not move mount/park as calibrating....
      }
    }
  }
  if( fp_enabled ) {
    flatbox_off();
 //   Meteor.sleep(settlePanel);
    flatbox_disconnect();
 //   Meteor.sleep(settlePanel);
  }

  tsx_SetServerState( 'tool_active', false );
}

//var aFrame = $002; //  cdLight =1, cdBias, cdDark, cdFlat
function takeCalibrationImages( cal ) {
  var frame = getFrameNumber(cal.subFrameTypes);
  var filter = getFilterSlot( cal.filter );
  var exposure = cal.exposure;
  var delay = tsx_GetServerStateValue( 'flatbox_camera_delay' );
  var binning; //future
  var tName = "calibration_image";
  tsxDebug( ' Calibration: filter=' +filter +', exposure=' + exposure +', frame=' + frame +', name=' + tName + ', delay=' + delay);
  tsx_takeImage( filter, exposure, frame, tName, delay, binning );
}
