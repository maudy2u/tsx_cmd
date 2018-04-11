import { Mongo } from 'meteor/mongo';
import { TakeSeriesTemplates } from './takeSeriesTemplates.js'
import { Seriess } from './seriess.js'
// import SimpleSchema from 'simple-schema';

// Used to store the sessions for a Target - the actual imaging
export const TargetSessions = new Mongo.Collection('targetSessions');

// TargetSessions.schema = new SimpleSchema({
//   name: {type: String},
//   targetFindName: {type: String},
//   targetImage: {type: String},
//   description: {type: String},
//   takeSeries: {type: Array},
//   ra: {type: Number, defaultValue: 0},
//   dec: {type: Number, defaultValue: 0},
//   angle: {type: Number, defaultValue: 0},
//   scale: {type: Number, defaultValue: 0},
//   coolingTemp: {type: Number, defaultValue: 0},
//   clsFliter: {type: String},
//   focusFliter: {type: String},
//   focusSamples: {type: Number, defaultValue: 0},
//   focusBin: {type: Number, defaultValue: 0},
//   guideExposure: {type: Number, defaultValue: 0},
//   guideDelay: {type: Number, defaultValue: 0},
//   startTime: {type: Date, defaultValue: 0},
//   stopTime: {type: Date, defaultValue: 0},
//   priority: {type: Number, defaultValue: 0},
//   tempChg: {type: Number, defaultValue: 0},
//   minAlt: {type: Number, defaultValue: 0},
//   completed: {type: Boolean, defaultValue: 0},
//   createdAt: {type: Date, defaultValue: 0},
// });

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

      totalPlannedImages += item.repeat;
    }

    return totalPlannedImages;
  },

  totalImagesTaken: function() {
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

      var progress = target.progress;
      if( typeof progress == 'undefined') {
        continue;
      }
      for (var j = 0; j < progress.length; j++) {
        if( progress[j]._id == series.id ) {
            totalTakenImages = totalTakenImages + progress[j].taken;
        }
      }
    }

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
  }

});
