import { Mongo } from 'meteor/mongo';

// Used to store a sessions template - filters, exposures, quantity, focus, start, stop
export const SessionTemplates = new Mongo.Collection('sessionTemplates');
