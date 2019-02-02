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
import SimpleSchema from 'simpl-schema';
import { FilesCollection } from 'meteor/ostrio:files';

// Used to store the filters currently available/active on TSX
import { Random } from 'meteor/random';
import { tsxInfo, tsxLog, tsxErr, tsxWarn, tsxDebug, logFileForClient, AppLogsDB } from './theLoggers.js';

const SkySafariFiles = new FilesCollection({
  collectionName: 'skySafari',
  allowClientCode: true, // Required to let you remove uploaded file
  onBeforeUpload(file) {
    // Allow upload files under 10MB, and only in png/jpg/jpeg formats
    if (file.size <= 1048576 && /skyset/i.test(file.ext)) {
      return true;
    } else {
      return 'Please upload SkySafari settings file, with size equal or less than 1MB';
    }
  }
});
export default SkySafariFiles; // To be imported in other files

SimpleSchema.setDefaultMessages({
  initialLanguage: 'en',
  messages: {
    en: {
      uploadError: '{{value}}', //File-upload
    },
  }
});

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
SkySafariFiles.helpers({

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

});
