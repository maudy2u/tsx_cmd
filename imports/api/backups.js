import { FilesCollection } from 'meteor/ostrio:files';
this.Backups = new FilesCollection({collectionName: 'backups'});

// Used to store the sessions for a Target - the actual imaging
/*export const Backups = new FilesCollection( {
  collectionName: 'backups'
  , allowClientCode: true, // Required to let you remove uploaded file
  onBeforeUpload(file) {
    // Allow upload files under 10MB, and only in png/jpg/jpeg formats
    if (file.size <= 1048576 ) {
      return true;
    } else {
      return 'Please upload file with size equal or less than 1MB';
    }
  }
});
*/
//export default Backups; // To be imported in other files
