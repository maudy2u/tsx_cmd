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
