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
  // Meteor.publish('tsxPort', function tsxPortPublication() {
  //   return TheSkyXInfos.findOne().port().text;
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
    return initParam('ip').value;
  },

  port: function() {
    return initParam('port').value;
  },

  defaultMinAltitude: function() {
    return initParamWith('defautMinAlt', 30).value;
  },

  defaultFocusTempDiff: function() {
    return initParamWith('defaultFocusTemp', 0.7).value;
  },

  mount: function() {
    return initDevice('mount');
  },
  camera: function() {
    return initDevice('camera');
  },
  efw: function() {
    return initDevice('efw');
  },
  guider: function() {
    return initDevice('guider');
  },
  rotator: function() {
    return initDevice('rotator');
  },
  focuser: function() {
    return initDevice('focuser');
  },

});
