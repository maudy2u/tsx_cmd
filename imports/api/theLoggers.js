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

import { Mongo } from 'meteor/mongo';
export const AppLogsDB = new Mongo.Collection('appLogsDB');

import { Logger }     from 'meteor/ostrio:logger';
// https://atmospherejs.com/ostrio/loggerfile
import { LoggerFile } from 'meteor/ostrio:loggerfile';
// https://atmospherejs.com/ostrio/loggerconsole
import { LoggerConsole } from 'meteor/ostrio:loggerconsole';
// https://atmospherejs.com/ostrio/loggermongo
import { LoggerMongo } from 'meteor/ostrio:loggermongo';

 const logSession = new Logger();
 const logCon = new Logger();
 const logDB = new Logger();

var logFolder = '';
if( Meteor.settings.log_file_location === '') {
  logFolder = Meteor.absolutePath;
}
else {
  logFolder = Meteor.settings.log_file_location;
}

var filters ='';
if( Meteor.settings.enable_debug === 'yes') {
  filters = {
    filter: [
      'DEBUG',
      'INFO',
      'LOG',
      // 'TRACE'
      'ERROR',
    ],
    client: true,
    server: true
 };
}
else {
  filters = {
    filter: [
      // 'DEBUG',
      'INFO',
      'LOG',
      // 'TRACE'
      'ERROR',
    ],
    client: true,
    server: true
 };
}

export function tsxLog( msg, data ) {
  if( typeof data === 'undefined' || data == null ) {
    data = '';
  }
  logCon.log( msg, data );
  logSession.log( msg, data );
  logDB.log( msg, { data: data } );
}

export function tsxWarn( msg, data ) {
  if( typeof data === 'undefined' || data == null ) {
    data = '';
  }
  logCon.warn( msg, data );
  logSession.warn( msg,  data );
  logDB.warn( msg,  { info: data } );
}

export function tsxErr( msg, data ) {
  if( typeof data === 'undefined' || data == null ) {
    data = '';
  }
  logCon.error( msg, data );
  logSession.error( msg, data );
  logDB.error( msg, { data: data } );
}

export function tsxDebug( msg, data ) {

  if( typeof data === 'undefined' || data == null ) {
    data = '';
  }
  logCon.debug( msg, data );
  logSession.debug( msg, data );
  logDB.debug( msg, { data: data } );
}

export function tsxInfo( msg, data ) {
  if( typeof data === 'undefined' || data == null ) {
    data = '';
  }
  logCon.info( msg, data );
  logSession.info( msg,  data );
  logDB.info( msg,  { info: data } );
}

function formatDate( today ) {
  // desired format:
  // 2018-01-01 hh:mm:ss

  var HH = today.getHours();
  var MM = today.getMinutes();
  var SS = today.getSeconds();
  var mm = today.getMonth()+1; // month is zero based
  var dd = today.getDate();
  var yyyy = today.getFullYear();

  return yyyy +'-'+ ('0'  + mm).slice(-2) +'-'+ ('0'  + dd).slice(-2)
  + '|'
  + ('0'  + HH).slice(-2) + ':'
  + ('0'  + MM).slice(-2) + ':'
  + ('0'  + SS).slice(-2);
}

function fileNameDate( today ) {
  // desired format:
  // 2018-01-01

  var HH = today.getHours();
  var MM = today.getMinutes();
  var SS = today.getSeconds();
  var mm = today.getMonth()+1; // month is zero based
  var dd = today.getDate();
  var yyyy = today.getFullYear();

  // set to the date of the "night" session
  ((HH < 8) ? dd=dd-1 : dd=dd);

  return yyyy +'_'+ ('0'  + mm).slice(-2) +'_'+ ('0'  + dd).slice(-2);
}


/*
 * Separate settings and collection
 * for info, debug and other messages
 */
(new LoggerMongo(logDB, {
  collection: AppLogsDB,
  format(opts) {
    // var msgData= ((typeof opts.additional.info == 'undefined') ? '' : (' = ' + opts.additional.info));
    return {
      date: new Date(),
      level: opts.level,
      message: opts.message,
      additional: opts.additional.info,
    }
  }
})).enable( filters );

(new LoggerConsole(logCon, {
  collectionName: 'AppLogsCon',
  format(opts) {
    var msgData= ((typeof opts.data === 'undefined' || opts.data === null || opts.data === '') ? '' : (' = ' + opts.data));
    return ((Meteor.isServer) ? '[TSX_CMD]' : "[CLIENT]")
    +'|'+(formatDate( opts.time ) + '|[' + opts.level + ']|'
    + opts.message
    + msgData);
    }
})).enable( filters );

// Initialize LoggerFile:
// var pathLog = Npm.require('path');
// var rootPathLog = pathLog.resolve('.');
// var srcPath = rootPathLog.split(pathLog.sep + '.meteor')[0];
// // var c = Meteor.absolutePath;
// // tsxDebug('Root: ' + src);
// srcPath = srcPath +'/server/logs/';

export function logFileForClient() {
  var time = new Date();
  var location = logFolder + '/logs/';
  var fileName = fileNameDate(time) + "_tsx_cmd.log";

  return location + fileName;
}

(new LoggerFile(logSession, {
  collectionName: 'AppLogsSession',
  fileNameFormat(time) {
    // Create log so that the name match the times for the "night" session
    return fileNameDate(time) + "_tsx_cmd.log";
  },
  path: logFolder + '/logs/', // srcPath, //'~/tsx_cmd_logs/', // Use absolute storage path

  format(time, level, message, data, userId) {
    var msgData= ((typeof data === 'undefined' || data === null || data === '' ) ? '' : (' = ' + data));
    return (
      (Meteor.isServer) ? '[TSX_CMD]' : "[CLIENT]")
      + '|' +(formatDate( time )
      + '|[' + level + ']|'
      + message
      + msgData + '\r\n'
    )
  }
})).enable( filters );
