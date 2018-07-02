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

const filters = {
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
    return ((Meteor.isServer) ? '[SERVER]' : "[CLIENT]")
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

(new LoggerFile(logSession, {
  collectionName: 'AppLogsSession',
  fileNameFormat(time) {
    // Create log so that the name match the times for the "night" session
    return fileNameDate(time) + "_tsx_cmd.log";
  },
  path: Meteor.absolutePath + '/logs/', // srcPath, //'~/tsx_cmd_logs/', // Use absolute storage path

  format(time, level, message, data, userId) {
    var msgData= ((typeof data === 'undefined' || data === null || data === '' ) ? '' : (' = ' + data));
    return (
      (Meteor.isServer) ? '[SERVER]' : "[CLIENT]")
      + '|' +(formatDate( time )
      + '|[' + level + ']|'
      + message
      + msgData + '\r\n'
    )
  }
})).enable( filters );

// /*
//  * Separate settings and collection
//  * for errors, exceptions, warnings and etc.
//  */
// (new LoggerMongo(logDBErrs, {
//   collectionName: 'AppErrors',
//   format(opts) {
//     // return ((Meteor.isServer) ? '[SERVER]' : "[CLIENT]") + '|[' + opts.level + ']|' + (opts.time.getHours()) + ":" + (opts.time.getMinutes()) + ":" + (opts.time.getSeconds()) +'|'+ opts.message + " = " + opts.data;
//     return ((Meteor.isServer) ? '[SERVER]' : "[CLIENT]") +'|'+(formatDate( opts.time ) + '|[' + opts.level + ']|'+ opts.message + ((typeof opts.data == 'undefined') ? '' : (' = ' + opts.data)));
//     }
// })).enable({
//   filter: ['ERROR', 'FATAL', 'WARN'],
//   client: true,
//   server: true
// });


// (new LoggerFile(logFile, {
//   collectionName: 'AppLogs',
//   fileNameFormat(time) {
//     // Create log-files hourly
//     return fileNameDate(time) + ".log";
//   },
//   // path: '~/tsx_cmd_logs/', // Use absolute storage path
//
//   format(time, level, message, data, userId) {
//     return ((Meteor.isServer) ? '[SERVER]' : "[CLIENT]") +'|'+(formatDate( time ) + '|[' + level + ']|'+ message + ((typeof data == 'undefined') ? '' : (' = ' + data))) + '\r\n';
//   }
// })).enable({
//   filter: ['DEBUG', 'INFO', 'LOG', 'TRACE'],
//   client: true,
//   server: true
// });
