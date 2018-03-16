import { Mongo } from 'meteor/mongo';

// Used to store the sessions for a Target - the actual imaging
export const TakeSeriesTemplates = new Mongo.Collection('takeSeriesTemplates');
