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

// Store app information
export const AppLogsDB = new Mongo.Collection('appLogsDB');

// Store the session report when play buttin is pressed
export const ReportDB = new Mongo.Collection('reportDB');

// Store the Target Plan and Target information... (Filenames?)
export const TargetPlanDB = new Mongo.Collection('targetPlanDB');

import { Logger }     from 'meteor/ostrio:logger';
// https://atmospherejs.com/ostrio/loggerfile
import { LoggerFile } from 'meteor/ostrio:loggerfile';
// https://atmospherejs.com/ostrio/loggerconsole
import { LoggerConsole } from 'meteor/ostrio:loggerconsole';
// https://atmospherejs.com/ostrio/loggermongo
import { LoggerMongo } from 'meteor/ostrio:loggermongo';

import {
  sessionDate,
} from './time_utils.js'

const logSession = new Logger();
const logCon = new Logger(); // for console
const logDB = new Logger();
const logReport = new Logger();

var log_levels = [];
if( Meteor.settings.enable_log != 'no') {
 log_levels.push('LOG');
}
if( Meteor.settings.enable_debug === 'yes') {
 log_levels.push('DEBUG');
}
if( Meteor.settings.enable_trace === 'yes') {
 log_levels.push('TRACE');
}
if( Meteor.settings.enable_info === 'yes') {
 log_levels.push('INFO');
}
if( Meteor.settings.enable_warn === 'yes') {
 log_levels.push('WARN');
}
log_levels.push('ERROR');

var   filters = {
  filter: log_levels,
  client: true,
  server: true,
};

export function tsxReport( msg, data ) {
  if( typeof data === 'undefined' || data == null ) {
    data = '';
  }

//  logDB.log( '|'+ formatDate(dt) +'|' + msg + ' ' + data );
  logDB.log( msg + ' ' + data );
}

export function tsxLog( msg, data ) {
  if( typeof data === 'undefined' || data == null ) {
    data = '';
  }
  logCon.log( msg, data );
  logSession.log( msg, data );
  // var dt = new Date();
  // if( data != '' ) {
  //   data = '= ' + data;
  // }
//  logDB.log( '|'+ formatDate(dt) +'|' + msg + ' ' + data );
  logDB.log( msg + ' ' + data );
}

export function tsxDebug( msg, data ) {
  if( typeof data === 'undefined' || data == null ) {
    data = '';
  }
  logCon.debug( msg, data );
  logSession.debug( msg, data );
  // var dt = new Date();
  // if( data != '' ) {
  //   data = '= ' + data;
  // }
//  logDB.log( '|'+ formatDate(dt) +'|' + msg + ' ' + data );
  logDB.debug( msg + ' ' + data );
}

export function tsxWarn( msg, data ) {
  if( typeof data === 'undefined' || data == null ) {
    data = '';
  }
  logCon.warn( msg, data );
  logSession.warn( msg,  data );
  // var dt = new Date();
  // if( data != '' ) {
  //   data = '= ' + data;
  // }
  // logDB.warn( '|'+ formatDate(dt) +'|' + msg + ' ' + data );
  logDB.warn( msg + ' ' + data );
}

export function tsxErr( msg, data ) {
  if( typeof data === 'undefined' || data == null ) {
    data = '';
  }
  logCon.error( msg, data );
  logSession.error( msg, data );
  logDB.error( msg + ' ' + data );
}

export function tsxInfo( msg, data ) {
  if( typeof data === 'undefined' || data == null ) {
    data = '';
  }
  logCon.info( msg, data );
  logSession.info( msg,  data );
  logDB.info(  msg + ' ' + data );
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

/*
 * Separate settings and collection
 * for info, trace and other messages
 */
 (new LoggerMongo(logReport, {
   collection: AppLogsDB,
   format(opts) {
     // var msgData= ((typeof opts.additional.info == 'undefined') ? '' : (' = ' + opts.additional.info));
     var msgData= ((typeof opts.data === 'undefined' || opts.data === null || opts.data === '') ? '' : (' = ' + opts.data));
     return {
       date: formatDate( new Date() ),
       level: opts.level,
       message: opts.message,
       additional: msgData,
     }
   }
 })).enable( filters );

 (new LoggerMongo(logDB, {
  collection: AppLogsDB,
  format(opts) {
    // var msgData= ((typeof opts.additional.info == 'undefined') ? '' : (' = ' + opts.additional.info));
    var msgData= ((typeof opts.data === 'undefined' || opts.data === null || opts.data === '') ? '' : (' = ' + opts.data));
    return {
      date: formatDate( new Date() ),
      level: opts.level,
      message: opts.message,
      additional: msgData,
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
// srcPath = srcPath +'/server/logs/';
var logFolder = '';
if( Meteor.settings.log_file_location === '' || typeof Meteor.settings.log_file_location === 'undefined' ) {
  logFolder = Meteor.absolutePath;
}
else {
  logFolder = Meteor.settings.log_file_location;
}

export function logFileForClient() {
  var logFolder = '';
  if( Meteor.settings.log_file_location === '' || typeof Meteor.settings.log_file_location === 'undefined' ) {
    logFolder = Meteor.absolutePath;
  }
  else {
    logFolder = Meteor.settings.log_file_location;
  }
  var time = new Date();
  var location = logFolder + '/logs/';
  var fileName = sessionDate(time) + "_tsx_cmd.log";

  return location + fileName;
}

(new LoggerFile(logSession, {
  collectionName: 'AppLogsSession',
  fileNameFormat(time) {
    // Create log so that the name match the times for the "night" session
    return sessionDate(time) + "_tsx_cmd.log";
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
