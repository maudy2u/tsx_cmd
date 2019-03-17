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
import { Backups } from '../imports/api/backups.js';

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

import {shelljs} from 'meteor/akasha:shelljs';
var shell = require('shelljs');

var backupFolder = '';
if( Meteor.settings.backup_location === '' || typeof Meteor.settings.backup_location === 'undefined' ) {
  backupFolder = Meteor.absolutePath + '/backup/';
}
else {
  backupFolder = Meteor.settings.backup_location;
}

Meteor.startup(function () {

// *******************************
// Sample to add files
// *******************************
//   let logFolder = Meteor.absolutePath;
   // let location = logFolder + '/logs/';
   // let fileName = "2019_01_12_tsx_cmd.log";
   //
   // tsxLog(location + fileName );
   // Backups.addFile( location + fileName, {
   //   fileName: location + fileName,
   //   meta: {}
   // });
// *******************************

});

Meteor.publish('files.backups.all', function () {
  return Backups.find().cursor;
});

// server Ref: https://github.com/VeliovGroup/Meteor-Files/wiki#api
// client ref: https://github.com/VeliovGroup/Meteor-Files/blob/master/docs/react-example.md


Meteor.methods({

  RemoveFile( fid ) {
    Backups.remove({_id: fid});
    UpdateStatus( ' Backup removed file. ');
  },

  GetBackupOfDatabase() {
    tsx_SetServerState( 'tool_active', true );

    // run the shell Script
    // Run external tool synchronously
    // mongodump --uri=mongodb://127.0.0.1:3001/meteor -o ./export --excludeCollectionsWithPrefix=MeteorToys --excludeCollectionsWithPrefix=appLogsDB

    let backupLocation =  backupFolder + 'tsx_cmd_db_export';

    try {
      UpdateStatus( ' Backup starting');
      tsxLog( ' Using: ', backupLocation );
      let err = shell.mkdir( '-p', backupLocation).code;
//      err = shell.mkdir( '-p', '/tmp/tsx_cmd_db_export').code;
      tsxLog( err );
      if ( err !== 0) {
        UpdateStatus('Error: failed to create backup location. ');
        shell.exit(1);
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
      let dump = 'mongodump --port 3001 --db=meteor -o ' + backupLocation + ' --excludeCollectionsWithPrefix=MeteorToys --excludeCollectionsWithPrefix=appLogsDB'
      tsxLog( ' Executing: ', dump );
      if (shell.exec( dump ).code !== 0) {
        UpdateStatus('Error: Failed to run mongodump to create DB backup');
        // shell.exit(1); // do not exit. kills server
        return;
      }

      // *******************************
      // Is there a different development port for mongod?
      // tsxLog( ' Executing: ', 'mongodump -d tsx_cmd -o ' + backupLocation + ' --excludeCollectionsWithPrefix=MeteorToys --excludeCollectionsWithPrefix=appLogsDB' );
      // if (shell.exec('mongodump -d tsx_cmd -o ' + backupLocation + ' --excludeCollectionsWithPrefix=MeteorToys --excludeCollectionsWithPrefix=appLogsDB').code !== 0) {
      //   UpdateStatus('Error: Failed to run mongodump to create DB backup');
      //   // shell.exit(1); // do not exit. kills server
      //   return;
      // }

      tsxLog( ' Executing: ', 'tar -cf '+ backupFolder + '/export_db.tar ' + backupLocation );
      if (shell.exec('tar -cf '+ backupFolder + '/export_db.tar ' + backupLocation ).code !== 0) {
        UpdateStatus('Error: failed to tar the backup for uploading.');
        // shell.exit(1); // do not exit. kills server
        return;
      }

      tsxLog( ' Storing backup: ', backupFolder + '/export_db.tar')
      Backups.addFile( backupFolder + '/export_db.tar', {
        fileName: 'db_backup.tar',
        meta: {}
      });

      UpdateStatus( ' Backup ready.');
    }
    catch( e ) {
      UpdateStatus( ' Backup FAILED: ' + e );
    }
    finally {
      tsx_SetServerState( 'tool_active', false );
    }
  },

});
