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
} from './filter_wheel.js'

import {
  tsx_feeder,
  tsx_cmd,
  tsx_has_error,
} from './tsx_feeder.js'

Meteor.startup(function () {

});

Meteor.methods({

  focusCamera() {
    tsx_SetServerState( tsx_ServerStates.tool_active, true );
    var focusFilterName = tsx_GetServerStateValue( tsx_ServerStates.defaultFilter );
    var focusFilter = getFilterSlot( focusFilterName );
    var focusExp = tsx_GetServerStateValue( tsx_ServerStates.defaultFocusExposure ); // assuming 1, need to get from state
    var focusSamples = tsx_GetServerStateValue( tsx_ServerStates.focus3Samples );
    if( focusSamples == '' || typeof focusSamples == 'undefined') {
      tsx_SetServerState(tsx_ServerStates.focus3Samples, 5 ); // arbitrary default
      focusSamples = 5;
    }

    UpdateStatus(' TOOLBOX: @Focus3 STARTED');
    try {
      var cmd = tsx_cmd('SkyX_JS_Focus-3');
      tsxInfo( ' ??? @Focusing-3 filter: ' + focusFilter );
      tsxInfo( ' ??? @Focusing-3 exposure: ' + focusExp );
      tsxInfo( ' ??? @Focusing-3 samples: ' + focusSamples );
      cmd = cmd.replace("$000", focusFilter ); // set filter
      cmd = cmd.replace("$001", focusExp ); // set Bin
      cmd = cmd.replace("$002", focusSamples ); // set Bin

      var tsx_is_waiting = true;

      tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
        //[[B^[[B^[[BI20180708-01:53:13.485(-3)?   [SERVER]|2018-07-08|01:53:13|[DEBUG]| ??? @Focusing-3 returned: TypeError: Error code = 5 (5). No additional information is available.|No error. Error = 0
        tsxInfo( ' ??? @Focusing-3 returned: ' + tsx_return );
        var temp = tsx_return.split('|')[1].trim();
        var position = tsx_return.split('|')[0].trim();
        if( temp == 'TypeError: Error code = 5 (5). No additional information is available.') {
            temp = tsx_GetServerStateValue( tsx_ServerStates.initialFocusTemperature );
            UpdateStatus( ' !!! Error find focus.' );
        }
        //TypeError: @Focus diverged.  Error = 7001
        else if (temp =='TypeError: @Focus diverged.  Error = 7001.') {
          temp = tsx_GetServerStateValue( tsx_ServerStates.initialFocusTemperature );
          UpdateStatus( ' !!! Error find focus.' );
        }
        else if( typeof temp == 'undefined' || temp === 'No error. Error = 0.') {
          temp = '';
        }
        if( position == 'Simulator') {
          temp = position;
        }
        // Focuser postion (1232345345) using LUM Filter
        UpdateStatus(' --- Focuser postion (' + position + ') and temp ('+temp+') using filter: ' + focusFilterName);

        if( temp != '') {
          tsx_SetServerState( tsx_ServerStates.initialFocusTemperature, temp);
        }
        tsx_is_waiting = false;
      }));
      while( tsx_is_waiting ) {
       Meteor.sleep( 1000 );
      }
    }
    catch( e ) {
      UpdateStatus( ' !!! Focusing FAILED: ' + e );
    }
    finally {
      UpdateStatus(' TOOLBOX: @Focus3 FINISHED');
      tsx_SetServerState( tsx_ServerStates.tool_active, false );
    }
  },

});
