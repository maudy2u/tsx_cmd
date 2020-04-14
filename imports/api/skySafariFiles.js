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

import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { tsxInfo, tsxLog, tsxErr, tsxWarn, tsxDebug, logFileForClient, AppLogsDB } from './theLoggers.js';
import { FilesCollection } from 'meteor/ostrio:files';
// Used to store the filters currently available/active on TSX
import { Random } from 'meteor/random';
// import SimpleSchema from 'simpl-schema';

// Used to store the sessions for a Target - the actual imaging
// check here for extras: https://github.com/VeliovGroup/Meteor-Files/wiki/Constructor
var folder = '';
if( Meteor.settings.skySafari_files === '' || typeof Meteor.settings.skySafari_files === 'undefined' ) {
  folder = Meteor.absolutePath + '/skySafari_files/';
}
else {
  folder = Meteor.settings.skySafari_files;
}
export const skySafariFilesFolder = folder;
export const SkySafariFiles = new FilesCollection({
  storagePath: skySafariFilesFolder,
  collectionName: 'skySafariFiles',
  allowClientCode: true, // Required to let you remove uploaded file
  onBeforeUpload(file) {
    // Allow upload files under 10MB, and only in skyset formats
    if (file.size <= 1048576 && /skyset/i.test(file.ext)) {
      return true;
    } else {
      return 'Please upload SkySafari settings file, with size equal or less than 1MB';
    }
  }
});
export default SkySafariFiles; // To be imported in other files
// *******************************


export function skysafariFraming( skysetFile ) {

  // load files
  // ScopeFieldRotation=1.060000000000000e+02
  // DisplayCenterLon=2.024722758067027e+02
  // DisplayCenterLat=4.719440077746570e+01
  var results = [
      "ScopeFieldRotation=1.060000000000000e+02",
      "DisplayCenterLon=2.024722758067027e+02",
      "DisplayCenterLat=4.719440077746570e+01",
    ];

  var src = Assets.getText(skysetFile);
  tsxInfo(' *** skysafari: ' + skysetFile );


  var OUT = {};

  // iterate and split for
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
  tsxTrace( OUT.ra + ', ' + OUT.dec + ', ' + OUT.pa );
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


if (Meteor.isClient) {
  Meteor.subscribe('files.skySafari.all');
}

if (Meteor.isServer) {
  // Meteor.publish('files.skySafari.all', () => {
  //   return SkySafariFiles.collection.find({});
  // });
}

/*
  _id
  targetName
  target_id
  datetime
  rotatorPosition
 */


// *******************************
// Get the filters from TheSkyX
//SkySafariFiles.helpers({

  // renderDropDownFilters: function() {
  //   var filters = Filters.find().fetch();
  //   var filterArray = [];
  //   for (var i = 0; i < filters.length; i++) {
  //     filterArray.push({
  //       key: filters[i]._id,
  //       text: filters[i].name,
  //       value: filters[i].name });
  //   }
  //   return filterArray;
  // },
  // getFilterIndexFor: function(filterName) {
  //   var filter = Filters.find({name: filterName}).fetch();
  //   return filter.slot;
  // },

//});
