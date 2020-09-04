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
  postProgressTotal,
  postProgressIncrement,
  tsx_ServerStates,
} from '../imports/api/serverStates.js'

import {
  TakeSeriesTemplates,
} from '../imports/api/takeSeriesTemplates.js';

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
   processTargetTakeSeries,
   isTimeBeforeCurrentTime,
   hasStartTimePassed,
   findCalibrationSession,
   tsx_RotateCamera,
   tsx_SlewTargetName,
   tsx_SlewCmdCoords,
} from './run_imageSession.js';

Meteor.methods({

  updateTakeSeriesState( id, name, value ) {

   TakeSeriesTemplates.update( id, {
      $set: {
        [name]: value,
      },
   });

    tsxDebug(' [Saved] '+ name + '='+ value);
  },

});
