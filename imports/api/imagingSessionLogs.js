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
import { TakeSeriesTemplates } from './takeSeriesTemplates.js'
import { Seriess } from './seriess.js'

import {
  sessionDate,
} from './time_utils.js'


// Used to store the sessions for a Target - the actual imaging "log"
export const ImagingSessionLogs = new Mongo.Collection('imagingSessionLogs');

/*
ImagingSessionLogs = {
 */
 export function addImageReport( target ) {
   var name = '';
   var tid = '';
   var friend = '';
   if(
     target === 'Dark'
     || target === 'Bias'
     || target === 'Flat'
    )
    {
      friend = target;
      tid = target;
      name = target;
    }
    else {
        friend =    target.getFriendlyName();
        id = target._id;
        name = target.targetFindName;
    }
   const iid  = ImagingSessionLogs.insert(
     {
       ALT: 0,
       AZ: 0,
       RA: 0,
       DEC: 0,
       pointing: '',
       ANGLE: 0,
       HA: 0,
       TRANSIT: 0,
       FOCUS_POS: 0,
       sunAltitude: '',
       focusTemp: '',
       ROTATOR_POS_ANGLE: '',
       RMS_ERROR: 0,
       FOCUS_POS: '',
       tid: tid,
       targetFriendlyName: friend,
       target: name,
       sessionDate: sessionDate( new Date() ),
       created: new Date(),
       updatedAt: new Date(),
       fileName: '',
       subFrameTypes: '',
       filter: '',
       exposure: '',
       level: '',
       binning: '',
       enabled: '',
       sessionTotal: '',
       runningTotal: '',
       maxPix: '',
       avgPix: '',
     },
   );
   return iid;
 }

 export function imageReportMaxPixel( iid ) {
   // if test levels process the
   if( typeof iid !== 'undefined' || iid !== '' ) {
     var image = ImagingSessionLogs.findOne({_id: iid });
     if( typeof image !== 'undefined' || image !== '' ) {
       return image.maxPix;
    }
   }
   return -1;

 }

 export function updateImageReport( iid, name, value ) {
   var id;
   var obj = ImagingSessionLogs.findOne({_id: iid});
   if( typeof obj == 'undefined' ) {
     return NULL;
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
     }
     else if( name == 'DEC') {
       obj.DEC = value;
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
     else if( name == 'FOCUS_POS') {
       obj.FOCUS_POS = value;
     }
     else if( name == 'sunAltitude') {
       obj.sunAltitude = value;
     }
     else if( name == 'focusTemp') {
       obj.focusTemp = value;
     }
     else if( name == 'ROTATOR_POS_ANGLE') {
       obj.ROTATOR_POS_ANGLE = value;
     }
     else if( name == 'RMS_ERROR') {
       obj.RMS_ERROR = value;
     }
     else if( name == 'FOCUS_POS') {
       obj.FOCUS_POS = value;
     }
     else if( name == 'target') {
       obj.target = value;
     }
     else if( name == 'sessionDate') {
       obj.sessionDate = value;
     }
     else if( name == 'fileName') {
       obj.fileName = value;
     }
     else if( name == 'subFrameTypes') {
       obj.subFrameTypes = value;
     }
     else if( name == 'filter') {
       obj.filter = value;
     }
     else if( name == 'exposure') {
       obj.exposure = value;
     }
     else if( name == 'level') {
       obj.level = value;
     }
     else if( name == 'binning') {
       obj.binning = value;
     }
     else if( name == 'enabled') {
       obj.enabled = value;
     }
     else if( name == 'maxPix') {
       obj.maxPix = value;
     }
     else if( name == 'avgPix') {
       obj.avgPix = value;
     }

     id = ImagingSessionLogs.update({_id: obj._id}, {
       $set: {
         ALT: obj.ALT,
         AZ: obj.AZ,
         RA: obj.RA,
         DEC: obj.DEC,
         pointing: obj.pointing,
         ANGLE: obj.ANGLE,
         HA: obj.HA,
         TRANSIT: obj.TRANSIT,
         FOCUS_POS: obj.FOCUS_POS,
         sunAltitude: obj.sunAltitude,
         focusTemp: obj.focusTemp,
         ROTATOR_POS_ANGLE: obj.ROTATOR_POS_ANGLE,
         RMS_ERROR: obj.RMS_ERROR,
         FOCUS_POS: obj.FOCUS_POS,
         target: obj.target,
         sessionDate: sessionDate( new Date() ),
         updatedAt: new Date(),
         fileName: obj.fileName,
         subFrameTypes: obj.subFrameTypes,
         filter: obj.filter,
         exposure: obj.exposure,
         level: obj.level,
         rotation: obj.rotation,
         focus_pos: obj.focus_pos,
         binning: obj.binning,
         enabled: obj.enabled,
         maxPix: obj.maxPix,
         avgPix: obj.avgPix,
       }
     });
   }
   return obj;
 }

export function getSessionDates() {
  var log = ImagingSessionLogs.find({}, {  sort: { sessionDate: -1} }).fetch();
  var dates = [];
  for( var i=0; i<log.length; i ++ ) {
    var ld = log[i].sessionDate;
    var idx = dates.indexOf( ld );
    if( idx == -1 ) {
      dates.push( ld );
    }
  }
  var today = sessionDate(new Date());
  var idx = dates.indexOf( today );
  if( idx == -1 ) {
    dates.push( today );
  }

  return  dates;
}

 // Used by the TargetReports.js
 // creates structure to query the ImagingSessionLogs
 // get all items logged on date
 // find the unique subsets
 export function createImagingReportSessionDateTemplate( sDate ) {
   if( sDate == '' ) {
     return [];
   }
   var takeSeries = ImagingSessionLogs.find({sessionDate: sDate}).fetch();
   var keys = []; // target | filter | exposure
   var reportData = [];
   for( var i=0; i<takeSeries.length; i++ ) {
     var e = takeSeries[i];
     var k = e.target+'|'+e.filter+'|'+e.exposure;
     if( keys.indexOf(k)<0) {
       keys.push(k);
       reportData.push({
         key: k,
         sessionDate: e.sessionDate,
         target: e.target,
         filter: e.filter,
         exposure: e.exposure,
         sessionTotal: 0,
         runningTotal: 0,
       })
     }
   }
   return reportData;
 }

 export function getTargetReportTemplate( sDate, target ) {
   var takeSeries = TakeSeriesTemplates.findOne({_id:target.series._id});
   var report = [];
   for( var i=0; i<takeSeries.series.length; i++ ) {
     var s = Seriess.findOne({ _id:takeSeries.series[i].id});
     var idx = report.indexOf({
       target: target.targetFindName,
       subFrameType: s.frame,
       filter: s.filter,
       exposure: s.exposure,
       binning: s.binning,
     });
     if( !(idx > -1) ) {
       report.push({
         id: s._id,
         sessionDate: sDate,
         target: target.targetFindName,
         repeating: takeSeries.repeatSeries,
         subFrameType: s.frame,
         filter: s.filter,
         exposure: s.exposure,
         binning: s.binning,
         order: s.order,
         quantity: s.repeat,
         sessionTotal: 0,
         runningTotal: 0,
       })
     }
   }
   return report;
 }

 export function calcTargetFilterExposureSessionTotal( reportRow ) {
   var data = ImagingSessionLogs.find({
     sessionDate: reportRow.sessionDate,
     target: reportRow.target,
     filter: reportRow.filter,
     exposure: reportRow.exposure,
   }).fetch();
   var num = data.length;
   return num;
 }

 export function calcTargetFilterExposureRunningTotal( reportRow ) {
   var data = ImagingSessionLogs.find({
     target: reportRow.target,
     filter: reportRow.filter,
     exposure: reportRow.exposure,
   }).fetch();
   var num = data.length;
   return num;
 }


ImagingSessionLogs.helpers({
});
