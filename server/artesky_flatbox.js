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

import { TargetSessions } from '../imports/api/targetSessions.js';
import { TakeSeriesTemplates } from '../imports/api/takeSeriesTemplates.js';
import { Seriess } from '../imports/api/seriess.js';
import { Filters } from '../imports/api/filters.js';
import { TheSkyXInfos } from '../imports/api/theSkyXInfos.js';
import { scheduler } from '../imports/api/theProcessors.js';
import { FlatSeries } from '../imports/api/flatSeries.js';
import { TargetAngles } from '../imports/api/targetAngles.js';
import { CalibrationFrames } from '../imports/api/calibrationFrames.js';

import { tsxInfo, tsxLog, tsxErr, tsxWarn, tsxDebug,
  logFileForClient, AppLogsDB
} from '../imports/api/theLoggers.js';

import {
  backupFolder,
} from '../imports/api/backups.js';

import {
  skySafariFilesFolder,
} from '../imports/api/skySafariFiles.js';

import {
  tsx_ServerStates,
  tsx_SetServerState,
  tsx_GetServerState,
  tsx_UpdateDevice,
  tsx_GetServerStateValue,
  tsx_UpdateServerState,
  UpdateStatus,
  UpdateStatusErr,
  postProgressTotal,
  postProgressIncrement,
  postProgressMessage,
  UpdateImagingSesionID,
} from '../imports/api/serverStates.js';

import {
  tsx_Connect,
  tsx_Disconnect,
  tsx_MntPark,
  tsx_AbortGuider,
  getValidTargetSession,
  prepareTargetForImaging,
  processTargetTakeSeries,
  tsx_ServerIsOnline,
  tsx_isDark,
  isTimeBeforeCurrentTime,
  hasStartTimePassed,
  tsx_MntUnpark,
  tsx_IsParked,
  findCalibrationSession,
  CalibrateAutoGuider,
  tsx_RotateCamera,
  UpdateImagingTargetReport,
  tsx_SlewTargetName,
  tsx_SlewCmdCoords,
  tsx_StopTracking,
  isSchedulerStopped,
} from './run_imageSession.js';

//const arteksy_cmd = '/usr/local/bin/arteksy_cmd'
//const arteksy_cmd = '/usr/bin/arteksy_cmd'
//const arteksy_cmd = '/bin/artesky_cmd'
const arteksy_cmd = 'artesky_cmd'

// grab npm version
import shelljs from 'shelljs';
// this is equivalent to the standard node require:
const Shelljs = require('shelljs');

function flatbox_srv() {
  var addr = tsx_GetServerStateValue( 'flatbox_ip');
  if( addr == '' || typeof addr == 'undefined') {
    addr = '127.0.0.1';
    tsx_UpdateServerState( 'flatbox_ip', addr);
  }
  return arteksy_cmd + ' -h ' + addr;
}

function flat_device() {
  var addr = tsx_GetServerStateValue( 'flatbox_device');
  if( addr == '' || typeof addr == 'undefined') {
    addr = 'ttyARTESKYFLAT';
    tsx_UpdateServerState( 'flatbox_device', addr);
  }
  return ' -d ' + addr;
}

function flat_enabled() {
  var addr = tsx_GetServerStateValue( 'flatbox_enabled');
  if( addr == '' || typeof addr == 'undefined') {
    addr = false;
    tsx_UpdateServerState( 'flatbox_enabled', addr);
  }
}

export function flatbox_setup() {
  var cmd = flatbox_srv() + flat_device();
  tsxLog(' Flatbox -setup: ' + cmd );
  var err = Shelljs.exec( cmd ).code;
  if ( err == -1) {
    UpdateStatusErr('Error!! failed setup Artesky server: ' + err);
    return false;
  }
  return true;
}

export function flatbox_connect() {
  var cmd = flatbox_srv() + ' -c';
  tsxLog(' Flatbox -setup: ' + cmd );
  var err = Shelljs.exec( cmd ).code;
  if ( err == -1) {
    UpdateStatusErr('Error!! failed to connect to Artesky server: ' + err);
    return false;
  }
  return true;
}

export function flatbox_on() {
  var cmd = flatbox_srv() + ' -O';
  tsxLog(' Flatbox -ON: ' + cmd );
  Meteor.sleep(3*1000);
  var err = Shelljs.exec( cmd.trim() ).code;
  Meteor.sleep(3*1000);
//  err = Shelljs.exec( cmd.trim() ).code;
  if ( err == -1) {
    UpdateStatusErr('Error!! failed to turn on Artesky server: ' + err);
    return false;
  }
  return true;
}

export function flatbox_level( lvl ) {
  var err;
  if( lvl > 0 ) {
    var cmd = flatbox_srv() + ' -l ' + lvl;
    tsxLog(' Flatbox -ON: ' + cmd );
    err = Shelljs.exec( cmd ).code;
  }
  else {
    var cmd = flatbox_srv() + ' -l 0';
    tsxLog(' Flatbox -ON: ' + cmd );
    err = Shelljs.exec( cmd ).code;
  }
  if ( err == -1) {
    UpdateStatusErr('Error!! failed to set level Artesky server: ' + err);
    return false;
  }
  return true;
}

export function flatbox_off() {
  var cmd = flatbox_srv() + ' -o';
  tsxLog(' Flatbox -OFF: ' + cmd );
  err = Shelljs.exec( cmd ).code;
  if ( err == -1) {
    UpdateStatusErr('Error!! failed to turn OFF Artesky server: ' + err);
    return false;
  }
  return true;
}

export function flatbox_disconnect() {
  var cmd = flatbox_srv() + ' -x';
  tsxLog(' Flatbox -DISCONNECTED: ' + cmd );
  err = Shelljs.exec( cmd ).code;
  if ( err == -1) {
    UpdateStatusErr('Error!! failed to disconnect Artesky server: ' + err);
    return false;
  }
  return true;
}

export function flatbox_status() {
  var cmd = flatbox_srv() + ' -s';
  tsxLog(' Flatbox -STATUS: ' + cmd );
  err = Shelljs.exec( cmd ).code;
  if ( err == -1) {
    UpdateStatusErr('Error!! failed to get Status Artesky server: ' + err);
    return false;
  }
  return true;
}
