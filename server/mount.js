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
import { TheSkyXInfos } from '../imports/api/theSkyXInfos.js';

import {
  tsx_GetServerStateValue,
  tsx_SetServerState,
  UpdateStatus,
  UpdateStatusErr,
  postProgressTotal,
  postProgressIncrement,
  tsx_ServerStates,
 } from '../imports/api/serverStates.js'

 import {
   tsx_feeder,
   tsx_cmd,
 } from './tsx_feeder.js'

 import {
   tsxInfo,
   tsxLog,
   tsxErr,
   tsxWarn,
   tsxDebug,
 } from '../imports/api/theLoggers.js';

import {
  tsx_Connect,
  tsx_Disconnect,
  tsx_AbortGuider,
  processTargetTakeSeries,
  tsx_isDark,
  isTimeBeforeCurrentTime,
  hasStartTimePassed,
  findCalibrationSession,
  CalibrateAutoGuider,
  tsx_RotateCamera,
  tsx_SlewTargetName,
  tsx_SlewCmdCoords,
  tsx_StopTracking,
} from './run_imageSession.js';

import {
  getFilterSlot,
} from './filter_wheel.js'

export function ParkMount( isParked ) {
   if( !isParked ) {
     UpdateStatus(' [MOUNT] Parking mount...');
     var defaultFilter = tsx_GetServerStateValue( tsx_ServerStates.defaultFilter );
     var softPark = Boolean(tsx_GetServerStateValue( tsx_ServerStates.defaultSoftPark ));
     tsx_AbortGuider();
     tsx_MntPark(defaultFilter, softPark);
   }
   isParked = true;
}

// *******************************
export function tsx_IsParked() {
   tsxDebug('************************');
   tsxDebug(' *** tsx_IsParked' );

   var out = false;
   var cmd = tsx_cmd('SkyX_JS_IsParked');

   var tsx_is_waiting = true;
   tsxDebug( '[TSX] SkyX_JS_IsParked' );

   tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
     var result = tsx_return.split('|')[0].trim();
     tsxDebug( result );
     out = result;
     tsx_is_waiting = false;
   }));
   while( tsx_is_waiting ) {
     Meteor.sleep( 1000 );
   }
   return out;
}


// **************************************************************
export function tsx_MntUnpark() {
   tsxDebug('[MOUNT] ************************');
   tsxDebug(' [MOUNT] Unparking mount' );
   var cmd = tsx_cmd('SkyX_JS_UnparkMount');

   var Out = '';
   var tsx_is_waiting = true;
   tsxDebug( '[TSX] SkyX_JS_UnparkMount' );

   tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
         var result = tsx_return.split('|')[0].trim();
         tsxDebug( ' [MOUNT] *** result: ' + result );
         if( result == 'unparked' ) {
           UpdateStatus(' [MOUNT] unparked' );
         }
         else {
           UpdateStatusErr( ' [MOUNT] !!! Unparking err: ' + result );
         }

         Out = result;
         tsx_is_waiting = false;
   }));
   tsxInfo ( ' [MOUNT] unpark waiting ') ;
   while( tsx_is_waiting ) {
     Meteor.sleep( 1000 );
   }
   tsxInfo ( ' [MOUNT] unpark done ') ;
   return Out;
}

export function tsx_MntPark(defaultFilter, softPark) {
   // tsxInfo('************************');
   tsxDebug(' [MOUNT] *** tsx_MntPark' );

   var dts = new Date();
   var slot = 0;

   if( defaultFilter != '' ) {
     slot = getFilterSlot(defaultFilter);
   }
   else {
     slot = 0;
   }

   if( softPark ) {
     // if true just set filter and turn off tracking
     UpdateStatus(' [MOUNT] Soft Parking... ');
   }
   else {
     UpdateStatus(' [MOUNT] Parking... ');
   }
   var cmd = tsx_cmd('SkyX_JS_ParkMount');
   cmd = cmd.replace("$000", slot ); // set filter
   cmd = cmd.replace("$001", softPark ); // set filter

   var Out;
   var tsx_is_waiting = true;
   tsxDebug( '[TSX] SkyX_JS_ParkMount,'+slot+', '+softPark );

   tsx_feeder(cmd, Meteor.bindEnvironment((tsx_return) => {
         var result = tsx_return.split('|')[0].trim();
         tsxInfo( ' [MOUNT] park result: ' + result );
         if( result === 'Parked' || result === 'Soft Parked' ) {
           UpdateStatus( ' [MOUNT] ' + result );
         }
         else {
           UpdateStatusErr( ' [MOUNT] !!! Parking err: ' + tsx_return );
         }

         Out = result;
         tsx_is_waiting = false;
   }));
   tsxInfo( ' [MOUNT] Park waiting' );
   while( tsx_is_waiting ) {
    Meteor.sleep( 1000 );
   }
   tsxInfo( ' [MOUNT] Park wait done' );
   return Out;
}

Meteor.methods({
  park( ) {
    tsx_SetServerState( tsx_ServerStates.tool_active, true );
    let filter = tsx_GetServerStateValue( tsx_ServerStates.defaultFilter );
    let result = '';
    try {
      result = tsx_MntPark(filter, false ); // use default filter
    }
    catch( e )  {
      if( e == 'TsxError' ) {
        UpdateStatus(' [MOUNT] !!! TheSkyX connection is no longer there!');
      }
    }
    finally {
      tsx_SetServerState( tsx_ServerStates.tool_active, false );
    }
    return result;
  }
});
