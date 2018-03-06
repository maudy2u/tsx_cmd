import { Meteor } from 'meteor/meteor';

import '../imports/api/imageSessions.js';
import '../imports/api/filters.js';
import '../imports/api/sessionTemplates.js';
import '../imports/api/theSkyXInfo.js';


/*sendToTSX((cmd), function() {
      var net = require('net');
      var client = new net.Socket({writeable: true}); //writeable true does not appear to help
      client.on('close', function() {
          console.log('Connection closed');
      });

      client.on('error', function(err) {
          console.error('Connection error: ' + err);
          console.error(new Error().stack);
      });
      client.connect(3040, '10.9.8.17', function() {
        console.log('Connected');
        client.write(cmd);
      });

});
*/

Meteor.startup(() => {
  // code to run on server at startup

  // imports/tsx/SkyX_JS_GetMntCoords.js
  // This does load the script
  //var mount = require('../imports/tsx/SkyX_JS_GetMntCoords.js');



});

/*
  THERE ARE SEVERAL SERVER STATES TO MAINTAIN FOR TSX:
  . MOUNT Connected: Y/N/PARKED/HOMED/SLEWING...
  . CAMERA CONNECTED: Y/N
  . Autoguide CONNECTED: Y/N
  . FILTERWHEEL CONNECTED: Y/N
  . FOCUSER CONNECTED: Y/N
  . ROTATOR CONNECTED: Y/N


 */
 Meteor.methods({
   tsx_feeder(arg1, arg2) {
//     check(arg1, String);
//     check(arg2, [Number]);
     var cmd_real = "\
    /* Java Script */\
    /* Socket Start Packet */\
      var Out;\
      sky6RASCOMTele.Connect();\
      if (sky6RASCOMTele.IsConnected==0)\
      {\
          Out = 'Not connected';\
      }\
      else\
      {\
          sky6RASCOMTele.GetRaDec();\
          Out  = String(sky6RASCOMTele.dRa) + '|' + String(sky6RASCOMTele.dDec);\
      }\
    /* Socket End Packet */";


     var PythonShell = require('python-shell');

     var options = {
       mode: 'text',
     //  pythonPath: 'path/to/python',
     //  pythonOptions: ['-u'],
       scriptPath: '/Users/stephen/Documents/code/tsx_cmd/imports/tsx/',
     //  args: ['value1', 'value2', 'value3']
     };

     PythonShell.run('PyTSX.py', options, function (err, results) {
       if (err) throw err;
       console.log('finished: ' + err);
       console.log(results);

     });

     if (false) {
       throw new Meteor.Error('pants-not-found', "Can't find my pants");
     }

     return 'some return value';
   },

   bar() {
     // Do other stuff...
     return 'baz';
   }
 });
