import { Meteor } from 'meteor/meteor';
import { TheSkyXInfos } from '../imports/api/theSkyXInfos.js';
import { JobCollection } from 'meteor/vsivsi:job-collection';

// *******************************
// Create the scheduler Queue
var tsxQueue = JobCollection('tsxCmds');

var tsx_waiting = false;

export function tsx_is_waiting() {
  return tsx_waiting;
}
export function stop_tsx_is_waiting() {
  tsx_waiting = false;
}
function start_tsx_is_waiting() {
  tsx_waiting = true;
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
  cmd = String(cmd);
  Meteor.sleep(3*1000);  // arbitary sleep for 3sec.
  const { ip, port } = tsx_GetPortAndIP();

  // Meteor._debug('Started tsx_feeder.');
   var Out;
   var net = require('net');
   var tsx = new net.Socket({writeable: true}); //writeable true does not appear to help
   tsx.setEncoding(); // used to set the string type of return

   tsx.on('close', function() {
       Meteor._debug('tsx_done');
   });

   tsx.on('write', function() {
       // Meteor._debug('Writing to TheSkyX.');
   });

   tsx.on('error', function(err) {
    Meteor._debug(" ******************************* ");
    Meteor._debug(cmd);
    console.error('Connection error: ' + err);
    console.error(new Error().stack);
    stop_tsx_is_waiting();
   });

   tsx.on('data', (chunk) => {
    // Meteor._debug(`Received ${chunk.length} bytes of data.`);
    // Meteor._debug('Received: '  + chunk);
    Out = chunk;
    callback(Out);
    stop_tsx_is_waiting();
   });

   tsx.connect(port, ip, function() {
     // Meteor._debug('Connected to: ' + ip +':' + port );
   });

   start_tsx_is_waiting();

   tsx.write(cmd, (err) => {
     // Meteor._debug('Sending tsxCmd: ' + cmd);
     // Meteor._debug('Sending err: ' + err);
   });


   // need a TSX WAIT FOR SCRIPT DONE...
   // https://www.w3schools.com/js/js_timing.asp
   var waiting = 0; // create arbitarty timeout
  while( tsx_waiting  ) { //}&& forceExit > 2*60*sec ) {
    tsx.reads;
    var sec = 1000;
    Meteor.sleep( sec );
    waiting = waiting + sec;
    Meteor._debug('tsx_waiting (sec): ' + waiting /sec );
  }
  tsx.close;
};


export function tsx_feeder_old( ip, port, cmd, callback ) {

    if( ip ==0 && port == 0 ) {
      loadPortAndIP();
    }

    Meteor._debug('Started tsx_feeder.');
     var Out;
     var net = require('net');
     var tsx = new net.Socket({writeable: true}); //writeable true does not appear to help
     tsx.setEncoding(); // used to set the string type of return

     tsx.on('close', function() {
         Meteor._debug('Connection closed.');
     });

     tsx.on('write', function() {
         Meteor._debug('Writing to TheSkyX.');
     });

     tsx.on('error', function(err) {
          Meteor._debug(" ******************************* ");
          Meteor._debug(cmd);
         console.error('Connection error: ' + err);
         console.error(new Error().stack);
         stop_tsx_is_waiting();
     });

     tsx.on('data', (chunk) => {
      Meteor._debug(`Received ${chunk.length} bytes of data.`);
      Meteor._debug('Received: '  + chunk);
      Out = chunk;
      callback(Out);
      stop_tsx_is_waiting();
     });

     tsx.connect(port, ip, function() {
       Meteor._debug('Connected to: ' + ip +':' + port );
     });

     start_tsx_is_waiting();

     tsx.write(cmd, (err) => {
       // Meteor._debug('Sending tsxCmd: ' + cmd);
       // Meteor._debug('Sending err: ' + err);
     });


     // need a TSX WAIT FOR SCRIPT DONE...
     // https://www.w3schools.com/js/js_timing.asp
     while( tsx_waiting ) {
      tsx.reads;
      Meteor.sleep( 1000 );
     }
     tsx.close;
     Meteor._debug('Finished function tsx_feeder.');
 };
