import { FilesCollection } from 'meteor/ostrio:files';
import { tsxInfo, tsxLog, tsxErr, tsxWarn, tsxDebug, logFileForClient, AppLogsDB } from './theLoggers.js';

// check here for extras: https://github.com/VeliovGroup/Meteor-Files/wiki/Constructor
var folder = '';
if( typeof Meteor.settings.backup_location === 'undefined' || Meteor.settings.backup_location === '' ) {
  folder = Meteor.absolutePath + '/backup/';
}
else {
  folder = Meteor.settings.backup_location;
}
export const backupFolder = folder;
export const Backups = new FilesCollection({
  storagePath: backupFolder,
  collectionName: 'backups',
});

// grab npm version

if (Meteor.isServer) {
  import shelljs from 'shelljs';
  // this is equivalent to the standard node require:
  const Shelljs = require('shelljs');

  try {
    tsxInfo('   DB Backups',  backupFolder );
    let err = Shelljs.test( '-e', backupFolder ); // -e tests for valid path, -d tests for directory
    if( err != true ) {
      tsxErr( ' Backup folder file not found, creating: ' + backupFolder );
      let err = Shelljs.mkdir( '-p', backupFolder).code;
      tsxErr( err );
      if ( err !== 0) {
        tsxErr('Error: failed to create backup location: ' + err);
        return;
      }
    }
    else {
      let err = Shelljs.test( '-d', backupFolder ); // -e tests for valid path, -d tests for directory
      if( err != true ) {
        tsxErr( ' Backup path is not a valid directory: ' + backupFolder );
      }
    }
  }
  catch( e ) {
    // If on mac do nothing...
    tsxErr( ' Backup mkdir exception: ' + e );
  }
}

// Need to get a file listing in the "backup" location, and add each file if
// not present
