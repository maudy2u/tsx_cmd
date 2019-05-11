import { FilesCollection } from 'meteor/ostrio:files';
//const Backups = new FilesCollection({collectionName: 'backups'});

// Used to store the sessions for a Target - the actual imaging
export const Backups = new FilesCollection({collectionName: 'backups'});

//export default Backups; // To be imported in other files
