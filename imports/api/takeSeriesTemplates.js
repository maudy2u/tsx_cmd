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
import { Seriess } from './seriess.js';

// Used to store the sessions for a Target - the actual imaging
export const TakeSeriesTemplates = new Mongo.Collection('takeSeriesTemplates');

export function addNewTakeSeriesTemplate() {
  const id = TakeSeriesTemplates.insert(
    {
      name: "!New Take Series",
      description: "",
      processSeries: 'across series',
      repeatSeries: false,
      createdAt: new Date(),
      series: [],
      isCalibrationFrames: false,
    }
  );

  return id;
}

export function seriesDescription( template ) {

    // CURRENTLY: 0:33x3s, 1:33x3s, 2:33x3s, 3:33x3s
    // WANT: LIGHT:LUM@33X3S
    let seriesArray = template.series;
    let details = "";
    let repeating = '';
    if( template.repeatSeries ) {
      repeating = 'repeating, ';
    }
    for (let i = 0; i < seriesArray.length; i++) {
      let series = Seriess.findOne({_id:seriesArray[i].id});
      if( typeof series == 'undefined') {
        continue;
      }
      if(details != "") { details += ", "};
      details += series.frame +':' + series.filter + '@' + series.exposure + 'sec x'  + series.repeat;
    }



    return 'Series: ' + repeating + 'dithering ' + template.defaultDithering + ', ' + details;
  }
