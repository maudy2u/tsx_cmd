import { FilesCollection } from 'meteor/ostrio:files';
//const Backups = new FilesCollection({collectionName: 'backups'});

// Used to store the sessions for a Target - the actual imaging
// check here for extras: https://github.com/VeliovGroup/Meteor-Files/wiki/Constructor
var folder = '';
if( Meteor.settings.backup_location === '' || typeof Meteor.settings.backup_location === 'undefined' ) {
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

// Need to get a file listing in the "backup" location, and add each file if
// not present
