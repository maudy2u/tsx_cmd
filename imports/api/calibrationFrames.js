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

export const CalibrationFrames = new Mongo.Collection('calibrationFrames');

export function calibrationTypes() {
  var arr = [];
  arr.push('Flat' );
  arr.push( 'Dark' );
  arr.push( 'Bias' );
  return arr;
};

/*
  CalibrationFrames = {
    subFrameTypes: '',
    filter: '',
    exposure:  '',
    quantity: '',
    level: '',
    rotation: '',
  };
*/
// get defaults
// e.g. var clsFilter = TheSkyXInfos.findOne({name: 'defaultFilter'}).value;
export function addCalibrationFrame() {
  const id  = CalibrationFrames.insert(
    {
      subFrameTypes: "Flat",
      filter: "",
      exposure: 0,
      quantity: 0,
      level: 0,
      rotation: "",
      order: 0,
      binning: 1,
    },
  );
  return id;
}

export function updateCalibrationFrame( fid, name, value ) {
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
    CalibrationFrames.update({_id: fs._id}, {
      $set: {
        subFrameTypes: obj.subFrameTypes,
        filter: obj.filter,
        exposure: obj.exposure,
        quantity: obj.quantity,
        level: obj.level,
        rotation: obj.rotation,
        order: obj.order,
        binning: obj.binning,
      }
    });
  }
}

CalibrationFrames.helpers({
});
