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

  // *******************************
  // tsx_loadFilterNames() {
  tsx_updateFilterNames() {

    // get the current number of filter Labels
    console.log('Loading FilterNames...');
    var cmd = "\
    /* Java Script */\
    /* Socket Start Packet */\
    var Out;\
    if ( SelectedHardware.filterWheelModel !== '<No Filter Wheel Selected>' )\
    {\
     Out = ccdsoftCamera.lNumberFilters;\
   } else {\
     Out = 'No Filter';\
   }\
    /* Socket End Packet */";

    // Get and Process the number of filters
    tsx_feeder('10.9.8.17', 3040, cmd, Meteor.bindEnvironment((res) => {

      console.log('TSX Returned: ' + res);
      var tsx_return = res.split('|');
      var fNum = tsx_return[0];
      console.log('TSX EFW SLOTS: ' + fNum);
      fTotalNum = 7;

      Filters.remove({}); // remove all filters

      // Get names for each filter
        for (var i = 0; i < fTotalNum; i++) {
          var cmd = "\
          /* Java Script */\
          /* Socket Start Packet */\
          var Out;\
          var fNum = "+ i +";\
          if ( SelectedHardware.filterWheelModel !== '<No Filter Wheel Selected>' ){\
            Out = ccdsoftCamera.szFilterName(fNum) + '|' + fNum;\
          } else {\
            Out = 'No Filter';}\
            /* Socket End Packet */";
            console.log(" ******************************* ");
            console.log(cmd);
            console.log(" ******************************* ");

          tsx_feeder('10.9.8.17', 3040, cmd, Meteor.bindEnvironment((efw) => {

            var tsx_return = efw.split('|');
            var fName = tsx_return[0];
            var fNum = tsx_return[1];
            console.log('EFW Slot: ' + fNum + ', name: ' + fName);

            Filters.insert({
              slot: fNum,
              name: fName,
              createdAt: new Date(), // current time
            });
          }));
        }
      })
    );
  },

});
