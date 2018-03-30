import { Meteor } from 'meteor/meteor';
import { TheSkyXInfos } from '../imports/api/theSkyXInfos.js';

var tsx_waiting = false;
var ip = 0;
var port = 0;

export function tsx_is_waiting() {
  return tsx_waiting;
}

function loadPortAndIP(){
  // TheSlyXInfo... get map parameter
  // port
  //ip

}

var tsxHeader =  '/* Java Script *//* Socket Start Packet */';
var tsxFooter = '/* Socket End Packet */';

// *******************************
// test of generic write method...
export function tsx_feeder( ip, port, cmd, callback ) {
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

     cmd = tsxHeader+cmd+tsxFooter;

     tsx.write(cmd, (err) => {
       console.log('Sending tsxCmd: ' + cmd);
       console.log('Sending err: ' + err);
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
