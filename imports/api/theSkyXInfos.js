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

// Used to store a sessions template - filters, exposures, quantity, focus, start, stop
export const TheSkyXInfos = new Mongo.Collection('theSkyXInfos');

if (Meteor.isServer) {
  // console.log('In server');
  // This code only runs on the server
  // Meteor.publish('tsx.ip', function tsxIpPublication() {
  //   var ip = TheSkyXInfos.findOne().ip().text;
  //   console.log('FOund ip: ' + ip);
  //   return ip;
  // });
  // Meteor.publish('tsx_progress', function tsxPortPublication() {
  //   var param = TheSkyXInfos.findOne({name: 'tsx_progress'});
  //   if( typeof param == 'undefined') {
  //     var did = TheSkyXInfos.upsert({name: 'tsx_progress'}, {
  //       $set: {
  //         value: '',
  //       }
  //     });
  //     param = TheSkyXInfos.findOne({_id: did});
  //   }
  //   return param.value;
  // });

}

// used to help Helpers return the device, or init
function initDevice(devName) {
  var dev = TheSkyXInfos.findOne({name: devName});
  if( typeof dev == 'undefined') {
    var did = TheSkyXInfos.upsert({name: devName}, {
      $set: {
        model: '',
        manufacturer: '',
      }
    });
    dev = TheSkyXInfos.findOne({_id: did});
    console.log('Setup: ' + devName );
  }
  return dev;
}

function initParam(paramName) {
  var param = TheSkyXInfos.findOne({name: paramName});
  if( typeof param == 'undefined') {
    var did = TheSkyXInfos.upsert({name: paramName}, {
      $set: {
        value: '',
      }
    });
    param = TheSkyXInfos.findOne({_id: did});
    console.log('Setup: ' + paramName );
  }
  else {
    // console.log('Found ' + paramName +': ' + param.value);
  }
  return param;
}

function initParamWith(paramName, paramValue) {
  var param = TheSkyXInfos.findOne({name: paramName});
  if( typeof param == 'undefined') {
    var did = TheSkyXInfos.upsert({name: paramName}, {
      $set: {
        value: paramValue,
      }
    });
    param = TheSkyXInfos.findOne({_id:did});
    console.log('Setup: ' + paramName );
  }
  else {
    // console.log('Found ' + paramName +': ' + param.value);
  }
  return param;
}

TheSkyXInfos.helpers({

  ip: function() {
    var val =  TheSkyXInfos.findOne({name: 'ip'}).value;
    if( typeof val == 'undefined') {
      val = '';
    }
    return val;
  },

  port: function() {
    var val =  TheSkyXInfos.findOne({name: 'port'}).value;
    if( typeof val == 'undefined') {
      val = '';
    }
    return val;
  },

  defaultFocusTempDiff: function() {
    var val =  TheSkyXInfos.findOne({name: 'defaultFocusTemp'}).value;
    if( typeof val == 'undefined') {
      val = '';
    }
    return val;
  },

  mount: function() {
    var val =  TheSkyXInfos.findOne({name: 'mount'});
    if( typeof val == 'undefined') {
      val = '';
    }
    return val;
  },
  camera: function() {
    var val =  TheSkyXInfos.findOne({name: 'camera'});
    if( typeof val == 'undefined') {
      val = '';
    }
    return val;
  },
  cameraBins: function() {
    var val =  TheSkyXInfos.findOne({name: 'numberOfBins'});
    if( typeof val == 'undefined') {
      val = '';
    }
    return val;
  },
  guiderBins: function() {
    var val =  TheSkyXInfos.findOne({name: 'numGuiderBins'});
    if( typeof val == 'undefined') {
      val = '';
    }
    return val;
  },
  efw: function() {
    var val =  TheSkyXInfos.findOne({name: 'efw'});
    if( typeof val == 'undefined') {
      val = '';
    }
    return val;
  },
  numFilters: function() {
    var val =  TheSkyXInfos.findOne({name: 'numberOfFilters'});
    if( typeof val == 'undefined') {
      val = '';
    }
    return val;
  },
  guider: function() {
    var val =  TheSkyXInfos.findOne({name: 'guider'});
    if( typeof val == 'undefined') {
      val = '';
    }
    return val;
  },
  rotator: function() {
    var val =  TheSkyXInfos.findOne({name: 'rotator'});
    if( typeof val == 'undefined') {
      val = '';
    }
    return val;
  },
  focuser: function() {
    var val =  TheSkyXInfos.findOne({name: 'focuser'});
    if( typeof val == 'undefined') {
      val = '';
    }
    return val;
  },

});
