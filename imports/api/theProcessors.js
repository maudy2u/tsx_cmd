import { Mongo } from 'meteor/mongo';
// *******************************
// Create the scheduler Queue
import { JobCollection } from 'meteor/vsivsi:job-collection';
// *******************************
// Create the scheduler Queue
export const scheduler = new JobCollection('theScheduler');
// scheduler.setLogStream(process.stdout);
