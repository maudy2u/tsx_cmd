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
import {
  initTargetReport,
  resetTargetReport,
  TargetReports,
} from './targetReports.js'
import { Seriess } from './seriess.js'
import { TheSkyXInfos } from './theSkyXInfos.js'
// import SimpleSchema from 'simple-schema';

// Used to store the sessions for a Target - the actual imaging
export const TargetSessions = new Mongo.Collection('targetSessions');

export function addNewTargetSession() {

  // get defaults
  var clsFilter = TheSkyXInfos.findOne({name: 'defaultFilter'}).value;
  var startT = TheSkyXInfos.findOne({name: 'defaultStartTime'}).value;
  var stopT = TheSkyXInfos.findOne({name: 'defaultStopTime'}).value;
  var FOCSEXP = TheSkyXInfos.findOne({name: 'defaultFocusExposure'}).value;
  var FOCSFILTER = TheSkyXInfos.findOne({name: 'defaultFilter'}).value;

  const tid  = TargetSessions.insert(
    {
      name: '!New Target',
      targetFindName: '!New Target',
      targetImage: '',
      description: '',
      friendlyName: '',
      enabledActive: false,
      isCalibrationFrames: false,
      series: {
//        _id: '',
//        value: '',
      },
      progress: [
  //            {_id: seriesId, taken:0},
      ],
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
      focusFilter: FOCSFILTER,
      foccusSamples: '',
      focusBin: '',
      focusTarget: '',
      focusExposure: FOCSEXP,
      guideExposure: '',
      guideDelay: '',
      startTime: startT,
      stopTime: stopT,
      priority: TheSkyXInfos.findOne({name: 'defaultPriority'}).value,
      tempChg: TheSkyXInfos.findOne({name: 'defaultFocusTempDiff'}).value,
      currentAlt: 0, // set to zero for now.
      minAlt: TheSkyXInfos.findOne({name: 'defaultMinAlt'}).value,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      enableMeridianFlip: TheSkyXInfos.findOne({name: 'defaultMeridianFlip'}).value,

      skysafariFile_id: '',
      report: '',
    }
  );
  initTargetReport( tid );
  return tid;
}

export function updateTargetSession( org ) {

  TargetSessions.update( {_id: org._id}, {
    $set:
      {
      name: org.name,
      targetFindName: org.targetFindName,
      targetImage: org.targetImage,
      description: org.description,
      friendlyName: org.friendlyName,
      enabledActive: org.enabledActive,
      isCalibrationFrames: org.isCalibrationFrames,
      series: org.series,

      progress: org.progress,
      ra: org.ra,
      dec: org.dec,
      angle: org.angle,
      rotator_position: org.rotator_position,
      scale: org.scale,
      coolingTemp: org.coolingTemp,
      clsFilter: org.clsFilter,
      focusFilter: org.focusFilter,
      foccusSamples: org.foccusSamples,
      focusBin: org.focusBin,
      focusTarget: org.focusTarget,
      focusExposure: org.focusExposure,
      guideExposure: org.guideExposure,
      guideDelay: org.guideDelay,
      startTime: org.startTime,
      stopTime: org.stopTime,
      priority: org.priority,
      tempChg: org.tempChg,
      currentAlt: org.currentAlt, // set to zero for now.
      minAlt: org.minAlt,
      completed: org.completed,
      createdAt: org.createdAt,
      updatedAt: new Date(),

      enableMeridianFlip: org.enableMeridianFlip,
      skysafariFile_id: org.skysafariFile_id,
      report: org.report,
      }
    }
  );
  return;
}

export function copyTarget( org ) {
  // get the id for the new object
  const tid = TargetSessions.insert(
    {
      name: org.name,
      targetFindName: org.targetFindName,
      targetImage: org.targetImage,
      description: 'DUPLICATED: ' + org.description,
      enabledActive: org.enabledActive,
      isCalibrationFrames: org.isCalibrationFrames,
      series: org.series,

      progress: org.progress,
      ra: org.ra,
      dec: org.dec,
      angle: org.angle,
      rotator_position: org.rotator_position,
      scale: org.scale,
      coolingTemp: org.coolingTemp,
      clsFliter: org.clsFliter,
      focusFliter: org.focusFliter,
      foccusSamples: org.foccusSamples,
      focusBin: org.focusBin,
      focusTarget: org.focusTarget,
      focusExposure: Number(this.props.target.focusExposure),
      guideExposure: org.guideExposure,
      guideDelay: org.guideDelay,
      startTime: org.startTime,
      stopTime: org.stopTime,
      priority: org.priority,
      tempChg: org.tempChg,
      currentAlt: org.currentAlt,
      minAlt: org.minAlt,
      completed: org.completed,
      createdAt: org.createdAt,
      updatedAt: new Date(),

      enableMeridianFlip: org.enableMeridianFlip,
      skysafariFile_id: org.skysafariFile_id,
      report: org.report,
    }
  )

  return tid;
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

if (Meteor.isServer) {
  // need to ensure there is a report
  TargetReports.remove({});
  // var targets = TargetSessions.find({}).fetch();
  // for( var i=0; i<targets.length; i++ ) {
  //   var rid = initTargetReport(targets[i]._id);
  //   var obj = TargetReports.findOne({_id: rid});
  //   TargetSessions.update({_id: targets[i]._id} , {
  //     $set: {
  //       report: obj,
  //     }
  //   });
  // }
}


TargetSessions.helpers({

  getFriendlyName: function() {
    var friendly = '';
    if( typeof this.friendlyName != 'undefined' && this.friendlyName != '' ) {
      friendly = this.friendlyName;
    }
    else {
      friendly = this.targetFindName;
    }
    return friendly;
  },

  takeSeries: function() {
    var taken = this.totalImagesTaken();
    var planned = this.totalImagesPlanned();

    var series = this.series;

    return taken/planned;

  },

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
