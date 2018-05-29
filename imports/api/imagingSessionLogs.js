import { Mongo } from 'meteor/mongo';

// Used to store the sessions for a Target - the actual imaging "log"
export const ImagingSessionLogs = new Mongo.Collection('imagingSessionLogs');

ImagingSessionLogs.helpers({
  //
  // totalImagesPlanned: function() {
  //   var totalPlannedImages = 0;
  //   var totalTakenImages = 0;
  //   var target = this;
  //
  //   var seriesId = target.series._id;
  //   var takeSeries = TakeSeriesTemplates.findOne({_id:seriesId});
  //
  //   if( typeof takeSeries == "undefined") {
  //     return 100; // do not try to process
  //   }
  //
  //   for (var i = 0; i < takeSeries.series.length; i++) {
  //     var series = takeSeries.series[i];
  //
  //     if( typeof series == "undefined") {
  //       return 100; // do not try to process
  //     }
  //
  //     var item = Seriess.findOne({_id:series.id}); //.fetch();
  //     if( typeof item == "undefined") {
  //       return 100; // do not try to process
  //     }
  //
  //     totalPlannedImages = totalPlannedImages + Number(item.repeat);
  //   }
  //   // console.log('Planned: ' + totalPlannedImages);
  //   return totalPlannedImages;
  // },
  //
  // totalImagesTaken: function() {
  //   var totalTakenImages = 0;
  //   var target = this;
  //
  //   var progress = target.progress;
  //   if( typeof progress == 'undefined') {
  //     return 0;
  //   }
  //   for (var j = 0; j < progress.length; j++) {
  //     totalTakenImages = totalTakenImages + progress[j].taken;
  //   }
  //   // console.log('Taken: ' + totalTakenImages);
  //   return totalTakenImages;
  // },
  //
  // calcProgress: function() {
  //   var taken = this.totalImagesTaken();
  //   var planned = this.totalImagesPlanned();
  //
  //   return taken/planned;
  //
  // },
  //
  // takenImagesFor: function(seriesId) {
  //   var taken = 0;
  //   var progress = this.progress;
  //   if( typeof progress == 'undefined') {
  //     return taken;
  //   }
  //   for (var i = 0; i < progress.length; i++) {
  //     if (progress[i]._id == seriesId ) {
  //       taken = progress[i].taken;
  //       break;
  //     }
  //   }
  //   return taken;
  // },
  //
  // incrementTakenFor: function(seriesId) {
  //   var taken = 0;
  //   var progress = this.progress;
  //   if( typeof progress != 'undefined') {
  //     // increment
  //     for (var i = 0; i < progress.length; i++) {
  //       if (progress[i]._id == seriesId ) {
  //         progress[i].taken = progress[i].taken + 1;
  //         taken = progress[i].taken;
  //         TargetSessions.update({_id: this._id}, {
  //           $set: {
  //             progress: progress[i],
  //           }
  //         });
  //       }
  //     }
  //   }
  //
  //   return taken;
  // }

});
