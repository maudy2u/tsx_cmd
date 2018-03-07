import { Meteor } from 'meteor/meteor';

import '../imports/api/imageSessions.js';
import '../imports/api/filters.js';
import '../imports/api/sessionTemplates.js';
import '../imports/api/theSkyXInfos.js';


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


  var CoordsHMSNow = "";
  var CoordsHMS2k = "";

  sky6RASCOMTele.GetRaDec();

  sky6Utils.ConvertEquatorialToString(sky6RASCOMTele.dRa, sky6RASCOMTele.dDec, 5);

  CoordsHMSNow = sky6Utils.strOut;

  sky6Utils.PrecessNowTo2000( sky6RASCOMTele.dRa, sky6RASCOMTele.dDec);

  sky6Utils.ConvertEquatorialToString(sky6Utils.dOut0, sky6Utils.dOut1, 5);

  CoordsHMS2k = sky6Utils.strOut;
  Out = "^          Now - " + CoordsHMSNow + "\n" + "          j2k - " + CoordsHMS2k;			// Form the output string

 */
 Meteor.methods({

   // *******************************
   // Test of the python to connect to TSX
   tsx_mountRaDec(arg1, arg2) {
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

     var net = require('net');
     var tsx = new net.Socket({writeable: true}); //writeable true does not appear to help

     tsx.on('close', function() {
         console.log('Connection closed');
     });

     tsx.on('error', function(err) {
         console.error('Connection error: ' + err);
         console.error(new Error().stack);
     });

     tsx.connect(3040, '10.9.8.17', function() {
       console.log('Connected MountRaDec');
     });

     var Out;
     tsx.setEncoding(); // used to set the string type of return
     tsx.on('data', (chunk) => {
      console.log(`Received ${chunk.length} bytes of data.`);
      console.log(chunk);
      Out = chunk;
    });

     tsx.write(cmd_real, (err) => {
       console.log('Connected MountRaDec:' + err);
     });
     tsx.reads

     return 'some return value from Mount RA: ' + Out ;

   },

// *******************************
// Test of the python to connect to TSX
//     check(arg1, String);
//     check(arg2, [Number]);
   tsx_feeder(arg1, arg2) {

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
       console.log('finished py: ' + err);
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
