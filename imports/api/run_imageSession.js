import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

// *******************************
// the following is an outline for running an image session
//
Meteor.methods({

  // Assumed balanced RA/DEC
  // Assumed Date/Time/Long/Lat correct
  // Assumed Homed
  // Assume Polar aligned (rough, or with Polemaster)
  // Assumed initial focus is done
  // Assume TPoint recalibration done
  // Assumed Accurate Polar Alignment (APA) done
  // Do not assume Autoguider calibrated, will be done once guide star found

// NEED A METHOD TO ADD TEMP SAMPLES INTO Database
// NEED A METHOD TO RESET THE TEMP DATA IN DATABASE

// *******************************
// Utilities:
// 1. CLS
// 2. stop SkyX_JS_StopTracking
// 3. MountParkHard
// 4. MountParkSoft
// 5. Focus
// 6. SkyX_JS_FindAutoGuideStar
// 6. waitTilDark
// DONE 7. Get Filter names...
//    numFilters = lNumberFilters | filterName = ccdsoftCamera::szFilterName
//    ignore the offset for now... assume TSX will manage

// *******************************
// Target Series
// 1. Target - image, RA/DEC, Name
// 2. priority - in the case more than one session is ready...
// 3. Minimum Altitude - start or stop... for now
// 4. start Time
// 5. Stop time
// 6. Temp to check focus
// 7. Meridian Flip
// 8. Image Camera Temp

// *******************************
// Capture Series - SHO|LRGB
// 1. Per Filter or Across Filters
// 1. FilterSession 1
// 2. Filter Session N

// *******************************
// Filter Series
// 1. Filter name
// 2. Exposure
// 3. Quantity
// 4. taken - number of images obtained

  // *******************************
  // 0. Find a session
  //    - check start time
  //    - check for dark time... is darkenough
  //    - check start altitude
  //    - check priority
  //    - check for end times
  //    - check end alitudes
  //    - check morning sunrise

  // *******************************
  // 1. Get target's Ra/Dec to Slew, options:
  //  a) Object name to find
  //  b) Image
  //  c) Ra/Dec

  // *******************************
  // Check target... altitude ok, time okay,

  // *******************************
  // 2. Frame target
  //    A. Tweet session starting
  //    B. CLS to target
  //    C. Match Rotation/Angle if provided:
  //      a) if entered for session
  //      b) obtained from image

  // *******************************
  // 3. refine Focus - @Focus3

  // *******************************
  // 4. Get Guidestar

  // *******************************
  // 5. Calibrate Autoguide

  // *******************************
  // 6. Load filters, exposures, quantity

  // *******************************
  // 7. Start session run:
  //    - take image

  // *******************************
  //  8. Image done... next?
  //    - check priority - is there another target to take over
  //    - check for meridian flip
  //    - check end time
  //    - check end Altitude
  //    - Report for next image... step 6
  //      - do we dither?
  //      - did temp change to refocus?

  // *******************************
  // 8. End session activities


});
