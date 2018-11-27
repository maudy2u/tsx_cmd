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
import { TheSkyXInfos } from './theSkyXInfos.js'
// import SimpleSchema from 'simple-schema';

// Used to store the sessions for a Target - the actual imaging
export const TargetSessions = new Mongo.Collection('targetSessions');

export function addNewTargetSession() {

  // get defaults
  var clsFilter = TheSkyXInfos.findOne({name: 'defaultFilter'}).value;

  const id  = TargetSessions.insert(
    {
      name: '!New Target',
      targetFindName: '!New Target',
      targetImage: '',
      description: '',
      enabledActive: false,
      isCalibrationFrames: false,
      series: {
      },
      progress: [
  //            {_id: seriesId, taken:0},
      ],
      report_d: '',
      ra: '',
      dec: '',
      angle: '',
      rotator_position: '',
      scale: '',
      coolingTemp: '',

  /*
  *******************************
  #todo Need to work on the loading of the defaults properly
  */
      // coolingTemp: TheSkyXInfos.findOne({name: 'defaultCoolTemp'}),
      clsFilter: TheSkyXInfos.findOne({name: 'defaultFilter'}).value,
      focusFilter: TheSkyXInfos.findOne({name: 'defaultFilter'}).value,
      foccusSamples: '',
      focusBin: '',
      focusTarget: '',
      focusExposure: TheSkyXInfos.findOne({name: 'defaultFocusExposure'}).value,
      guideExposure: '',
      guideDelay: '',
      startTime: TheSkyXInfos.findOne({name: 'defaultStartTime'}).value,
      stopTime: TheSkyXInfos.findOne({name: 'defaultStopTime'}).value,
      priority: TheSkyXInfos.findOne({name: 'defaultPriority'}).value,
      tempChg: TheSkyXInfos.findOne({name: 'defaultFocusTempDiff'}).value,
      currentAlt: 0, // set to zero for now.
      minAlt: TheSkyXInfos.findOne({name: 'defaultMinAlt'}).value,
      completed: false,
      createdAt: new Date(),
      enableMeridianFlip: TheSkyXInfos.findOne({name: 'defaultMeridianFlip'}).value,
      // startTime: '',
      // stopTime: '',

    }
  );
  return id;
}
// This code only runs on the server
// Meteor.publish('tsx.ip', function tsxIpPublication() {
//   var ip = TheSkyXInfos.findOne().ip().text;
//   console.log('FOund ip: ' + ip);
//   return ip;
// });
// Meteor.publish('tsxPort', function tsxPortPublication() {
//   return TheSkyXInfos.findOne().port().text;
// });

/*
name: '',
targetFindName: '',
targetImage: '',
description: '',
enabledActive: false,
series: {
},
progress: [
//            {_id: seriesId, taken:0},
],
ra: '',
dec: '',
angle: '',
scale: '',
coolingTemp: '',

*******************************
#todo Need to work on the loading of the defaults properly
// coolingTemp: TheSkyXInfos.findOne({name: 'defaultCoolTemp'}),
clsFliter: '',
focusFliter: '',
foccusSamples: '',
focusBin: '',
guideExposure: '',
guideDelay: '',
priority: '',
enableMeridianFlip: TheSkyXInfos.findOne({name: 'defaultMeridianFlip'}),
startTime: '',
stopTime: '',
// startTime: TheSkyXInfos.findOne({name: 'defaultStartTime'}),
// stopTime: TheSkyXInfos.findOne({name: 'defaultSopTime'}),
tempChg: '',
minAlt: '',
// tempChg: TheSkyXInfos.findOne({name: 'defaultFocusTempDiff'}),
// minAlt: TheSkyXInfos.findOne({name: 'defaultMinAlt'}),
currentAlt: 0, // set to zero for now.
completed: false,
createdAt: new Date(),

 */

TargetSessions.helpers({

  totalImagesPlanned: function() {
    var totalPlannedImages = 0;
    var totalTakenImages = 0;
    var target = this;

    var seriesId = target.series._id;
    var takeSeries = TakeSeriesTemplates.findOne({_id:seriesId});

    if( typeof takeSeries == "undefined") {
      return 100; // do not try to process
    }

    for (var i = 0; i < takeSeries.series.length; i++) {
      var series = takeSeries.series[i];

      if( typeof series == "undefined") {
        return 100; // do not try to process
      }

      var item = Seriess.findOne({_id:series.id}); //.fetch();
      if( typeof item == "undefined") {
        return 100; // do not try to process
      }

      totalPlannedImages = totalPlannedImages + Number(item.repeat);
    }
    // console.log('Planned: ' + totalPlannedImages);
    return totalPlannedImages;
  },

  totalImagesTaken: function() {
    var totalTakenImages = 0;
    var target = this;

    var progress = target.progress;
    if( typeof progress == 'undefined') {
      return 0;
    }
    for (var j = 0; j < progress.length; j++) {
      totalTakenImages = totalTakenImages + progress[j].taken;
    }
    // console.log('Taken: ' + totalTakenImages);
    return totalTakenImages;
  },

  calcProgress: function() {
    var taken = this.totalImagesTaken();
    var planned = this.totalImagesPlanned();

    return taken/planned;

  },

  takenImagesFor: function(seriesId) {
    var taken = 0;
    var progress = this.progress;
    if( typeof progress == 'undefined') {
      return taken;
    }
    for (var i = 0; i < progress.length; i++) {
      if (progress[i]._id == seriesId ) {
        taken = progress[i].taken;
        break;
      }
    }
    return taken;
  },

  resetProgress: function(series) {
    var progress = this.progress;
    for (var i = 0; i < progress.length; i++) {
      if (progress[i]._id == series._id ) {
        this.progress[i] = [];
        break;
      }
    }
  },

  incrementTakenFor: function(seriesId) {
    var taken = 0;
    var progress = this.progress;
    if( typeof progress != 'undefined') {
      // increment
      for (var i = 0; i < progress.length; i++) {
        if (progress[i]._id == seriesId ) {
          progress[i].taken = progress[i].taken + 1;
          taken = progress[i].taken;
          TargetSessions.update({_id: this._id}, {
            $set: {
              progress: progress[i],
            }
          });
        }
      }
    }

    return taken;
  }

});
