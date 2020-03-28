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
import { Mongo } from 'meteor/mongo';
import {
   tsx_GetServerStateValue,
} from './serverStates.js';

// Used to store the filters currently available/active on TSX
export function renderDropDownGuiderBinnings() {
  var bins = tsx_GetServerStateValue( 'numGuiderBins' );

  if( typeof bins == 'undefined' ) {
    bins = 1
  }
  var binArray = [];
  for (var i = 0; i < bins; i++) {
    var bin = i+1;
    binArray.push({
      key: bin+'x'+bin,
      text: bin+'x'+bin,
      value: bin+'x'+bin
    });
  }

  return binArray;
};

// Used to store the filters currently available/active on TSX
export function renderDropDownImagingBinnings() {
  var bins = tsx_GetServerStateValue( 'numberOfBins' );

  if( typeof bins == 'undefined' ) {
    bins = 1
  }
  var binArray = [];
  for (var i = 0; i < bins; i++) {
    var bin = i+1;
    binArray.push({
      key: bin+'x'+bin,
      text: bin+'x'+bin,
      value: bin+'x'+bin
    });
  }

  return binArray;
};

export function getBinningNumber ( bStr ) {
  var num = 1;
  var pNum = bStr.split('x')[0].trim();
  if( typeof pNum != 'undefined' || pNum > 1 ) {
    num = pNum;
  }

  return num;
}
