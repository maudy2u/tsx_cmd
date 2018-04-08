import { TargetSessions } from './targetSessions.js';
import { TakeSeriesTemplates } from './takeSeriesTemplates.js';
import { Seriess } from './seriess.js';
import { TheSkyXInfos } from './theSkyXInfos.js';

import {
  tsx_ServerStates,
  tsx_SetServerState,
  tsx_GetServerState,
} from './serverStates.js'

export function getTotalPlannedImages(id) {
    var totalPlannedImages = 0;
    var totalTakenImages = 0;
    var template = TargetSessions.findOne(
      {_id:id}
    );

    if( typeof template == "undefined") {
      return 100; // do not try to process
    }

    var seriesId = template.series._id;
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
      totalTakenImages += item.taken;
      totalPlannedImages += item.repeat;
    }

    return totalTakenImages/totalPlannedImages;
};

export function getTotalTakenImages(id) {
    var totalPlannedImages = 0;
    var totalTakenImages = 0;
    var template = TargetSessions.findOne(
      {_id:id}
    );

    if( typeof template == "undefined") {
      return 100; // do not try to process
    }

    var seriesId = template.series._id;
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
      totalTakenImages += item.taken;
      totalPlannedImages += item.repeat;
    }

    return totalTakenImages;
};

export function calcTargetProgress(id) {
    var totalPlannedImages = 0;
    var totalTakenImages = 0;
    var template = TargetSessions.findOne(
      {_id:id}
    );

    if( typeof template == "undefined") {
      return 100; // do not try to process
    }

    var seriesId = template.series._id;
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
      totalTakenImages += item.taken;
      totalPlannedImages += item.repeat;
    }

    return totalTakenImages/totalPlannedImages;
};

// *******************************
// Get Target Series
// 1. Target - image, RA/DEC, Name
// 2. priority - in the case more than one session is ready...
// 3. Minimum Altitude - start or stop... for now
// 4. start Time
// 5. Stop time
// 6. Temp to check focus
// 7. Meridian Flip
// 8. Image Camera Temp
export function getTargetSession() {
  console.log('getTargetSession');
  var targetSessions = TargetSessions.find({}).fetch();
  var foundSession = false;
  var numSessions = targetSessions.length;
  var validSession;

  for (var i = 0; i < numSessions; i++) {
    var canStart = canTargetSessionStart( targetSessions[i]);
    if( canStart ) {
      validSession = targetSessions[i];
      foundSession = true;
      break;
    }
  }


  if( foundSession ) {
    for (var i = 0; i < numSessions; i++) {
      if( validSession != targetSessions[i] ) {
        var chkSession = targetSessions[i];
        if( canTargetSessionStart( chkSession ) ) {
            var valPriority = Number(validSession.priority);
            var chkPriority = Number(chkSession.priority);
            var chk = valPriority - chkPriority;
            if( (chk > 0) ) {
              // if( validSession.minAlt > chk.minAlt  ) {
                // if( validSession.startTime > chk.startTime  ) {
                  validSession = chkSession;
                // }
              // }
            }
          }
        }
      }
    }
  return validSession;
};

// *******************************
// Check target... altitude ok, time okay,
export function canTargetSessionStart(targetSession) {

  if(!targetSession.enabledActive){
    return false; // the session is disabled
  }

  // These are to be on the server... currently debuging on client
  //tsx_GetTargetRaDec(targetSession);
  var currentAlt = 31; //tsx_GetServerState( tsx_ServerStates.targetALT );

  var canStart = false;
  var currentTime = new Date();
  // var eveningTwighlight = 10;
  // var morningTwighlight = 5;

  // are we at least above or equal to the min altitude
  if( currentAlt >= targetSession.minAlt ) {
    canStart = true;
  }
  // Is it dark enough
  // if( currentTime >= eveningTwighlight ) {
 //          // Has end time passed
 //          if( targetSession.stopTime < currentTime ) {
 //            // Has start time passed
 //            if( targetSession.startTime >= currentTime ) {
 //         // if( currentTime < morningTwighlight ) {
 //         // }
 //        }
 //      }
 //    }
 // // }
  return canStart;
}
