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
import { TheSkyXInfos } from '../imports/api/theSkyXInfos.js';
import { scheduler } from '../imports/api/theProcessors.js';

import {
  tsx_GetServerStateValue,
  UpdateStatus,
  UpdateStatusErr,
  postStatus,
  postProgressTotal,
  postProgressIncrement,
 } from '../imports/api/serverStates.js'

var tsx_waiting = false;

export function tsx_is_waiting() {
  return tsx_waiting;
}
export function stop_tsx_is_waiting() {
  tsx_waiting = false;
}
function start_tsx_is_waiting() {
  tsx_waiting = true;
}

var tsxHeader =  '/* Java Script *//* Socket Start Packet */';
var tsxFooter = '/* Socket End Packet */';

function tsx_GetPortAndIP() {
  var ip = TheSkyXInfos.findOne().ip();
  var port = TheSkyXInfos.findOne().port();
  return { ip, port };
}

// *******************************
// test of generic write method...
export function tsx_feeder( cmd, callback ) {
  // Meteor._debug(" ********** tsx_feeder ************ ");
  cmd = String(cmd);
  Meteor.sleep(3*1000);  // arbitary sleep for 3sec.
  const { ip, port } = tsx_GetPortAndIP();

  // Meteor._debug('Started tsx_feeder.');
   var Out;
   var net = require('net');
   var tsx = new net.Socket({writeable: true}); //writeable true does not appear to help
   tsx.setEncoding(); // used to set the string type of return

   tsx.on('close', function() {
       Meteor._debug('tsx_close');
   });

   tsx.on('write', function() {
       // Meteor._debug('Writing to TheSkyX.');
   });

   tsx.on('error', function(err) {
    console.error(" ******************************* ");
    console.error(cmd);
    console.error( 'Connection error: ' + err );
    console.error( new Error().stack );
    // not sure if the call back out should be used...
    tsx.close;
    callback('TsxError|' + err);
    stop_tsx_is_waiting();
   });

   tsx.on('data', (chunk) => {
    // Meteor._debug(`Received ${chunk.length} bytes of data.`);
    // Meteor._debug('Received: '  + chunk);
    Out = chunk;
    tsx.close;
    callback(Out);
    stop_tsx_is_waiting();
   });

   tsx.connect(port, ip, function() {
   });

   start_tsx_is_waiting();

   tsx.write(cmd, (err) => {
     // Meteor._debug('Sending tsxCmd: ' + cmd);
   });

   // need a TSX WAIT FOR SCRIPT DONE...
   // https://www.w3schools.com/js/js_timing.asp
   var waiting = 0; // create arbitarty timeout
   var imageChk = false;
   var processId = tsx_GetServerStateValue( 'imagingSessionId' );
   if( typeof processId != 'undefined' || processId != '') {
     imageChk = true;
   }
   else {
     processId = 'ignore';
   }
  while( tsx_waiting && processId > '' ) { //}&& forceExit > 2*60*sec ) {
    tsx.reads;
    var sec = 1000;
    Meteor.sleep( sec );
    waiting = waiting + sec;
    var incr = waiting /sec;
    postProgressIncrement( incr );
    // postStatus( 'tsx_waiting (sec): ' + waiting /sec  );
    // Meteor._debug('tsx_waiting (sec): ' + waiting /sec );
    if( imageChk ) {
      processId = tsx_GetServerStateValue( 'imagingSessionId' );
    }
  }
  postProgressTotal(0);
  postProgressIncrement(0);
  tsx.close;
};
