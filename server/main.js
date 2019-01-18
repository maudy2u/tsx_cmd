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

import { Meteor } from 'meteor/meteor';

import { TargetSessions } from '../imports/api/targetSessions.js';
import { TakeSeriesTemplates } from '../imports/api/takeSeriesTemplates.js';
import { Seriess } from '../imports/api/seriess.js';
import { Filters } from '../imports/api/filters.js';
import { TheSkyXInfos } from '../imports/api/theSkyXInfos.js';
import { scheduler } from '../imports/api/theProcessors.js';
import { FlatSeries } from '../imports/api/flatSeries.js';
import { TargetAngles } from '../imports/api/targetAngles.js';

import { tsxInfo, tsxLog, tsxErr, tsxWarn, tsxDebug,
  logFileForClient, AppLogsDB } from '../imports/api/theLoggers.js';

import {
  tsx_ServerStates,
  tsx_SetServerState,
  tsx_GetServerState,
  tsx_UpdateDevice,
  tsx_GetServerStateValue,
  UpdateStatus,
  postProgressTotal,
  postProgressIncrement,
  postProgressMessage,
  UpdateImagingSesionID,
} from '../imports/api/serverStates.js';

import {
  tsx_Connect,
  tsx_Disconnect,
  tsx_MntPark,
  tsx_AbortGuider,
  getValidTargetSession,
  prepareTargetForImaging,
  processTargetTakeSeries,
  tsx_ServerIsOnline,
  tsx_isDark,
  isTimeBeforeCurrentTime,
  hasStartTimePassed,
  tsx_MntUnpark,
  tsx_IsParked,
  findCalibrationSession,
  CalibrateAutoGuider,
  tsx_RotateCamera,
  UpdateImagingTargetReport,
  tsx_SlewTargetName,
  tsx_SlewCmdCoords,
  tsx_StopTracking,
} from './run_imageSession.js';

import { tsx_feeder, stop_tsx_is_waiting } from './tsx_feeder.js';

import {shelljs} from 'meteor/akasha:shelljs';

/*
tsx_SetServerState
currentStage: 'currentStage', // this is a status line update for the dashboard
initialFocusTemperature: 'initialFocusTemperature',
mntRA: 'mntRA',
mntDEC: 'mntDEC',
mntMHS: 'mntMHS',
mntMntDir: 'mntMntDir',
mntMntAlt: 'mntMntAlt',
targetRA: 'targetRA',
targetDEC: 'targetDEC',
targetATL: 'targetATL',
targetAZ: 'targetAZ',

currentTargetSession: 'currentTargetSession', // use to report current imaging targets
isCurrentlyImaging: 'isCurrentlyImaging',
*/

function initServerStates() {
  tsx_SetServerState('activeMenu', 'Settings');
  tsx_SetServerState('mntMntDir', '');
  tsx_SetServerState('mntMntAlt', '');
  tsx_SetServerState('targetRA', '');
  tsx_SetServerState('targetDEC', '');
  tsx_SetServerState('targetALT', '');
  tsx_SetServerState('targetAZ', '');
  tsx_SetServerState('targetHA', '');
  tsx_SetServerState('targetTransit', '');
  tsx_SetServerState('targetName', 'No Active Target');
  tsx_SetServerState('scheduler_report', '');
  tsx_SetServerState('lastTargetDirection', '');
  tsx_SetServerState('lastCheckMinSunAlt', '');
  // tsx_SetServerState('lastFocusPos', '');
  // tsx_SetServerState('lastFocusTemp', '');
  tsx_SetServerState('imagingSessionDither', 0);
  tsx_SetServerState('currentJob', '');
  tsx_SetServerState('scheduler_running', 'Stop');
  tsx_SetServerState('tool_active', false );
  tsx_SetServerState('night_plan_updating', false );

  for (var m in tsx_ServerStates){
    var state = tsx_ServerStates[m];
    try {
      var isDefined = TheSkyXInfos.findOne({name: state });
      tsxDebug(state, isDefined.value);

    } catch (e) {
      tsxWarn('Initialized: ', state);
      tsx_SetServerState(state, '');
    } finally {
    }
  }
}

function ParkMount( isParked ) {
  if( !isParked ) {
    UpdateStatus(' Parking...');
    var defaultFilter = tsx_GetServerStateValue('defaultFilter');
    var softPark = Boolean(tsx_GetServerStateValue('defaultSoftPark'));
    tsx_AbortGuider();
    tsx_MntPark(defaultFilter, softPark);
  }
  isParked = true;
  var sleepTime = tsx_GetServerStateValue('defaultSleepTime');
  UpdateStatus( ' Parked, waiting: '+ sleepTime + ' min');
  var timeout = 0;
  var msSleep = Number(sleepTime); // number of seconds
  postProgressTotal(sleepTime);
  postProgressMessage('Waiting ~' + sleepTime + 'min.');
  while( timeout < msSleep && tsx_GetServerStateValue('currentJob') != '') { //
    var min = 1000*60; // one minute in milliseconds
    Meteor.sleep( min );
    timeout = timeout + 1;
    postProgressIncrement( timeout );
  }
  if( tsx_GetServerStateValue('currentJob') == '' ) {
    UpdateStatus( ' Canceled sessions');
    tsx_SetServerState('targetName', 'No Active Target');
    tsx_SetServerState('scheduler_report', '');
  }
  else {
    UpdateStatus(' WAKING UP...');
  }
  postProgressTotal(0);
  postProgressIncrement( 0 );
  postProgressMessage(' Processing');
}

function isDarkEnough() {
  var isDark = tsx_isDark();
  tsxDebug(' Is dark enough for target: ' + isDark );
  if( isDark === false ) {
    tsxDebug( ' Sun is not low enough.' );
    return false;
  }
  return true;
}

function CleanUpJobs() {
  // *******************************
  // Server restarts and it means no session
  // get rid of any old processes/jobs
  var jobs = scheduler.find().fetch();
  var jid = tsx_GetServerStateValue('currentJob');
  scheduler.remove( jid );
  tsx_SetServerState('currentJob', '');
  UpdateImagingSesionID( '' );
  tsx_SetServerState('targetName', 'No Active Target');
  tsx_SetServerState('scheduler_report', '');

  // Clean up the scheduler process collections...
  // Persistence across reboots is not needed at this time.
  tsxDebug('Number of Jobs found: ' + jobs.length);
  if( jobs.length > 0 ) {
    tsxDebug( ' Cleaning up DB');
    for (var i = 0; i < jobs.length; i++) {
      if( typeof jobs[i] != 'undefined') {
        scheduler.remove(jobs[i]._id);
      }
    }
    tsxDebug(' Cleaned DB');
  }
  return;
}

function startServerProcess() {
  // *******************************
  //   Imaging processs
  // *******************************
  // Assumed balanced RA/DEC
  // Assumed Date/Time/Long/Lat correct
  // Assumed Homed
  // Assume Polar aligned (rough, or with Polemaster)
  // Assumed initial focus is done
  // Assume TPoint recalibration done
  // Assumed Accurate Polar Alignment (APA) done
  // Do not assume Autoguider calibrated, will be done once guide star found
  var workers = scheduler.processJobs( 'runScheduler',
    function (job, cb) {
      tsxLog( ' ******************************* ');

      UpdateStatus(' *** Scheduler Started');
      var schedule = job.data;
      tsxDebug( schedule );
      tsxDebug( job.data );

      // This will only be called if a 'runScheduler' job is obtained
      setSchedulerState( 'Running' );
      tsx_SetServerState('currentJob', job);

      job.log("Entered the scheduler process",
        {level: 'info'}
      );

      var isParked = '';

      if( schedule.scheduleType == 'calibration') {
        // *******************************
        UpdateStatus(" === Starting calibration targets");

        tsx_Connect();

        for( var i=0; i<schedule.targets.length;i++ ) {
          var target = schedule.targets[i];
          // what is the FOV position??
          tsxLog( ' Calibration rotator: ' + target.rotator_position );
          if( target.rotator_position != '' ) {
            // rotate to a specific position
            var res = tsx_RotateCamera( target.rotator_position );
          }
          try {
            processTargetTakeSeries( target );
          }
          catch( err ) {
            var res = err.split('|')[0].trim();
            if( res == 'TSX_ERROR' ) {
              UpdateStatus( ' *** ENDING - centring failed. Check for clouds' );
            }
          }
        }
        tsx_SetServerState( 'tool_active', false );
      }
      else {
        // *******************************
        // the job is used to run the scheduler.
        while( tsx_GetServerStateValue('currentJob') != '' ) {
          tsxDebug(" === Starting imaging targets");

            tsx_MntUnpark();
            isParked = false;

            // Find a session
            // Get the target to shoot
//            tsxInfo( ' Validating Targets...');

            /* #TODO
            So working on the cloud detection to PAUSE.

            1.  getValidTargetSession returns a target.
                It needs to a add a check that if isCloudy = false then it is skipped
            2.  prepareTargetForImaging can return false.. meaning the chosen target
                could not be prepared... CLS failed. If so then market the target as FAILED
                (The start of the job needs to "reset" all targets as isCloudy = false.)

            */

            // Process Targets
            var target = getValidTargetSession(); // no return
            // if no valid target then check for calibration sessions...
            // how to detect calibation sessions...
            // Create Calibration sessions similar to Targets..
            // New database... uses calibration images...
            // Means there are edits... i.e. assign/copy a series
            // anything else? enable/disable... Flat/Dark/Bias
            // remove dark/bias/flat from targets...

            if (typeof target != 'undefined' && tsx_GetServerStateValue('currentJob') != '' ) {
              tsxDebug ( ' ' + target.targetFindName + ' Preparing target...');

              // Point, Focus, Guide
              var ready = false;
              try {
                // First true = do the rotator
                // Second true = do the calibration
                ready = prepareTargetForImaging( target, true, true );
              }
              catch( err ) {
                // did we get a CLS Failure???
                var res = err.split('|')[0].trim();
                if( res == 'TSX_ERROR' ) {
                  UpdateStatus( ' *** ENDING - centring failed. Check for clouds' );
                  ParkMount( isParked );
                  isParked = true;
                }
                else {
                  UpdateStatus( ' !!! SOMETHING WRONG - human needs to check ');
                  break;
                }
              }
              if( ready ) {
                // target images per Take Series
                tsxDebug ( ' ************************1*');
                UpdateStatus ( ' ' +target.targetFindName  + ': start imaging');
                try {
                  processTargetTakeSeries( target );
                }
                catch( err ) {
                  // did we get a CLS Failure???
                  tsxLog( ' !!! Error processing series: ' + err );
                  var res = err.split('|')[0].trim();
                  if( res == 'TSX_ERROR' ) {
                    UpdateStatus( ' *** ENDING - centring failed. Check for clouds' );
                    ParkMount( isParked );
                    isParked = true;
                  }
                  else {
                    UpdateStatus( ' !!! SOMETHING WRONG - human needs to check ');
                    break;
                  }
                }
                tsxDebug ( ' ************************2*');
              }
              else {
                ParkMount( isParked );
                isParked = true;
              }
            }
            else {
              ParkMount( isParked );
              isParked = true;
            }

            // Check if sun is up and no cal frames
            if( (!isDarkEnough()) && tsx_GetServerStateValue('currentJob') != '' ) {
              ParkMount( isParked );
              isParked = true;
              var approachingDawn = isTimeBeforeCurrentTime('3:00');
              tsxDebug( ' Is approachingDawn: ' + approachingDawn);
              // var stillDaytime = isTimeBeforeCurrentTime('15:00');
              // tsxDebug( ' Is stillDaytime: ' + stillDaytime);
              if( approachingDawn ) {
                var defaultFilter = tsx_GetServerStateValue('defaultFilter');
                var softPark = false;
                tsx_AbortGuider();
                tsx_MntPark(defaultFilter, softPark);
                UpdateStatus( ' Scheduler stopped: not dark.');
                break;
              }
            }
        }
      }
      // While ended... exit process
      setSchedulerState('Stop' );
      tsxLog( ' Scheduler exited.');
      tsxLog( ' ******************************* ');
      job.done();
      cb();
    }
  );
  return scheduler.startJobServer();
}

Meteor.startup(() => {

  AppLogsDB.remove({});
  // FlatSeries.remove({});
  // TargetAngles.remove({});

  var version_dat = {};
  version_dat = JSON.parse(Assets.getText('version.json'));
  if( version_dat.version != '') {
    tsx_SetServerState('tsx_version', version_dat.version);
    tsxLog(' Version', version_dat.version);
  }
  if( version_dat.date != '') {
    tsx_SetServerState('tsx_date', version_dat.date);
    tsxLog(' Date', version_dat.date);
  }

  var dbIp = '';
  var dbPort = '';
  try {
    dbIp = TheSkyXInfos.findOne().ip() ;
  } catch( err ) {
    // do nothing
    tsx_SetServerState('ip', 'localhost');
    dbIp = 'localhost';
  }
  try {
    dbPort = TheSkyXInfos.findOne().port();
  } catch( err ) {
    // do nothing
    tsx_SetServerState('port', '3040');
    dbPort = '3040';
  }

  // removing so can start up easier without error.
  // var dbMinAlt = TheSkyXInfos.findOne().defaultMinAltitude();
  tsxLog('   IP',  dbIp );
  tsxLog(' port', dbPort );

  CleanUpJobs();
  initServerStates();

  // Initialze the server on startup
  tsx_UpdateDevice('mount', 'Not connected ', '' );
  tsx_UpdateDevice('camera', 'Not connected ', '' );
  tsx_UpdateDevice('guider', 'Not connected ', '' );
  tsx_UpdateDevice('rotator', 'Not connected ', '' );
  tsx_UpdateDevice('efw', 'Not connected ', '' );
  tsx_UpdateDevice('focuser', 'Not connected ', '' );

  tsxLog( ' Logfile', logFileForClient() );
  tsxLog(' ******* TSX_CMD ONLINE ******', '');

  return;

});

function getSchedulerState() {
  var state = tsx_GetServerStateValue('scheduler_running');
  return state;
}

function setSchedulerState( value ) {
  tsx_SetServerState('scheduler_running', value);
}

export function srvStopScheduler() {
  CleanUpJobs();
  UpdateImagingSesionID( '' );
  tsx_SetServerState('SchedulerStatus', 'Stop');
  tsx_SetServerState('targetName', 'No Active Target');
  tsx_SetServerState('scheduler_report', '');
  tsx_AbortGuider();
  UpdateStatus(' *** Manually STOPPING scheduler ***');
  setSchedulerState('Stop' );
  tsxLog( ' ******************************* ');
}

Meteor.methods({

   // the question with the scheduler is...
   // how to pause the "takeseries"
   // and allow the other functions to run...
   // do I need to create other "Jobs"
   // 1. CLS?
   // 2. focus?
   // 3. autoguide?
   // 4. start/end checks... ???
   // or KISS and one big sequenital function...
   startScheduler() {
     tsxDebug(' ***********************2*');
     // tsxLog('Found scheduler state: ' + getSchedulerState() );
     if(
       getSchedulerState() == 'Running'
     ) {
       tsxDebug("Running found");
       tsxLog('Scheduler is alreadying running. Nothing to do.');
       return;
     }
     else if(
        getSchedulerState() == 'Stop'
      ) {
        tsxDebug("Stop found");
        startServerProcess();

        // Confirm whether the there is a script running...
        if( !tsx_ServerIsOnline() ) {
          UpdateStatus('Check TSX... script running, or server not online.');
          return;
        }

        tsxDebug( '@@ Start1' );
        // Create a job:
        var job = new Job(scheduler, 'runScheduler', // type of job
          // Job data that you define, including anything the job
          // needs to complete. May contain links to files, etc...
          {
            startTime: new Date(),
            scheduleType: 'imaging',
          }
        );
        tsxDebug( '@@ Start2' );

        // Set some properties of the job and then submit it
        // the same submit the start time to the scheduler...
        // at this time could add a tweet :)
        job.priority('normal');
        // .retry({ retries: 5,
        //   wait: 5*60*1000 }) //15*60*1000 })  // 15 minutes between attempts
        // .delay(0);// 60*60*1000)     // Wait an hour before first try

        var jid = job.save();               // Commit it to the server
        tsxDebug( '@@ Start1' );

        // tsxLog('Job id: ' + jid);
        return;
     }
     else {
       tsxErr("Invalid state found for scheduler.");
       // logCon.error('Invalid state found for scheduler.');
     }
   },

   stopScheduler() {
     if( getSchedulerState() != 'Stop' ) {
       tsxDebug('Stopping');
       srvStopScheduler();
     }
     else {
       tsxInfo('Do nothing - Already Stopped');
     }
   },

  calibrateGuider( slew, location, dec_az ) {
    tsxDebug(' *** tsx_CalibrateAutoGuide' );
    var enabled = tsx_GetServerStateValue('isCalibrationEnabled');
    if( !enabled ) {
      UpdateStatus(' *** Calibration disabled - enable to continue');
      return false;
    }

    tsx_SetServerState( 'tool_active', true );
    try {
      let res = true;
      if( slew != '' ) {
        if( slew == 'Alt/Az'&& location !='' && dec_az != '') {
          UpdateStatus(' Tool: slewing to Alt/Az: ' + location + '/' + dec_az );
          res = tsx_SlewCmdCoords( 'SkyX_JS_SlewAltAz', location, dec_az );
        }
        else if( slew == 'Ra/Dec' && location !='' && dec_az != '') {
          UpdateStatus(' Tool: slewing to Ra/Dec: ' + location + '/' + dec_az );
          res = tsx_SlewCmdCoords( 'SkyX_JS_SlewRaDec', location, dec_az );
        }
        else if( slew == 'Target name' && location !='') {
          UpdateStatus(' Tool: slewing to target: ' + location );
          res = tsx_SlewTargetName( location  );
        }
      }
      if( res = true ) {
        UpdateStatus(' Tool: slew finished');
        tsxLog(' Tool: calibrating autoGuider');
        CalibrateAutoGuider();
      }
    }
    catch( e ) {
      if( e == 'TsxError' ) {
        UpdateStatus('!!! TheSkyX connection is no longer there!');
      }
    }
    finally {
      tsx_SetServerState( 'tool_active', false );
    }
  },

  slewPosition( slew, location, dec_az, stopTracking ) {
    tsx_SetServerState( 'tool_active', true );
    tsxDebug( '  slew'+slew);
    tsxDebug( '  location'+location);
    tsxDebug( '  dec_az'+dec_az);
    var res = '';
    try {
      if( slew != '' ) {
        UpdateStatus('Slewing');
        if( slew == 'Alt/Az'&& location !='' && dec_az != '') {
          res = tsx_SlewCmdCoords( 'SkyX_JS_SlewAltAz', location, dec_az );
        }
        else if( slew == 'Ra/Dec' && location !='' && dec_az != '') {
          res =tsx_SlewCmdCoords( 'SkyX_JS_SlewRaDec', location, dec_az );
        }
        else if( slew == 'Target name' && location !='') {
          res = tsx_SlewTargetName( location  );

        }
      }
      UpdateStatus(' Slew: ' + res );
    }
    catch( e ) {
      UpdateStatus('Slewing failed');
      res = 'Failed slewing';
      if( e == 'TsxError' ) {
        UpdateStatus('!!! TheSkyX connection is no longer there!');
      }
    }
    finally {
      tsx_SetServerState( 'tool_active', false );
      if( stopTracking ) {
        UpdateStatus('Stopping tracking');

        tsx_SetServerState( 'tool_active', true );
        let res = '';
        try {
          res = tsx_StopTracking();
          UpdateStatus('Stopped tracking');
        }
        catch (e) {
          UpdateStatus('Stop tracking failed');
          res = 'Stop tracking failed';
          if( e == 'TsxError' ) {
            UpdateStatus('!!! TheSkyX connection is no longer there!');
          }
        }
        finally {
          tsx_SetServerState( 'tool_active', false );
        }
        return res;
      }
    }
    return res;
  },

  rotateCamera( cls ) {
    tsx_SetServerState( 'tool_active', true );
    try {
      tsxLog(' Rotating Camera');
      var num  = tsx_GetServerStateValue('tool_rotator_num');
      var res = tsx_RotateCamera( num, cls ); // tool needs to use CLS use 0
    }
    catch( e ) {
      if( e == 'TsxError' ) {
        UpdateStatus('!!! TheSkyX connection is no longer there!');
      }
    }
    finally {
      tsx_SetServerState( 'tool_active', false );
    }
  },

  processCalibrationTargets( targets ) {

    tsx_SetServerState( 'tool_active', true );
    tsxDebug(" Calibration File Processes");
    startServerProcess();
    // Create a job:
    var job = new Job(scheduler, 'runScheduler', // type of job
      // Job data that you define, including anything the job
      // needs to complete. May contain links to files, etc...
      {
        startTime: new Date(),
        scheduleType: 'calibration',
        targets: targets,
      }
    );
    job.priority('normal');
    var jid = job.save();               // Commit it to the server
  },

   getUpdateTargetReport(target) {
     tsxLog( ' TargetReport: ' + target.targetFindName );
     var rpt = '';
     try {
       rpt = UpdateImagingTargetReport( target )
     }
     catch( e ) {
       if( e == 'TsxError' ) {
         UpdateStatus('!!! TheSkyX connection is no longer there!');
       }
       rpt = {
         ready: false,
       }
     }
     return rpt;
   },

   updateServerState( name, value ) {
     var id = TheSkyXInfos.upsert( {name: name }, {
       $set: { value: value }
     })
     tsxInfo(' [Saved] ' +name+':'+value);
   },

   updateSeriesIdWith(
       id,
       name,
       value
      ) {

     tsxDebug(' ******************************* ');
     tsxDebug(' updateSeriesIdWith: ' + id + ', ' + name + ", " + value);
     if( name == 'order ') {
       tsxDebug('1');
       var res = Seriess.update( {_id: id }, {
         $set:{
           order: value,
         }
       });
     }
     else if (name == 'exposure' ) {
       tsxDebug('2');
       var res = Seriess.update( {_id: id }, {
         $set:{
           exposure: value,
         }
       });
     }
     else if (name == 'frame') {
       tsxDebug('3');
       var res = Seriess.update( {_id: id }, {
         $set:{
           frame: value,
         }
       });
     }
     else if (name=='filter') {
       tsxDebug('4');
       var res = Seriess.update( {_id: id }, {
         $set:{
           filter: value,
         }
       });
     }
     else if (name=='repeat') {
       tsxDebug('5');
       var res = Seriess.update( {_id: id }, {
         $set:{
           repeat: value,
         }
       });
     }
     else if (name=='binning') {
       tsxDebug('6');
       var res = Seriess.update( {_id: id }, {
         $set:{
           binning: value,
         }
       });
     }
   },

 });
