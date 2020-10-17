import { Meteor } from 'meteor/meteor';
import { TheSkyXInfos } from '../imports/api/theSkyXInfos.js';

import {
  tsx_GetServerStateValue,
  UpdateStatus,
  UpdateStatusErr,
  postProgressTotal,
  postProgressIncrement,
  tsx_ServerStates,
 } from '../imports/api/serverStates.js'

 import {
   tsxInfo,
   tsxLog,
   tsxErr,
   tsxWarn,
   tsxDebug,
 } from '../imports/api/theLoggers.js';

/* *******************************
The purpose of this file is to change teh gain of the ZWO
cameras while using TheSkyX for imaging. To do this two things
are needed:
1. Edit the file ~/.ZWO/X2ASIconfig.xml
2. Diconnect and reconnect camera to force change into affect
******************************* */

/* ******************************

var convert = require("xml-js");
var fs = require("fs");
var file = '/home/odroid/.ZWO/X2ASIconfig.xml';

var fout = '/home/odroid/.ZWO/X2ASIconfig_NEW.xml';

// Small text file: https://sanori.github.io/2019/03/Line-by-line-Processing-in-node-js/
const lines = fs.readFileSync( file ).toString().split(/\r\n|\r|\n/);

var xml = [];
var append = [];
var foundAppend = false;

for (const line of lines) {
  if( line.match( '^<app_setting' ) ) {
     foundAppend = true;
  }
  if( foundAppend ) {
    append.push(line);
  }
  else {
    xml.push( line );
  }
}

console.log( xml );
console.log( append );


// LOAD File: https://www.geeksforgeeks.org/javascript-program-to-read-text-file/
//fs.readFile( file, "utf-8", (err, data ) => {
//  if (err) {
//     console.log(err);
//     throw(err);
//  }
//  console.log(data);
//  console.log(data.split(/\r\n|\r|\n/).length);

  // 1. truncate the last six lines, to use xml2json code to modify gain
  // 2. store the last six lines to re-append to the end of the file
  // 3. manipulate the json to set the new gain value
  //

//});

******************************* */
