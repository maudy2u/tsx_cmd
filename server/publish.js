import { TargetSessions } from '../imports/api/targetSessions.js';
import { TargetReports } from '../imports/api/targetReports.js';
import { TakeSeriesTemplates } from '../imports/api/takeSeriesTemplates.js';
import { ImagingSessionLogs } from '../imports/api/imagingSessionLogs.js';
import { Filters } from '../imports/api/filters.js';
import { TheSkyXInfos } from '../imports/api/theSkyXInfos.js';
import { AppLogsDB } from '../imports/api/theLoggers.js';
import { CalibrationFrames } from '../imports/api/calibrationFrames.js';
import { FlatSeries } from '../imports/api/flatSeries.js';
import { Seriess } from '../imports/api/seriess.js';

// *******************************
// ensure specific info is infoReadyYet
Meteor.publish('noVNC.status', function () {
  var db = TheSkyXInfos.find({name: 'isNoVNCEnabled'});
  this.ready();
  return db;
});
Meteor.publish('indigo_web_panel.status', function () {
  var db = TheSkyXInfos.find({name: 'indigo_web_panel'});
  this.ready();
  return db;
});
Meteor.publish('activeMenu.status', function () {
  var db = TheSkyXInfos.find({name: 'activeMenu'});
  this.ready();
  return db;
});

Meteor.publish('sessionDates.status', function () {
  var db = ImagingSessionLogs.find({}, {  sort: { sessionDate: -1} });

  this.ready();
  return db;
});


// *******************************
// all tsxInfo
Meteor.publish('tsxInfo.all', function () {
  var db = TheSkyXInfos.find();
  this.ready();
  return db;
});

Meteor.publish('seriess.all', function () {
  return Seriess.find();
});

Meteor.publish('targetSessions.all', function () {
  return TargetSessions.find();
});

Meteor.publish('appLogsDB.all', function () {
  return AppLogsDB.find();
});

Meteor.publish('filters.all', function () {
  return Filters.find();
});

Meteor.publish('calibrationFrames.all', function () {
  return CalibrationFrames.find();
});

Meteor.publish('flatSeries.all', function () {
  return FlatSeries.find();
});

Meteor.publish('targetReports.all', function () {
  return TargetReports.find();
});

Meteor.publish('takeSeriesTemplates.all', function () {
  return TakeSeriesTemplates.find();
});

Meteor.publish('imagingSessionLogs.all', function () {
  return ImagingSessionLogs.find();
});
