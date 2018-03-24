import { Mongo } from 'meteor/mongo';
// import SimpleSchema from 'simple-schema';

// Used to store the sessions for a Target - the actual imaging
export const TargetSessions = new Mongo.Collection('targetSessions');

// TargetSessions.schema = new SimpleSchema({
//   name: {type: String},
//   targetFindName: {type: String},
//   targetImage: {type: String},
//   description: {type: String},
//   takeSeries: {type: Array},
//   ra: {type: Number, defaultValue: 0},
//   dec: {type: Number, defaultValue: 0},
//   angle: {type: Number, defaultValue: 0},
//   scale: {type: Number, defaultValue: 0},
//   coolingTemp: {type: Number, defaultValue: 0},
//   clsFliter: {type: String},
//   focusFliter: {type: String},
//   focusSamples: {type: Number, defaultValue: 0},
//   focusBin: {type: Number, defaultValue: 0},
//   guideExposure: {type: Number, defaultValue: 0},
//   guideDelay: {type: Number, defaultValue: 0},
//   startTime: {type: Date, defaultValue: 0},
//   stopTime: {type: Date, defaultValue: 0},
//   priority: {type: Number, defaultValue: 0},
//   tempChg: {type: Number, defaultValue: 0},
//   minAlt: {type: Number, defaultValue: 0},
//   completed: {type: Boolean, defaultValue: 0},
//   createdAt: {type: Date, defaultValue: 0},
// });
