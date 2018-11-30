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

import { Mongo } from 'meteor/mongo';
// Used to store the filters currently available/active on TSX
export const TargetAngles = new Mongo.Collection('targetAngles');
import { Random } from 'meteor/random';
import { tsxInfo, tsxLog, tsxErr, tsxWarn, tsxDebug, logFileForClient, AppLogsDB } from './theLoggers.js';



/*
  _id
  targetName
  target_id
  datetime
  rotatorPosition
 */

 export function recordRotatorPosition( targetName, rotatorPostion ) {
   if( typeof targetName == 'undefined' || typeof rotatorPostion == 'undefined') {
     return;
   }
   tsxDebug(' create TargetAngles: ' + targetName);
   var dts = new Date();
   const id = TargetAngles.upsert( {targetName: targetName, rotatorPostion: rotatorPostion}, {
     $set: {
       datetime: dts,
      }
   });
   return id;
 }

 export function renderDropDownAngles() {
   var angles = TargetAngles.find({},{ sort: { datetime: -1, targetName: 1 } }).fetch();
   var items = [];
   items.push({ // empty one
     key: Random.id(),
     text: '',
     value: ''
   });
   for (var i = 0; i < angles.length; i++) {
     items.push({
       key: angles[i]._id,
       text: angles[i].targetName + ', ' + angles[i].rotatorPostion,
//       value: angles[i].targetName + ', ' + angles[i].rotatorPostion
       value: angles[i].rotatorPostion
     });
   }
   return items;
 };

// *******************************
// Get the filters from TheSkyX
TargetAngles.helpers({

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
