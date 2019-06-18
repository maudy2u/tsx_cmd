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

import {
  tsxInfo,
  tsxLog,
  tsxErr,
  tsxWarn,
  tsxDebug,
} from '../imports/api/theLoggers.js';
import {
  tsx_UpdateDevice,
  tsx_ServerStates,
  tsx_SetServerState,
  tsx_GetServerState,
  tsx_GetServerStateValue,
  UpdateStatus,
  UpdateStatusWarn,
  UpdateStatusErr,
} from '../imports/api/serverStates.js'

import {
  getFilterSlot,
} from './run_imageSession.js'

import {
  tsx_feeder,
  tsx_cmd,
  tsx_has_error,
} from './tsx_feeder.js'

// grab npm version
import shelljs from 'shelljs';
// this is equivalent to the standard node require:
const Shelljs = require('shelljs');

// if these variables are defined then use their settings... else it is dev mode
//  "tsx_cmd_db": "tsx_cmd",
//  "mongo_port": "27017"
var tsx_cmd_db = '';
if( Meteor.settings.tsx_cmd_db === '' || typeof Meteor.settings.tsx_cmd_db === 'undefined' ) {
  tsx_cmd_db = 'meteor';
}
else {
  tsx_cmd_db = Meteor.settings.tsx_cmd_db;
}
var mongo_port = '';
if( Meteor.settings.mongo_port === '' || typeof Meteor.settings.mongo_port === 'undefined' ) {
  mongo_port = "3001";
}
else {
  mongo_port = Meteor.settings.mongo_port;
}



Meteor.startup(function () {

});

function fileNameDate( today ) {
  // desired format:
  // 2018-01-01

  var HH = today.getHours();
  var MM = today.getMinutes();
  var SS = today.getSeconds();
  var mm = today.getMonth()+1; // month is zero based
  var dd = today.getDate();
  var yyyy = today.getFullYear();

  // set to the date of the "night" session
  ((HH < 8) ? dd=dd-1 : dd=dd);

  return yyyy +'_'+ ('0'  + mm).slice(-2) +'_'+ ('0'  + dd).slice(-2)+'_HH'+ ('0'  + HH).slice(-2)+'_MM'+ ('0'  + MM).slice(-2)+'_SS'+ ('0'  + SS).slice(-2);
}

Meteor.methods({

  focusCamera() {
    tsx_SetServerState( 'tool_active', true );
    var focusFilterName = tsx_GetServerStateValue( 'defaultFilter' );
    var focusFilter = getFilterSlot( focusFilterName );
    var focusExp = tsx_GetServerStateValue( 'defaultFocusExposure' ); // assuming 1, need to get from state

    try {
      var cmd = tsx_cmd('SkyX_JS_Focus-3');
      tsxLog( ' ??? @Focusing-3 filter: ' + focusFilter );
      tsxLog( ' ??? @Focusing-3 exposure: ' + focusExp );
      cmd = cmd.replace("$000", focusFilter ); // set filter
      cmd = cmd.replace("$001", focusExp ); // set Bin

      var tsx_is_waiting = true;
      UpdateStatus(' --- @Focus3 started');

      tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        //[[B^[[B^[[BI20180708-01:53:13.485(-3)?   [SERVER]|2018-07-08|01:53:13|[DEBUG]| ??? @Focusing-3 returned: TypeError: Error code = 5 (5). No additional information is available.|No error. Error = 0
        tsxDebug( ' ??? @Focusing-3 returned: ' + tsx_return );
        var temp = tsx_return.split('|')[1].trim();
        var position = tsx_return.split('|')[0].trim();
        if( temp == 'TypeError: Error code = 5 (5). No additional information is available.') {
            temp = tsx_GetServerStateValue( 'initialFocusTemperature' );
            UpdateStatus( ' !!! Error find focus.' );
        }
        //TypeError: @Focus diverged.  Error = 7001
        else if (temp =='TypeError: @Focus diverged.  Error = 7001.') {
          temp = tsx_GetServerStateValue( 'initialFocusTemperature' );
          UpdateStatus( ' !!! Error find focus.' );
        }
        else if( typeof temp == 'undefined' || temp === 'No error. Error = 0.') {
          temp = '';
        }
        if( position == 'Simulator') {
          temp = position;
        }
        // Focuser postion (1232345345) using LUM Filter
        UpdateStatus(' *** Focuser postion (' + position + ') and temp ('+temp+') using 0 filter.');

        if( temp != '') {
          tsx_SetServerState( 'initialFocusTemperature', temp);
        }
        tsx_is_waiting = false;
      }));
      while( tsx_is_waiting ) {
       Meteor.sleep( 1000 );
      }
    }
    catch( e ) {
      UpdateStatus( ' Focusing FAILED: ' + e );
    }
    finally {
      tsx_SetServerState( 'tool_active', false );
    }
  },

});
