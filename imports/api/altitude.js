import { Mongo } from 'meteor/mongo';

// Used to store the filters currently available/active on TSX
export const Altitude = new Mongo.Collection('altitude');
