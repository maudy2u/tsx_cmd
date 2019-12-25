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

// get time play is clicked
export const SessionReports = new Mongo.Collection('sessionReports');

/*
  The purpose of the session report is to record the images taken, after play is clicked
  for each target.

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
export function addSesionReport() {
  const id  = SessionReports.insert(
    {
      subFrameTypes: "Flat",
      filter: "",
      exposure: 0,
      quantity: 0,
      level: 0,
      rotation: "",
      order: 0,
      binning: 1,
      enabled: true,
    },
  );
  return id;
}

export function updateSessionReport( fid, name, value ) {
  var obj = CalibrationFrames.findOne({_id:fid});
  if( typeof obj != 'undefined') {
    if( name == 'subFrameTypes') {
      obj.subFrameTypes = value;
    }
    else if( name == 'filter') {
      obj.filter = value;
    }
    else if( name == 'exposure') {
      obj.exposure = value;
    }
    else if( name == 'quantity') {
      obj.quantity = value;
    }
    else if( name == 'level') {
      obj.level = value;
    }
    else if( name == 'rotation') {
      obj.rotation = value;
    }
    else if( name == 'order') {
      obj.order = value;
    }
    else if( name == 'binning') {
      obj.binning = value;
    }
    else if( name == 'enabled') {
      obj.enabled = value;
    }
    SessionReports.update({_id: obj._id}, {
      $set: {
        subFrameTypes: obj.subFrameTypes,
        filter: obj.filter,
        exposure: obj.exposure,
        quantity: obj.quantity,
        level: obj.level,
        rotation: obj.rotation,
        order: obj.order,
        binning: obj.binning,
        enabled: obj.enabled,
      }
    });
  }
}

SessionReports.helpers({
});
