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

// Needs: meteor npm install --save simpl-schema

import { FilesCollection } from 'meteor/ostrio:files';
import { tsxInfo, tsxLog, tsxErr, tsxWarn, tsxDebug, logFileForClient, AppLogsDB } from './theLoggers.js';
// Used to store the filters currently available/active on TSX
import { Random } from 'meteor/random';

// Used to store the sessions for a Target - the actual imaging
// check here for extras: https://github.com/VeliovGroup/Meteor-Files/wiki/Constructor
var sfolder = '';
if( Meteor.settings.skySafari_files === '' || typeof Meteor.settings.skySafari_files === 'undefined' ) {
  sfolder = Meteor.absolutePath + '/skySafari_files/';
}
else {
  sfolder = Meteor.settings.skySafari_files;
}
export const skySafariFilesFolder = sfolder;
export const SkySafariFiles = new FilesCollection({
  storagePath: skySafariFilesFolder,
  collectionName: 'skySafariFiles',
  // allowClientCode: true, // Required to let you remove uploaded file
  // onBeforeUpload(file) {
  //   // Allow upload files under 10MB, and only in skyset formats
  //   if (file.size <= 1048576 && /skyset/i.test(file.ext)) {
  //     return true;
  //   } else {
  //     return 'Please upload SkySafari settings file, with size equal or less than 1MB';
  //   }
  // }
});
//export default SkySafariFiles; // To be imported in other files
// *******************************


export function skysafariFraming( skysetFile ) {

  // load files
  // ScopeFieldRotation=1.060000000000000e+02
  // DisplayCenterLon=2.024722758067027e+02
  // DisplayCenterLat=4.719440077746570e+01
  // var results = [
  //     "ScopeFieldRotation=1.060000000000000e+02",
  //     "DisplayCenterLon=2.024722758067027e+02",
  //     "DisplayCenterLat=4.719440077746570e+01",
  //   ];
    var fs = require('fs');
    try {
        var src = fs.readFileSync(skysetFile, 'utf8');
    } catch(e) {
        console.log('Error:', e.stack);
    }

  tsxInfo(' *** skysafari: ' + skysetFile );
  var OUT = {};

  // iterate and split for
  var results = src.split('\n');
  for( var i=0; i<results.length;i++) {
    var token=results[i].trim();
    // RunJavaScriptOutput.writeLine(token);
    var param=token.split("=");
    switch( param[0] ) {

      case 'ScopeFieldRotation':
        OUT.pa=convertORIENT2PA(param[1]);
        break;

      case 'DisplayCenterLon':
        OUT.ra=convertLon2RA(param[1]);
        break;

      case 'DisplayCenterLat':
        OUT.dec=convertLat2Dec(param[1]);
        break;

      default:
        //RunJavaScriptOutput.writeLine(param[0]+' not found.');
    }
  }
  tsxInfo( OUT.ra + ', ' + OUT.dec + ', ' + OUT.pa );
  return OUT;
}

export function convertLon2RA( lon ) {
  //var lon  = 1.072530029359138e+02
  var dd = Math.floor(lon/15)
  var mmdec = (lon/15-dd)*60
  var mm = Math.floor(mmdec)
  var ssdec = (mmdec-mm)*60
  var ss = ssdec.toFixed(2)
  return dd + 'h ' + mm + 'm ' + ss + 's';
}
export function convertLat2Dec( lat ) {
  //var lat =
  var dd = Math.floor(lat)
  var mmdec = (lat-dd)*60
  var mm = Math.floor(mmdec)
  var ssdec = (mmdec-mm)*60
  var ss = ssdec.toFixed(2)

  return dd + 'd ' + mm + 'm ' + ss + 's';
}

export function convertORIENT2PA( orient ) {
  //RunJavaScriptOutput.writeLine(orient+'  found.');
	if( orient < 360 && orient>=180 ) {
    	return (360 - orient).toFixed(2);
  }
  else if( orient > 0 && orient < 180 ) {
		return (180 - orient).toFixed(2);
	}
	else {
 	  return -1; //failed orient value
	}
}

export function getSkySafariSkySetName( sid ) {
  var name = '';
  if( sid !=''&& typeof sid != 'undefined') {
    var sFile = SkySafariFiles.findOne({_id: sid});
    if( sFile != '' && typeof sFile != 'undefined') {
      name = sFile.name;
    }
  }
  return name;
}

export function getSkySetsDropDown() {
  var items = SkySafariFiles.find().fetch();
  var dropDownArray = [];
  for (var i = 0; i < items.length; i++) {
    dropDownArray.push({
      key: items[i]._id,
      text: items[i].name,
      value: items[i].name });
  }
  return dropDownArray;
};

if (Meteor.isServer) {
  import shelljs from 'shelljs';
  // this is equivalent to the standard node require:
  const Shelljs = require('shelljs');

  try {
    tsxInfo('   skyset',  skySafariFilesFolder );
    let err = Shelljs.test( '-e', skySafariFilesFolder ); // -e tests for valid path, -d tests for directory
    if( err != true ) {
      tsxErr( ' skysafari folder file not found, creating: ' + skySafariFilesFolder );
      let err = Shelljs.mkdir( '-p', skySafariFilesFolder).code;
      tsxErr( err );
      if ( err !== 0) {
        tsxErr('Error: failed to create skysafari location: ' + err);
        return;
      }
    }
    else {
      let err = Shelljs.test( '-d', skySafariFilesFolder ); // -e tests for valid path, -d tests for directory
      if( err != true ) {
        tsxErr( ' skysafari path is not a valid directory: ' + skySafariFilesFolder );
      }
    }
  }
  catch( e ) {
    // If on mac do nothing...
    tsxErr( ' skysafari mkdir exception: ' + e );
  }
}
