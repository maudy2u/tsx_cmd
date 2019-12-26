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

import { Filters } from '../imports/api/filters.js';
import { TheSkyXInfos } from '../imports/api/theSkyXInfos.js';

import { tsxInfo, tsxLog, tsxErr, tsxWarn, tsxDebug,
  logFileForClient, AppLogsDB
} from '../imports/api/theLoggers.js';

import {
  tsx_ServerStates,
  tsx_SetServerState,
  tsx_GetServerState,
  tsx_UpdateDevice,
  tsx_GetServerStateValue,
  UpdateStatus,
  UpdateStatusErr,
  postProgressTotal,
  postProgressIncrement,
  postProgressMessage,
  UpdateImagingSesionID,
} from '../imports/api/serverStates.js';

// **************************************************************
export function getFilterSlot(filterName) {
  // need to look up the filters in TSX
  var slot = '';
  try {
    var filter = Filters.findOne({name: filterName});
    tsxDebug(' Found Filter ' + filterName + ' at slot: ' + filter.slot);
    slot = filter.slot;
  }
  catch( e ) {
    // no slot found - assumed to be the err
    slot = 0;
  }
  return slot;
}

// **************************************************************
export function getFilterName(slot) {
  // need to look up the filters in TSX
  var filterName = '';
  try {
    var filterName = Filters.findOne({slot: slot});
    filterName = filterName.name;
    tsxDebug(' Found Filter ' + slot + ' with name: ' + filterName);
  }
  catch( e ) {
    // no slot found - assumed to be the err
    filterName = 'unknown';
  }
  return filterName;
}

const frames = [
  {name: 'Light', id:1},
  {name: 'Flat', id:4},
  {name: 'Dark', id:3},
  {name: 'Bias', id:2},
];



// **************************************************************
//  cdLight =1, cdBias, cdDark, cdFlat
export function getFrame(frame) {
  // tsxDebug('************************');
  tsxDebug(' *** getFrame: ' + frame );

  var num = frames.find(function(element) {
    return element.name == frame;
  }).id;
  tsxDebug('Found '+frame+' frame number: ' + num);
  return num;
}

export function getFrameName( fid ) {
  var nam = frames.find(function(element) {
    return element.id == fid;
  }).id;
  tsxDebug('Found '+nam+' frame number: ' + fid);
  return nam;
}
