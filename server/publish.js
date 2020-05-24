// import { TargetSessions } from '../imports/api/targetSessions.js';
// import { TargetReports } from '../imports/api/targetReports.js';
// import { TakeSeriesTemplates } from '../imports/api/takeSeriesTemplates.js';
// import { Seriess } from '../imports/api/seriess.js';
// import { Filters } from '../imports/api/filters.js';
// import {
//   tsxInfo,
//   tsxLog,
//   tsxErr,
//   tsxWarn,
//   tsxDebug,
// } from '../imports/api/theLoggers.js';
// import {
//   tsx_UpdateDevice,
//   tsx_ServerStates,
//   tsx_SetServerState,
//   tsx_GetServerState,
//   tsx_GetServerStateValue,
//   UpdateStatus,
//   UpdateStatusWarn,
//   UpdateStatusErr,
// } from '../imports/api/serverStates.js'
import { TheSkyXInfos } from '../imports/api/theSkyXInfos.js';

Meteor.publish('tsxInfo.all', function () {
  return TheSkyXInfos.find().cursor;
});

//
// /*
// Meteor.publish("targetSessions", function pub_targetSessions() {
//   return TargetSessions.find();
// });
//
// Meteor.publish("tsxIP", function pub_tsxIP() {
//   return TheSkyXInfos.find({name: 'ip'});
// });
//
// Meteor.publish("tsxInfo", function pub_tsxInfo() {
//   return TheSkyXInfos.find({});
// });
// */
//
// /*
// Meteor.publish('tool_calibrate_via', function pubThis() {
//   return TheSkyXInfos.find({name: 'tool_calibrate_via'});
// });
// Meteor.publish('tool_calibrate_location', function pubThis() {
//   return TheSkyXInfos.find({name: 'tool_calibrate_location'});
// });
// Meteor.publish('tool_rotator_num', function pubThis() {
//   return TheSkyXInfos.find({name: 'tool_rotator_num'});
// });
// Meteor.publish('tool_rotator_type', function pubThis() {
//   return TheSkyXInfos.find({name: 'tool_rotator_type'});
// });
// Meteor.publish('tool_active', function pubThis() {
//   return TheSkyXInfos.find({name: 'tool_active'});
// });
// Meteor.publish('tool_flats_dec_az', function pubThis() {
//   return TheSkyXInfos.find({name: 'tool_flats_dec_az'});
// });
// Meteor.publish('tool_flats_location', function pubThis() {
//   return TheSkyXInfos.find({name: 'tool_flats_location'});
// });
// Meteor.publish('tool_flats_via', function pubThis() {
//   return TheSkyXInfos.find({name: 'tool_flats_via'});
// });
//
// // SESSION Controls
// Meteor.publish('defaultMeridianFlip', function pubThis() {
//   return TheSkyXInfos.find({name: 'defaultMeridianFlip'});
// });
// Meteor.publish('defaultCLSEnabled', function pubThis() {
//   return TheSkyXInfos.find({name: 'defaultCLSEnabled'});
// });
// Meteor.publish('defaultSoftPark', function pubThis() {
//   return TheSkyXInfos.find({name: 'defaultSoftPark'});
// });
//
// Meteor.publish('isFOVAngleEnabled', function pubThis() {
//   return TheSkyXInfos.find({name: 'isFOVAngleEnabled'});
// });
// Meteor.publish('isFocus3Enabled', function pubThis() {
//   return TheSkyXInfos.find({name: 'isFocus3Enabled'});
// });
// Meteor.publish('isFocus3Binned', function pubThis() {
//   return TheSkyXInfos.find({name: 'isFocus3Binned'});
// });
//
// Meteor.publish('isAutoguidingEnabled', function pubThis() {
//   return TheSkyXInfos.find({name: 'isAutoguidingEnabled'});
// });
// Meteor.publish('isCalibrationEnabled', function pubThis() {
//   return TheSkyXInfos.find({name: 'isCalibrationEnabled'});
// });
// Meteor.publish('isGuideSettlingEnabled', function pubThis() {
//   return TheSkyXInfos.find({name: 'isGuideSettlingEnabled'});
// });
//
// Meteor.publish('isCLSRepeatEnabled', function pubThis() {
//   return TheSkyXInfos.find({name: 'isCLSRepeatEnabled'});
// });
// Meteor.publish('isTwilightEnabled', function pubThis() {
//   return TheSkyXInfos.find({name: 'isTwilightEnabled'});
// });
//
// // App stuf
// Meteor.publish('currentStage', function pubThis() {
//   return TheSkyXInfos.find({name: 'currentStage'});
// });
// Meteor.publish('tsxInfo', function pubThis() {
//   return TheSkyXInfos.find({});
// });
// Meteor.publish('tsx_version', function pubThis() {
//   return TheSkyXInfos.find({name: 'tsx_version'});
// });
// Meteor.publish('tsx_date', function pubThis() {
//   return TheSkyXInfos.find({name: 'tsx_date'});
// });
// Meteor.publish('tsxIP', function pubThis() {
//   return TheSkyXInfos.find({name: 'ip'});
// });
// Meteor.publish('tsxPort', function pubThis() {
//   return TheSkyXInfos.find({name: 'port'});
// });
// Meteor.publish('srvLog', function pubThis() {
//   return AppLogsDB.find({}, {sort:{time:-1}});
// });
// Meteor.publish('activeMenu', function pubThis() {
//   return TheSkyXInfos.find({name: 'activeMenu'});
// });
//
// Meteor.publish('flatSettings', function pubThis() {
//   return TheSkyXInfos.find({name: 'flatSettings'});
// });
// Meteor.publish('targetName', function pubThis() {
//   return TheSkyXInfos.find({name: 'targetName'});
// });
// Meteor.publish('tsx_total', function pubThis() {
//   return  TheSkyXInfos.find({name: 'tsx_total'});
// });
// Meteor.publish('tsx_message', function pubThis() {
//   return TheSkyXInfos.find({name: 'tsx_message'});
// });
// Meteor.publish('scheduler_running', function pubThis() {
//   return TheSkyXInfos.find({name: 'scheduler_running'});
// });
// Meteor.publish('scheduler_report', function pubThis() {
//   return TheSkyXInfos.find({name: 'scheduler_report'});
// });
// Meteor.publish('filters', function pubThis() {
//   return Filters.find({}, { sort: { slot: 1 } });
// });
// Meteor.publish('flatSeries', function pubThis() {
//   return FlatSeries.find({});
// });
// Meteor.publish('takeSeriesTemplates', function pubThis() {
//   return TakeSeriesTemplates.find({ isCalibrationFrames: false }, { sort: { name: 1 } });
// });
// Meteor.publish('targetSessions', function pubThis() {
//   return TargetSessions.find({ isCalibrationFrames: false }, { sort: { enabledActive: -1, targetFindName: 1 } });
// });
// // targetSessions: TargetSessions.find({ }, { sort: { enabledActive: -1, targetFindName: 1 } }),
// Meteor.publish('target_reports', function pubThis() {
//   return TargetReports.find({});
// });
//
// Meteor.publish('night_plan', function pubThis() {
//   return TheSkyXInfos.find({name: 'NightPlan'});
// });
// Meteor.publish('night_plan_updating', function pubThis() {
//   return TheSkyXInfos.find({name: 'night_plan_updating'});
// });
//
// Meteor.publish("currentStage", function pub_currentStage() {
//   return TheSkyXInfos.find({name: 'currentStage'});
// });
//
// Meteor.publish('files.skySafari.all', () => {
//   return SkySafariFiles.collection.find({});
// });
//
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
//
// */
//
// /*
//
// if (Meteor.isClient) {
//   Meteor.subscribe('files.skySafari.all');
// }
//
//
// Meteor.publish('tsx_progress', function pubThis() {
//   return TheSkyXInfos.find({name: 'tsx_progress'});
// });
//
// */
