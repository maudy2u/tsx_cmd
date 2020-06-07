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
  saveDefaultStateValue,
} from '../imports/api/serverStates.js';

import {
  tsx_Connect,
  tsx_Disconnect,
  tsx_MntPark,
  tsx_AbortGuider,
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
  tsx_SlewTargetName,
  tsx_SlewCmdCoords,
  tsx_StopTracking,
  isSchedulerStopped,
} from './run_imageSession.js';

//const arteksy_cmd = '/usr/local/bin/arteksy_cmd'
//const arteksy_cmd = '/usr/bin/arteksy_cmd'
//const arteksy_cmd = '/bin/artesky_cmd'
const arteksy_cmd = ''; // comment out attmempting sockets 'artesky_cmd'

// grab npm version
import shelljs from 'shelljs';
// this is equivalent to the standard node require:
const Shelljs = require('shelljs');

function flatbox_srv() {
  var addr = tsx_GetServerStateValue( tsx_ServerStates.flatbox_ip);
  if( addr == '' || typeof addr == 'undefined') {
    addr = '127.0.0.1';
    tsx_UpdateServerState( 'flatbox_ip', addr);
  }
  return ''; //arteksy_cmd + ' --host ' + addr;
}

function flat_device() {
  var addr = tsx_GetServerStateValue( tsx_ServerStates.flatbox_device);
  if( addr == '' || typeof addr == 'undefined') {
    addr = '/dev/ttyACM0';
    tsx_UpdateServerState( 'flatbox_device', addr);
  }
//  return ' --device ' + addr;
  return '';
}

function flat_enabled() {
  var addr = tsx_GetServerStateValue( tsx_ServerStates.flatbox_enabled);
  if( typeof addr == 'undefined' || addr == '' ) {
    addr = false;
    tsx_UpdateServerState( 'flatbox_enabled', addr);
  }
}

export function flatbox_setup() {
  var cmd = flatbox_srv() + flat_device();
  tsxLog(' [ARTESKY] Flatbox sending: ' + cmd );

  var Out =false;

  artesky_cmd(cmd, Meteor.bindEnvironment((err) => {
    var results = tsx_return.split(':');
    if( results.length > 0) {
      var err = results[0].trim();
      if (err !== 'Processed') {
        UpdateStatusErr(' [ARTESKY] CONNECTION FAILED!! Artesky server error: ' + err);
      }
      else {
        UpdateStatus(' [ARTESKY] Flatbox Connected: ' + err );
        Out = true;
      }
    }
    stop_artesky_is_waiting();
  }));

  while( artesky_is_waiting() ) {
    Meteor.sleep( 1000 );
  }
  return Out;
}

export function flatbox_connect() {
  var cmd = flatbox_srv() + ' --connect ' + flat_device();
  tsxLog(' [ARTESKY] Flatbox sending: ' + cmd );

  var Out =false;
  artesky_cmd(cmd, Meteor.bindEnvironment((artesky_return) => {
    var results = artesky_return.split(':');
    if( results.length > 0) {
      var err = results[0].trim();
      if (err !== 'Processed') {
        UpdateStatusErr(' [ARTESKY] CONNECTION FAILED!! Artesky server error: ' + err);
      }
      else {
        UpdateStatus(' [ARTESKY] Flatbox Connected: ' + err );
        Out = true;
      }
    }
    stop_artesky_is_waiting();
  }));

  while( artesky_is_waiting() ) {
    Meteor.sleep( 1000 );
  }
  return Out;
}

export function flatbox_on() {
  flatbox_connect();
  var cmd = flatbox_srv() + ' --on';
  tsxLog(' [ARTESKY] Flatbox sending: ' + cmd );
  var Out =false;
  artesky_cmd(cmd, Meteor.bindEnvironment((artesky_return) => {
    var results = artesky_return.split(':');
    if( results.length > 0) {
      var err = results[0].trim();
      if (err !== 'Processed') {
        UpdateStatusErr(' [ARTESKY] TURNING ON FAILED!! Artesky server error: ' + err);
      }
      else {
        UpdateStatus(' [ARTESKY] Flatbox ON: ' + err  );
        Out =true;
      }
    }
    stop_artesky_is_waiting();
  }));
  while( artesky_is_waiting() ) {
    Meteor.sleep( 1000 );
  }
  return Out;
}

export function flatbox_level( lvl ) {
  var err;
  var cmd = '';
  if( lvl > 0 && lvl < 255 ) {
  }
  else {
    UpdateStatus(' [ARTESKY] Flatbox OUT OF RANGE. LEVEL SET: ' + err  );
    lvl = 0;
  }
  cmd = flatbox_srv() + ' --level ' + lvl;
  tsxLog(' [ARTESKY] Flatbox sending: --level ' + cmd );
  var Out =false;
  artesky_cmd(cmd, Meteor.bindEnvironment((artesky_return) => {
    var results = artesky_return.split(':');
    if( results.length > 0) {
      var err = results[0].trim();
      if (err !== 'Processed') {
        UpdateStatusErr(' [ARTESKY] Flatbox LEVEL FAILED!! Artesky server error: ' + err);
      }
      else {
        UpdateStatus(' [ARTESKY] Flatbox LEVEL SET: ' + lvl  );
        Out =true;
      }
    }
    stop_artesky_is_waiting();
  }));
  while( artesky_is_waiting() ) {
    Meteor.sleep( 1000 );
  }
  return Out;
}

export function flatbox_off() {
  var cmd = flatbox_srv() + ' --off';
  tsxLog(' [ARTESKY] Flatbox sending: ' + cmd );
  var Out = false;
  artesky_cmd(cmd, Meteor.bindEnvironment((artesky_return) => {
    var results = artesky_return.split(':');
    if( results.length > 0) {
      var err = results[0].trim();
      if (err !== 'Processed') {
        UpdateStatusErr(' [ARTESKY] Flatbox OFF FAILED!! Artesky server error: ' + err);
      }
      else {
        UpdateStatus(' [ARTESKY] Flatbox OFF: ' + err );
        Out = true;
      }
    }
    stop_artesky_is_waiting();
  }));
  while( artesky_is_waiting() ) {
    Meteor.sleep( 1000 );
  }
  return Out;
}

export function flatbox_disconnect() {
  var cmd = flatbox_srv() + ' --disconnect';
  tsxLog(' [ARTESKY] Flatbox sending: ' + cmd );
  var Out =false;
  artesky_cmd(cmd, Meteor.bindEnvironment((artesky_return) => {
    var results = artesky_return.split(':');
    if( results.length > 0) {
      var err = results[0].trim();
      if (err !== 'Processed') {
        UpdateStatusErr(' [ARTESKY] Flatbox DISCONNECT FAILED!! Artesky server error: ' + err);
      }
      else {
        UpdateStatus(' [ARTESKY] Flatbox Disconnected: ' + err );
        Out =true;
      }
    }
    stop_artesky_is_waiting();
  }));
  while( artesky_is_waiting() ) {
    Meteor.sleep( 1000 );
  }
  return Out;
}

export function flatbox_status() {
  var cmd = flatbox_srv() + ' --status';
  tsxLog(' [ARTESKY] Flatbox sending: ' + cmd );
  var Out =false;
  artesky_cmd(cmd, Meteor.bindEnvironment((artesky_return) => {
    var results = artesky_return.split(':');
    if( results.length > 0) {
      var err = results[0].trim();
      if (err !== 'Processed') {
        UpdateStatusErr(' [ARTESKY] Flatbox STATUS FAILED!! Artesky server error: ' + err);
      }
      else {
        // tsxLog('Dither success');
        UpdateStatus(' [ARTESKY] Flatbox STATUS: ' + err );
        Out =artesky_return;
      }
    }
    stop_artesky_is_waiting();
  }));
  while( artesky_is_waiting() ) {
    Meteor.sleep( 1000 );
  }
  return Out;
}

var artesky_waiting = false;

export function artesky_is_waiting() {
  return artesky_waiting;
}
export function stop_artesky_is_waiting() {
  artesky_waiting = false;
}

function start_artesky_is_waiting() {
  artesky_waiting = true;
}

function artesky_GetPortAndIP() {
  var ip = tsx_GetServerStateValue( tsx_ServerStates.flatbox_ip);
  var port = 5570; // 5570
  return { ip, port };
}

// *******************************
// test of generic write method...
export function artesky_cmd( cmd, callback ) {
  // Meteor._debug(" ********** tsx_feeder ************ ");
  // Meteor._debug('Started tsx_feeder.');
  var Out = '';
  cmd = String(cmd);
  Meteor.sleep(1*1000);  // arbitary sleep for 3sec.

  const { ip, port } = artesky_GetPortAndIP();
  var net = require('net');
  var tsx = new net.Socket({writeable: true}); //writeable true does not appear to help
  tsx.setEncoding(); // used to set the string type of return

  tsx.on('close', function() {
       Meteor._debug('artesky_close');
  });

  tsx.on('write', function() {
       Meteor._debug('Writing to TheSkyX.');
  });


  tsx.on('error', function(err) {
    console.error(" ******************************* ");
    console.error( 'Connection error: ' + err );
    console.error(" ******************************* ");

    callback('TsxError|' + err + '|' + cmd );
    stop_artesky_is_waiting();
  });

  tsx.on('data', (chunk) => {
//    Meteor._debug(` [ARTESKEY] Received ${chunk.length} bytes of data.`);
//    Meteor._debug(' [ARTESKEY] DEBUG - Received: ***'  + chunk + '***');
    Out = chunk;
    // tsx.close;
    callback(Out);
//    stop_artesky_is_waiting();
  });

  start_artesky_is_waiting();

  tsx.connect(port, ip, function() {
    //Meteor._debug(' [ARTESKEY] DEBUG - Sending arteskyCmd: ' + ip + ', ' +  port);
  });

  tsx.write(cmd, (err) => {
     Meteor._debug(' [ARTESKEY] DEBUG - Sending arteskyCmd: ' + cmd);
  });

  // need a TSX WAIT FOR SCRIPT DONE...
  // https://www.w3schools.com/js/js_timing.asp
  var waiting = 0; // create arbitarty timeout
  var imageChk = false;
  var processId = tsx_GetServerStateValue( tsx_ServerStates.runScheduler );
  while( artesky_waiting && processId > '' ) { //}&& forceExit > 2*60*sec ) {
    var sec = 1000;
    Meteor.sleep( sec );
    waiting = waiting + sec;
    var incr = waiting /sec;
  }
  tsx.end(); // will announce tsx_close
};

Meteor.methods({

  testArteskyConnection() {
    var err = false;
    try{
      tsx_SetServerState( tsx_ServerStates.tool_active, true );
      err = flatbox_connect();
      console.log( ' [ARTESKY] connect: ' + err )
      err = flatbox_status();
      console.log( ' [ARTESKY] status: ' + err )
    }
    catch( e )  {
      UpdateStatus(' [ARTESKY] Is artesky_srv connection STILL there ?!?' + e );
    }
    finally {
      tsx_SetServerState( tsx_ServerStates.tool_active, false );
    }
    return err;
  },

  artesky_off() {
    var err = false;
    try{
      tsx_SetServerState( tsx_ServerStates.tool_active, true );
      err = flatbox_connect();
      console.log( ' [ARTESKY] connect: ' + err )
      err = flatbox_off();
      console.log( ' [ARTESKY] off: ' + err )
      err = flatbox_disconnect();
      console.log( ' [ARTESKY] disconnect: ' + err )
    }
    catch( e )  {
      UpdateStatus(' [ARTESKY] Is artesky_srv connection STILL there ?!?' + e );
    }
    finally {
      tsx_SetServerState( tsx_ServerStates.tool_active, false );
    }
    return err;
  },

  artesky_on() {
    var err = false;
    try{
      tsx_SetServerState( tsx_ServerStates.tool_active, true );
      err = flatbox_connect();
      console.log( ' [ARTESKY] connect: ' + err )
      err = flatbox_on();
      console.log( ' [ARTESKY] on: ' + err )
      var level = tsx_GetServerStateValue( tsx_ServerStates.flatbox_lamp_level );
      err = flatbox_level( level );
      console.log( ' [ARTESKY] level: ' + err )

    }
    catch( e )  {
      UpdateStatus(' [ARTESKY] Is artesky_srv connection STILL there ?!?' + e );
    }
    finally {
      tsx_SetServerState( tsx_ServerStates.tool_active, false );
    }
    return err;
  },

  artesky_level() {
    var ok = true;
    try {
      tsx_SetServerState( tsx_ServerStates.tool_active, true );
      ok = flatbox_connect();
      console.log( ' [ARTESKY] connect: ' + ok )
      if( ok ) {
        var level = tsx_GetServerStateValue( tsx_ServerStates.flatbox_lamp_level );
        ok = flatbox_level( level );
        console.log( ' [ARTESKY] level: ' + ok )
      }
    }
    catch( e )  {
      UpdateStatus(' [ARTESKY] Is artesky_srv connection STILL there ?!?' + e );
    }
    finally {
      tsx_SetServerState( tsx_ServerStates.tool_active, false );
    }
    return ok;
  },

  artesky_status() {
    var res = true;
    try {
      tsx_SetServerState( tsx_ServerStates.tool_active, true );

      res = flatbox_connect();
      console.log( ' [ARTESKY] connect: ' + res )
      res = flatbox_status();
      console.log( ' [ARTESKY] status: ' + res )
      try {
        var status = res.split('Lamp is ');
        res = 'Lamp is ' + status[1];
      }
      catch( err ) {
        res = err;
      }
    }
    catch( e )  {
      UpdateStatus(' [ARTESKY] Is artesky_srv connection STILL there ?!?' + e );
    }
    finally {
      tsx_SetServerState( tsx_ServerStates.tool_active, false );
    }
    return res;
  },

});
