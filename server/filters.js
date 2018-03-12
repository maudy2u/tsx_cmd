import { Meteor } from 'meteor/meteor';
import tsx_feeder from './tsx_feeder.js';

import { Filters } from '../imports/api/filters.js';
import { FilterWheels } from '../imports/api/filters.js';

var filterWheelModel;
var filterWheelManufacturer;

Meteor.methods({

  // *******************************
  // Test of the python to connect to TSX
  // tsx_getFilterWheelMakeModel
  //tsx_loadFilterNames() {
  tsx_getFilterWheelMakeModel() {
    console.log('Loading FilterNames...');
    var cmd = "\
/* Java Script */\
/* Socket Start Packet */\
var Out;\
Out = SelectedHardware.filterWheelManufacturer + '|' + SelectedHardware.filterWheelModel;\
/* Socket End Packet */";
//  tsx_feeder(3040, '10.9.8.17', cmd, 'hello' );
tsx_feeder('10.9.8.17', 3040, cmd, function(efw) {
      var tsx_return = efw.split('|');
      console.log('Got Result EFW: ' + tsx_return[0]);
      filterWheelModel = tsx_return[0];
      filterWheelManufacturer = tsx_return[1];
    });
  },

});
