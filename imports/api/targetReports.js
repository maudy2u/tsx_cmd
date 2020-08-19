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
import { TargetSessions } from './targetSessions.js'

// Used to store the sessions for a Target - the actual imaging
export const TargetReports = new Mongo.Collection('targetReports');

/*
TargetReports = {
  ALT:
  AZ:
  RA:
  DEC:
  pointing:
  ANGLE:
  HA:
  TRANSIT:
  focusPostion: focPostion,
  pointing: pointing,
  ANGLE: clsSuccess.angle,

  scale: '',
  isValid: isValid,
  direction: az,
  isDark: isDark,
  sunAltitude: sunAlt,
  focusTemp: focTemp,
  updatedAt: update,
  ready: ready,
  readyMsg: readyMsg,
};
 */

export function removeTargetReport( tid ) {
  TargetReports.remove({ target_id: tid });
}

 export function initTargetReport( tid ) {

   // Setup one to one
   var rid  = TargetReports.insert(
     {
       target_id: tid,
       ALT: 0,
       AZ: 0,
       RA: 0,
       DEC: 0,
       pointing: '',
       ANGLE: 0,
       HA: 0,
       TRANSIT: 0,
       focusPosition: 0,
       scale: 0,
       isValid: '',
       direction: '',
       isDark: '',
       sunAltitude: '',
       focusTemp: '',
       updatedAt: '',
       ready: '',
       readyMsg: '',
       ROTATOR_POS_ANGLE: '',
       maxAlt: '',
       dirty: true,
       LAT: '',
       LON: '',
     }
   );
   return rid;
 }


 export function updateTargetReport( tid, name, value ) {
   if( typeof tid == 'undefined' ) {
     return 0;
   }
   var id;
   var obj = TargetReports.findOne({target_id: tid});
   if( typeof obj == 'undefined' ) {
     var new_id = initTargetReport(tid);
     obj = TargetReports.findOne({_id: new_id});
   }
   if( typeof obj !== 'undefined') {
     if( name == 'ALT') {
       obj.ALT = value;
     }
     else if( name == 'AZ') {
       obj.AZ = value;
     }
     else if( name == 'RA') {
       obj.RA = value;
       TargetSessions.update({_id: tid} , {
         $set: {
           ra: obj.RA,
         }
       });
     }
     else if( name == 'DEC') {
       obj.DEC = value;
       TargetSessions.update({_id: tid} , {
         $set: {
           dec: obj.DEC,
         }
       });
     }
     else if( name == 'pointing') {
       obj.pointing = value;
     }
     else if( name == 'ANGLE') {
       obj.ANGLE = value;
     }
     else if( name == 'HA') {
       obj.HA = value;
     }
     else if( name == 'TRANSIT') {
       obj.TRANSIT = value;
     }
     else if( name == 'focusPosition') {
       obj.focusPosition = value;
     }
     else if( name == 'maxAlt') {
       obj.maxAlt = value;
     }
     else if( name == 'scale') {
       obj.scale = value;
     }
     else if( name == 'isValid') {
       obj.isValid = value;
     }

     // is this one deprecated?
     else if( name == 'direction') {
       obj.direction = value;
     }
     else if( name == 'isDark') {
       obj.isDark = value;
     }
     else if( name == 'sunAltitude') {
       obj.sunAltitude = value;
     }
     else if( name == 'focusTemp') {
       obj.focusTemp = value;
     }
     else if( name == 'updatedAt') {
       obj.updatedAt = value;
     }
     else if( name == 'ready') {
       obj.ready = value;
     }
     else if( name == 'dirty') {
       obj.dirty = value;
     }
     else if( name == 'readyMsg') {
       obj.readyMsg = value;
     }
     else if( name == 'ROTATOR_POS_ANGLE') {
       obj.ROTATOR_POS_ANGLE = value;
     }
     else if( name == 'LAT') {
       obj.LAT = value;
     }
     else if( name == 'RMS_ERROR') {
       obj.RMS_ERROR = value;
     }
     else if( name == 'LON') {
       obj.LON = value;
     }

     id = TargetReports.update({_id: obj._id}, {
       $set: {
         ALT: obj.ALT,
         AZ: obj.AZ,
         RA: obj.RA,
         DEC: obj.DEC,
         pointing: obj.pointing,
         ANGLE: obj.ANGLE,
         HA: obj.HA,
         TRANSIT: obj.TRANSIT,
         focusPosition: obj.focusPosition,
         scale: obj.scale,
         isValid: obj.isValid,
         direction: obj.direction,
         isDark: obj.isDark,
         sunAltitude: obj.sunAltitude,
         focusTemp: obj.focusTemp,
         updatedAt: obj.updatedAt,
         ready: obj.ready,
         readyMsg: obj.readyMsg,
         updatedAt: new Date(),
         maxAlt: obj.maxAlt,
         RMS_ERROR: obj.RMS_ERROR,
         ROTATOR_POS_ANGLE: obj.ROTATOR_POS_ANGLE,
         dirty: obj.dirty,
         LAT: obj.LAT,
         LON: obj.LON,
       }
     });
     TargetSessions.update({_id: tid} , {
       $set: {
         report: obj,
       }
     });
   }
   return obj;
 }



TargetReports.helpers({


});
