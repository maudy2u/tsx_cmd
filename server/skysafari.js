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
import {
  SkySafariFiles,
  skySafariFilesFolder,
  skysafariFraming,
  convertLon2RA,
  convertLat2Dec,
  convertORIENT2PA,
} from '../imports/api/skySafariFiles.js';
import {
  TargetSessions,
} from '../imports/api/targetSessions.js';

import {
  tsxInfo,
  tsxLog,
  tsxErr,
  tsxWarn,
  tsxDebug,
} from '../imports/api/theLoggers.js';
import {
  tsx_UpdateDevice,
  tsx_ServerStates,
  tsx_SetServerState,
  tsx_GetServerState,
  tsx_GetServerStateValue,
  UpdateStatus,
  UpdateStatusWarn,
  UpdateStatusErr,
} from '../imports/api/serverStates.js'

import {
  tsx_feeder,
  tsx_cmd,
  tsx_has_error,
} from './tsx_feeder.js'

// grab npm version
import shelljs from 'shelljs';
// this is equivalent to the standard node require:
const Shelljs = require('shelljs');

// if these variables are defined then use their settings... else it is dev mode
//  "tsx_cmd_db": "tsx_cmd",
//  "mongo_port": "27017"
var tsx_cmd_db = '';
if( typeof Meteor.settings.tsx_cmd_db === 'undefined' || Meteor.settings.tsx_cmd_db === ''  ) {
  tsx_cmd_db = 'meteor';
}
else {
  tsx_cmd_db = Meteor.settings.tsx_cmd_db;
}
var mongo_port = '';
if( typeof Meteor.settings.mongo_port === 'undefined' || Meteor.settings.mongo_port === '' ) {
  mongo_port = "3001";
}
else {
  mongo_port = Meteor.settings.mongo_port;
}




Meteor.startup(function () {

  // *******************************
  // check for files to cleanup
  // *******************************
  // SkySafariFiles.remove({});
  try {
    var files = Shelljs.ls( skySafariFilesFolder );
    if ( files.code !== 0) {
      tsxInfo('There are no setting.skysets: ' + files.code );
      return;
    }
    // if file in datbase no longer exists remove from database
    tsxInfo( ' Integrity check of file store');
    let fileCursors = SkySafariFiles.find({}, {sort: {name: 1}}).fetch();
    let display = fileCursors.map((aFile, key) => {
      let err = Shelljs.test( '-e', aFile.path );
      if( err != true ) {
        tsxDebug( ' Dropping entry not found: ' + aFile.path );
        SkySafariFiles.remove({ _id: aFile._id });
      }
    })
    // Any files in the folder not in database needs to be removedin the SkySafariFiles
    tsxInfo( ' Resync file store');
    fileCursors = SkySafariFiles.find({}, {sort: {name: 1}}).fetch();
    for( var s = 0; s < files.length; s ++ ) {
      var found = false;
      let display = fileCursors.map((aFile, key) => {
        tsxInfo( ' Match? ' + aFile._id + '.' + aFile.extension +'\n' + files[s] );

        if( (aFile._id + '.' + aFile.extension) == files[s] || aFile == 'undefined' ) {
          found = true;
          return;
        }
      })
      // if not found then add it in
      if( found == false ) {
        tsxDebug( ' removed ' + skySafariFilesFolder +'' + files[s] );
        let err = Shelljs.rm( skySafariFilesFolder+'/'+files[s] ).code;
      }
    }
  }
  catch( e ) {
    // If on mac do nothing...
    UpdateStatusErr( ' Could not resync files: ' + e );
  }

});

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

  return yyyy +'_'+ ('0'  + mm).slice(-2) +'_'+ ('0'  + dd).slice(-2)+'_HH'+ ('0'  + HH).slice(-2)+'_MM'+ ('0'  + MM).slice(-2)+'_SS'+ ('0'  + SS).slice(-2);
}

// server Ref: https://github.com/VeliovGroup/Meteor-Files/wiki#api
// client ref: https://github.com/VeliovGroup/Meteor-Files/blob/master/docs/react-example.md
Meteor.publish('files.skysafari.all', function () {
  return SkySafariFiles.find().cursor;
});



Meteor.methods({

  // **************************************************************
  AssignSkySafariToTarget( tid, sid ) {
    var skyfile = SkySafariFiles.findOne({_id: sid });
    var skyset = skysafariFraming(skyfile.path);
    var t = TargetSessions.findOne({_id: tid });
    console.log(
        ' ###'
      + ' path=' + skyfile.path
      + ', friendly=' + skyset.name
      + ', tid=' + tid
      + ', sid=' + sid
      + ', tName=' + t.targetFindName
    );
    TargetSessions.upsert( {_id: tid }, {
      $set:{
        targetFindName: skyset.ra + ', ' + skyset.dec,
        friendlyName: skyfile.name,
        setSkysetFile_id: sid,
        angle: skyset.pa,
      }
    });

    console.log( ' *** ' + skyfile.name + ', '+skyset.ra + ', ' + skyset.dec + ', ' + skyset.pa );
    return skyset;
  },

  RemoveSkySafariFile( fid ) {
    SkySafariFiles.remove({_id: fid});
    UpdateStatus( ' SkySafari removed file. ');
  },

  RenameSkySafariFile( fid, fName ) {
    let aFile = SkySafariFiles.findOne({_id: fid});
    let oFile = aFile.path;
    let nFile = aFile.path.replace( aFile.name, fName );
    let err = Shelljs.mv( oFile, nFile ).code;
    if ( err !== 0) {
      UpdateStatus('Error: failed mv file: ' + err);
      return;
    }

    UpdateStatus( ' File found: ' + aFile.name);
    SkySafariFiles.update( fid, {
      $set: {
        name: fName,
        path: nFile,
      },
    });
    aFile = SkySafariFiles.findOne({_id: fid});
    UpdateStatus( ' File renamed: ' + aFile.name);
  },

  RestoreSkySafariFile( fid ) {
    let aFile = SkySafariFiles.findOne({_id: fid});
    UpdateStatus( ' File found: ' + aFile.name);
    let restoreLocation = '/tmp/tsx_cmd_import/'+tsx_cmd_db;
    try {
      UpdateStatus( ' restore starting');
      tsxLog( ' Using: ', restoreLocation );
      let err = Shelljs.mkdir( '-p', restoreLocation ).code;
      tsxLog( err );
      if ( err !== 0) {
        UpdateStatus('Error: failed to create import location: ' + err);
        return;
      }
      err = Shelljs.exec( 'tar -C ' +restoreLocation+ ' -xf ' +  aFile.path + ' --strip-components=2').code;
      tsxLog( err );
      if ( err !== 0) {
        UpdateStatus('Error: failed to extract to import location: ' + err);
        return;
      }
    }
    catch( e ) {
      // If on mac do nothing...
      UpdateStatus( ' Restore exception: ' + e );
    }
  },

});
