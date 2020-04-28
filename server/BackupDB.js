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
  Backups,
  backupFolder,
 } from '../imports/api/backups.js';

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
if( Meteor.settings.tsx_cmd_db === '' || typeof Meteor.settings.tsx_cmd_db === 'undefined' ) {
  tsx_cmd_db = 'meteor';
}
else {
  tsx_cmd_db = Meteor.settings.tsx_cmd_db;
}
var mongo_port = '';
if( Meteor.settings.mongo_port === '' || typeof Meteor.settings.mongo_port === 'undefined' ) {
  mongo_port = "3001";
}
else {
  mongo_port = Meteor.settings.mongo_port;
}



Meteor.startup(function () {

  // *******************************
  // check for files to load
  // *******************************
  // Backups.remove({});
  try {
    var files = Shelljs.ls( backupFolder );
    if ( files.code !== 0) {
      tsxDebug('There are no  backups: ' + files.code );
      return;
    }
    // get all files in the Backups and confirm exists
    tsxInfo( ' Integrity check of file store');
    let fileCursors = Backups.find({}, {sort: {name: 1}}).fetch();
    let display = fileCursors.map((aFile, key) => {
      let err = Shelljs.test( '-e', aFile.path );
      if( err != true ) {
        tsxDebug( ' Dropping file not found: ' + aFile.path );
        Backups.remove({ _id: aFile._id });
      }
    })
    // confirm all files in the folder and in the Backups
    tsxInfo( ' Resync file store');
    fileCursors = Backups.find({}, {sort: {name: 1}}).fetch();
    for( var s = 0; s < files.length; s ++ ) {
      var found = false;
      let display = fileCursors.map((aFile, key) => {
        let pFile = Backups.findOne({_id: aFile._id}).name;  //The "view/download" link
        if( pFile == files[s] || pFile == 'undefined' ) {
          found = true;
          return;
        }
      })
      // if not found then add it in
      if( found == false ) {
        tsxDebug( ' resync ' + backupFolder +'' + files[s] );
        Backups.addFile( backupFolder +'' + files[s], {
          name: files[s],
          meta: {}
        });
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

Meteor.publish('files.backups.all', function () {
  return Backups.find().cursor;
});

// server Ref: https://github.com/VeliovGroup/Meteor-Files/wiki#api
// client ref: https://github.com/VeliovGroup/Meteor-Files/blob/master/docs/react-example.md


Meteor.methods({

  UploadBackupOfDatabase( fid, name ) {

    UpdateStatus( ' Upload database file. ');
  },

  RemoveFile( fid ) {
    Backups.remove({_id: fid});
    UpdateStatus( ' Backup removed file. ');
  },

  RenameFile( fid, fName ) {
    let aFile = Backups.findOne({_id: fid});
    let oFile = aFile.path;
    let nFile = aFile.path.replace( aFile.name, fName );
    let err = Shelljs.mv( oFile, nFile ).code;
    if ( err !== 0) {
      UpdateStatus('Error: failed mv file: ' + err);
      return;
    }

    UpdateStatus( ' File found: ' + aFile.name);
    Backups.update( fid, {
      $set: {
        name: fName,
        path: nFile,
      },
    });
    aFile = Backups.findOne({_id: fid});
    UpdateStatus( ' File renamed: ' + aFile.name);
  },

  RestoreFile( fid ) {
    let aFile = Backups.findOne({_id: fid});
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

    try {
      // *******************************
      // Is there a different development port for mongod?
      // mongorestore --drop -d tsx_cmd "${install_dir}/import/export/tsx_cmd"

      let dump = 'mongorestore --drop --port=' + mongo_port + ' -d '+ tsx_cmd_db + ' ' + restoreLocation;
      tsxLog( ' Executing: ', dump );
      if (Shelljs.exec( dump ).code !== 0) {
        UpdateStatus('Error: Failed to run mongorestore to restore DB backup');
        // Shelljs.exit(1); // do not exit. kills server
        return;
      }

      UpdateStatus( ' Database restored: ' + aFile.name);
    }
    catch( e ) {
      UpdateStatus( ' Restore FAILED: ' + e );
    }
    finally {
      tsx_SetServerState( tsx_ServerStates.tool_active, false );
    }
  },

  GetBackupOfDatabase() {
    tsx_SetServerState( tsx_ServerStates.tool_active, true );

    // run the shell Script
    // Run external tool synchronously
    // mongodump --uri=mongodb://127.0.0.1:3001/meteor -o ./export --excludeCollectionsWithPrefix=MeteorToys --excludeCollectionsWithPrefix=appLogsDB

    let backupLocation =  backupFolder + 'tsx_cmd_db_export';

    try {
      UpdateStatus( ' Backup starting');
      tsxLog( ' Using: ', backupLocation );
      let err = Shelljs.mkdir( '-p', backupLocation).code;
//      err = shell.mkdir( '-p', '/tmp/tsx_cmd_db_export').code;
      tsxLog( err );
      if ( err !== 0) {
        UpdateStatus('Error: failed to create backup location: ' + err);
        return;
      }
    }
    catch( e ) {
      // If on mac do nothing...
      UpdateStatus( ' Backup mkdir exception: ' + e );
    }
    try {

      // *******************************
      // Is there a different development port for mongod?
      let dump = 'mongodump --port ' + mongo_port + ' --db='+ tsx_cmd_db +' -o ' + backupLocation + ' --excludeCollectionsWithPrefix=MeteorToys --excludeCollectionsWithPrefix=appLogsDB --forceTableScan'
      tsxLog( ' Executing: ', dump );
      if (Shelljs.exec( dump ).code !== 0) {
        UpdateStatus('Error: Failed to run mongodump to create DB backup');
        // Shelljs.exit(1); // do not exit. kills server
        return;
      }

      // *******************************
      // Is there a different development port for mongod?
      // tsxLog( ' Executing: ', 'mongodump -d tsx_cmd -o ' + backupLocation + ' --excludeCollectionsWithPrefix=MeteorToys --excludeCollectionsWithPrefix=appLogsDB' );
      // if (Shelljs.exec('mongodump -d tsx_cmd -o ' + backupLocation + ' --excludeCollectionsWithPrefix=MeteorToys --excludeCollectionsWithPrefix=appLogsDB').code !== 0) {
      //   UpdateStatus('Error: Failed to run mongodump to create DB backup');
      //   // Shelljs.exit(1); // do not exit. kills server
      //   return;
      // }

      let tod = fileNameDate( new Date() );
      let fName = 'db_export_'+tod+'.tar'

      tsxLog( ' Executing: ', 'tar -C '+ backupLocation +' -cf '+ backupFolder + fName + ' ./' );
      // tar -C /Users/stephen/Documents/code/tsx_cmd/backup/tsx_cmd_db_export/ -cf /Users/stephen/Documents/code/tsx_cmd/backup/export_db.tar .
      if (Shelljs.exec('tar -C '+ backupLocation + ' -cf '+backupFolder+ fName + ' ./' ).code !== 0) {
        UpdateStatus('Error: failed to tar the backup for uploading.');
        // Shelljs.exit(1); // do not exit. kills server
        return;
      }

      tsxLog( ' Storing backup: ', backupFolder + fName )
      Backups.addFile( backupFolder + fName, {
        name: fName,
        meta: {}
      });
      if (Shelljs.exec('rm -rf '+ backupLocation ).code !== 0) {
        UpdateStatus('Error: failed removing backup location.');
        // Shelljs.exit(1); // do not exit. kills server
        return;
      }

      UpdateStatus( ' Backup ready.');
    }
    catch( e ) {
      UpdateStatus( ' Backup FAILED: ' + e );
    }
    finally {
      tsx_SetServerState( tsx_ServerStates.tool_active, false );
    }
  },

});
