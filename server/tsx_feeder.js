import { Meteor } from 'meteor/meteor';
import { TheSkyXInfos } from '../imports/api/theSkyXInfos.js';

var tsx_waiting = false;

export function tsx_is_waiting() {
  return tsx_waiting;
}

var tsxHeader =  '/* Java Script *//* Socket Start Packet */';
var tsxFooter = '/* Socket End Packet */';

function tsx_GetPortAndIP() {
  var ip = TheSkyXInfos.findOne().ip();
  var port = TheSkyXInfos.findOne().port();
  return { ip, port };
}

// *******************************
// test of generic write method...
export function tsx_feeder( cmd, callback ) {
  Meteor.sleep(3*1000);  // arbitary sleep for 2sec.
  const { ip, port } = tsx_GetPortAndIP();

  // console.log('Started tsx_feeder.');
   var Out;
   var net = require('net');
   var tsx = new net.Socket({writeable: true}); //writeable true does not appear to help
   tsx.setEncoding(); // used to set the string type of return

   tsx.on('close', function() {
       // console.log('Connection closed.');
   });

   tsx.on('write', function() {
       // console.log('Writing to TheSkyX.');
   });

   tsx.on('error', function(err) {
    console.log(" ******************************* ");
    console.log(cmd);
    console.error('Connection error: ' + err);
    console.error(new Error().stack);
   });

   tsx.on('data', (chunk) => {
    // console.log(`Received ${chunk.length} bytes of data.`);
    // console.log('Received: '  + chunk);
    Out = chunk;
    callback(Out);
    tsx_waiting = false;
   });

   tsx.connect(port, ip, function() {
     // console.log('Connected to: ' + ip +':' + port );
   });

   tsx_waiting = true;

   tsx.write(cmd, (err) => {
     // console.log('Sending tsxCmd: ' + cmd);
     // console.log('Sending err: ' + err);
   });


   // need a TSX WAIT FOR SCRIPT DONE...
   // https://www.w3schools.com/js/js_timing.asp
   while( tsx_waiting ) {
    tsx.reads;
    Meteor.sleep( 1000 );
   }
   tsx.close;
   // console.log('Finished function tsx_feeder.');
};


export function tsx_feeder_old( ip, port, cmd, callback ) {

    if( ip ==0 && port == 0 ) {
      loadPortAndIP();
    }

    console.log('Started tsx_feeder.');
     var Out;
     var net = require('net');
     var tsx = new net.Socket({writeable: true}); //writeable true does not appear to help
     tsx.setEncoding(); // used to set the string type of return

     tsx.on('close', function() {
         console.log('Connection closed.');
     });

     tsx.on('write', function() {
         console.log('Writing to TheSkyX.');
     });

     tsx.on('error', function(err) {
          console.log(" ******************************* ");
          console.log(cmd);
         console.error('Connection error: ' + err);
         console.error(new Error().stack);
     });

     tsx.on('data', (chunk) => {
      console.log(`Received ${chunk.length} bytes of data.`);
      console.log('Received: '  + chunk);
      Out = chunk;
      callback(Out);
      tsx_waiting = false;
     });

     tsx.connect(port, ip, function() {
       console.log('Connected to: ' + ip +':' + port );
     });

     tsx_waiting = true;

     tsx.write(cmd, (err) => {
       // console.log('Sending tsxCmd: ' + cmd);
       // console.log('Sending err: ' + err);
     });


     // need a TSX WAIT FOR SCRIPT DONE...
     // https://www.w3schools.com/js/js_timing.asp
     while( tsx_waiting ) {
      tsx.reads;
      Meteor.sleep( 1000 );
     }
     tsx.close;
     console.log('Finished function tsx_feeder.');
 };
