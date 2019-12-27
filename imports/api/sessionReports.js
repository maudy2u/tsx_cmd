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
import { TakeSeriesTemplates } from './takeSeriesTemplates.js'
import { Seriess } from './seriess.js'

import {
  sessionDate,
} from './time_utils.js'

// get time play is clicked
export const SessionReports = new Mongo.Collection('sessionReports');

/*
  The purpose of the session report is to record the images taken, after play is clicked
  for each target.

  CURRENT
  report.push({
    target: target.targetFindName,
    subFrameType: s.frame,
    filter: s.filter,
    exposure: s.exposure,
    binning: s.binning,
    order: s.order,
    repeat: s.repeat,
    sessionDate: this.sessionDate,
    sessionTotal: 0,
    runningTotal: 0,
  })
*/

// Used by the TargetReports.js
// creates structure to query the ImagingSessionLogs
export function getTargetReportTemplate( sessionDate, target ) {
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
        sessionDate: sessionDate,
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

/*
  FUTURE

  SessionReports = {
    id: '',
    date_time: '',
    filename: '' // file name of the image
    target_id: '', // may not use as targets can "disappear"
    target_description: '',
    target: '', // the file name used find the target
    targetName:  '',
    series_details: '', // get from the series used
    fov: '', // perhaps get from the "cls", which provides the FOV
    rotator_pos: '',
    camera_gain: '',
    camera_offset: '',
    camera_temp: '',
    filter: '',
    exposure: '',
    running_total: '', // use the target_id... to get a running total
    RA: '', // recorded as of the image
    DEC: '', // recorded as of the image
    ALT: '', // recorded as of the image
    AZ: '', // recorded as of the image
  };
*/
// get defaults
// e.g. var clsFilter = TheSkyXInfos.findOne({name: 'defaultFilter'}).value;
// removing quantity... use report to calculate
export function createSesionReport() {
  const id  = SessionReports.insert(
    {
      sessionDate: sessionDate(new Date() ),
      timestamp: '',
      subFrameTypes: "Flat",
      filter: '',
      exposure: 0,
      rotator_pos_ang: '',
      focus_pos: '',
      order: 0,
      binning: 1,
      level: 0,
      enabled: true,
    },
  );
  return id;
}

export function addSessionImageReport(
  target,
  subFrameTypes,
  filter,
  exposure,
  focus_pos,
  binning
) {
  var sid = createSesionReport();
  const id  = SessionReports.update( {_id:sid }, {
    $set: {
      timeStamp: new Date(),
      target: target,
      subFrameTypes: subFrameTypes,
      filter: filter,
      exposure: exposure,
      focus_pos: focus_pos,
      binning: binning,
      rotator_pos_ang: 'NA',
    }
  });
}

export function getSessionData( date ) {
  var session = sessionDate( date );
  var data = SessionReports.find({ sessionDate: session }).fetch();
  return data;
}

export function getSessionTargets( date ) {
  var data = getSessionDate ( date );
  var targets = [];
  var tFilters = [];
  var report = [];

  // get the targets possible
  for( var t=0; t<data.length; t++ ) {
    var target = data[t].target;
    if( targets.indexOf(target) > -1 ) {
      targets.push( target );
      // get the filters for session target
      var filters = SessionReports.find({ sessionDate: session, target:target }).fetch();
      for( var f=0; f< filters.length; f ++ ) {
        var filter = filters[f].filter;
        if( tFilters.indexOf({target: target, filter:filter}) > -1 ) {
          tFilters.push( {
            target: target,
            filter: filter
          });
          var exps = SessionReports.find({ sessionDate: session, target:target, filter:filter }).fetch();
          for( var e=0; e< exps.length; f ++ ) {
            var exp = exps[f].exposure;
            if( report.indexOf({target: target, filter:filter, exposure:exp}) > -1 ) {
              report.push( {
                target: target,
                filter: filter,
                exposure:exp,
               });
            }
          }
        }
      }
    }
  }
}

export function updateSessionReport( fid, name, value ) {
  var obj = SessionsReports.findOne({_id:fid});
  if( typeof obj != 'undefined') {
    if( name == 'subFrameTypes') {
      obj.subFrameTypes = value;
    }
    else if( name == 'target') {
      obj.target = value;
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
    else if( name == 'rotator_pos_ang') {
      obj.rotator_pos_ang = value;
    }
    else if( name == 'focus_pos') {
      obj.focus_pos = value;
    }
    else if( name == 'binning') {
      obj.binning = value;
    }
    else if( name == 'enabled') {
      obj.enabled = value;
    }
    SessionReports.update({_id: obj._id}, {
      $set: {
        target: obj.target,
        subFrameTypes: obj.subFrameTypes,
        filter: obj.filter,
        exposure: obj.exposure,
        level: obj.level,
        rotation: obj.rotation,
        focus_pos: obj.focus_pos,
        binning: obj.binning,
        enabled: obj.enabled,
      }
    });
  }
}

SessionReports.helpers({
});
