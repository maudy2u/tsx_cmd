import { TargetSessions } from './targetSessions.js';
import { TakeSeriesTemplates } from './takeSeriesTemplates.js';
import { Seriess } from './seriess.js';
import { TheSkyXInfos } from './theSkyXInfos.js';

import {
  tsx_ServerStates,
  tsx_SetServerState,
  tsx_GetServerState,
} from './serverStates.js'

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
export function findTargetSession() {
  console.log('findTargetSession');
  var targetSessions = TargetSessions.find({}).fetch();
  var foundSession = false;
  var numSessions = targetSessions.length;
  var validSession;

  // get first validSession
  for (var i = 0; i < numSessions; i++) {
    var canStart = canTargetSessionStart( targetSessions[i]);
    if( canStart ) {
      validSession = targetSessions[i];
      foundSession = true;
      break;
    }
  }

  // now iterate the sessions to find anyting with higher
  // priotiry
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