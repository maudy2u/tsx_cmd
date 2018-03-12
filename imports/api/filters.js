import { Mongo } from 'meteor/mongo';

// Used to store the filters currently available/active on TSX
export const Filters = new Mongo.Collection('filters');
export const FilterWheels = new Mongo.Collection('filterWheels');
