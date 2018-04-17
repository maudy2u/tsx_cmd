import { Meteor } from 'meteor/meteor';
import tsx_feeder from './tsx_feeder.js';

import { Filters } from '../imports/api/filters.js';
//import { FilterWheels } from '../imports/api/filters.js';
import { TheSkyXInfos } from '../imports/api/theSkyXInfos.js';


Meteor.methods({

  // *******************************
  // Test of the python to connect to TSX
  // tsx_getFilterWheelMakeModel
  //tsx_loadFilterNames() {
  tsx_getFilterWheelMakeModel() {
    console.log('Loading FilterWheelMakeModel...');
    var cmd = "\
/* Java Script */\
/* Socket Start Packet */\
var Out;\
Out = SelectedHardware.filterWheelManufacturer + '|' + SelectedHardware.filterWheelModel;\
/* Socket End Packet */";
    tsx_feeder('10.9.8.17', 3040, cmd, Meteor.bindEnvironment((efw) => {
        var tsx_return = efw.split('|');
        var filterWheelManufacturer = tsx_return[0];
        var filterWheelModel = tsx_return[1];
        console.log('EFW make: ' + filterWheelManufacturer);
        console.log('EFW model: ' + filterWheelModel);

        TheSkyXInfos.insert({
          device: 'FilterWheel',
          model: filterWheelModel,
          make: filterWheelManufacturer,
          address: '',
          port: '',
          updated: new Date(), // current time
        });
      })
    );
  },

});
