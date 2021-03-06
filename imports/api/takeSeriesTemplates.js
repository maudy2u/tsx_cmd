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

/*
  TakeSeriesTemplates = {
    name: '',
    description: '',
    processSeries:  '',
    repeatSeries: '',
    defaultDithering: 0,
    series: '',
    isCalibrationFrames - deprecated

  };
*/
// get defaults
// e.g. var clsFilter = TheSkyXInfos.findOne({name: 'defaultFilter'}).value;
export function addNewTakeSeriesTemplate() {
  const id = TakeSeriesTemplates.insert(
    {
      name: "!New Take Series",
      description: "",
      processSeries: 'across series',
      repeatSeries: false,
      createdAt: new Date(),
      defaultDithering: 0,
      series: [],
      isCalibrationFrames: false,
    }
  );

  return id;
}
export function takeSeriesDropDown() {
  var items = TakeSeriesTemplates.find().fetch();
  var dropDownArray = [];
  for (var i = 0; i < items.length; i++) {
    dropDownArray.push({
      key: items[i]._id,
      text: items[i].name,
      value: items[i]._id });
  }
  return dropDownArray;
}

export function getTakeSeriesName( tSeries ) {

  var name = '';
  if( typeof tSeries._id != 'undefined' && tSeries._id !='') {
    var obj = TakeSeriesTemplates.findOne({_id: tSeries._id});
    if( typeof obj != 'undefined' && obj != '') {
      name = obj.name;
    }
  }
  return name;
}

// DEPRECATED *******************************
// attempt to replace with takeSeriesDropDown
export function getTakeSeriesTemplates(takeSeriesTemplates) {
  var options = [];
  var count =0;
  takeSeriesTemplates.forEach((series) => {
    //      { key: 0, text: 'Static LUM', value: 0 },
    // options.push({key:series._id, text:series.name, value: { _id:series._id, text:series.name, value:series.name }});
    options.push({
      key:series._id,
      text:series.name,
      value: series.name });
    count++;
    // console.log(`Found series._id: ${series._id}, name: ${series.name}`);
  });
  return options;
}

export function updateTakeSeriesTemplate( fid, name, value ) {
  var obj = TakeSeriesTemplates.findOne({_id:fid});
  if( typeof obj != 'undefined') {
    if( name == 'name') {
      obj.name = value;
    }
    else if( name == 'description') {
      obj.description = value;
    }
    else if( name == 'processSeries') {
      obj.processSeries = value;
    }
    else if( name == 'repeatSeries') {
      obj.repeatSeries = value;
    }
    else if( name == 'defaultDithering') {
      obj.defaultDithering = value;
    }
    else if( name == 'createdAt') {
      obj.createdAt = value;
    }
    else if( name == 'isCalibrationFrames') { // remove???
      obj.isCalibrationFrames = value;
    }
    else if( name == 'order') { // remove??
      obj.order = value;
    }

    TakeSeriesTemplates.update({_id: obj._id}, {
      $set: {
        name: obj.name,
        description: obj.description,
        processSeries: obj.processSeries,
        repeatSeries: obj.repeatSeries,
        createdAt: obj.createdAt,
        isCalibrationFrames: obj.isCalibrationFrames,
        defaultDithering: obj.defaultDithering,
      }
    });
  }
}


export function seriesDescription( sid ) {
    var template = TakeSeriesTemplates.findOne({_id: sid });
    if( typeof template == 'undefined' || template == '' ) {
      return 'PLEASE ASSIGN A TAKE SERIES';
    }
    // CURRENTLY: 0:33x3s, 1:33x3s, 2:33x3s, 3:33x3s
    // WANT: LIGHT:LUM@33X3S
    let seriesArray = template.series;
    let details = "";
    let repeating = '';
    if( typeof template.repeatSeries != 'undefined'  && template.repeatSeries !='' ) {
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

    var dithering = '';
    if ( template.defaultDithering > 0 ) {
      dithering = 'dithering ' + template.defaultDithering + ', '
    }

    return 'TAKE SERIES - ' + template.name +'='+ template.processSeries + ': ' + repeating + dithering + details;
  }
