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
  UpdateStatus,
  UpdateStatusErr,
  postStatus,
  postProgressTotal,
  postProgressIncrement,
  tsx_ServerStates,
 } from '../imports/api/serverStates.js'

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
   tsx_MntPark,
   tsx_AbortGuider,
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
   tsx_SlewTargetName,
   tsx_SlewCmdCoords,
   tsx_StopTracking,
   isSchedulerStopped,
 } from './run_imageSession.js';

 export function ParkMount( isParked ) {
   if( !isParked ) {
     UpdateStatus(' Parking mount...');
     var defaultFilter = tsx_GetServerStateValue( tsx_ServerStates.defaultFilter );
     var softPark = Boolean(tsx_GetServerStateValue( tsx_ServerStates.defaultSoftPark ));
     tsx_AbortGuider();
     tsx_MntPark(defaultFilter, softPark);
   }
   isParked = true;
 }
