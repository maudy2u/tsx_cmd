import { TargetSessions } from '../imports/api/targetSessions.js';
import { TargetReports } from '../imports/api/targetReports.js';
import { TakeSeriesTemplates } from '../imports/api/takeSeriesTemplates.js';
import { Seriess } from '../imports/api/seriess.js';
import { Filters } from '../imports/api/filters.js';
import { TheSkyXInfos } from '../imports/api/theSkyXInfos.js';

Meteor.publish("targetSessions", function pub_targetSessions() {
  return TargetSessions.find();
});

Meteor.publish("tsxIP", function pub_tsxIP() {
  return TheSkyXInfos.find({name: 'ip'});
});

Meteor.publish("scheduler_running", function pub_scheduler_running() {
  return TheSkyXInfos.find({name: 'scheduler_running'});
});

Meteor.publish("currentStage", function pub_currentStage() {
  return TheSkyXInfos.find({name: 'currentStage'});
});

Meteor.publish("tsxInfo", function pub_tsxInfo() {
  return TheSkyXInfos.find({});
});
