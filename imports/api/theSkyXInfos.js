import { Mongo } from 'meteor/mongo';

// Used to store a sessions template - filters, exposures, quantity, focus, start, stop
export const TheSkyXInfos = new Mongo.Collection('theSkyXInfos');

if (Meteor.isServer) {
  console.log('In server');
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

TheSkyXInfos.helpers({

  ip: function() {
    return TheSkyXInfos.findOne({name: 'ip'});
  },
  port: function() {
    return TheSkyXInfos.findOne({name: 'port'});
  },

});
