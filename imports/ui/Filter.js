import React, { Component } from 'react';
import { Filters } from '../api/filters.js';
import { HTTP } from 'meteor/http';
//import socket_io from 'socket.io';
import Response from 'meteor-node-stubs/node_modules/http-browserify/lib/response';
if (!Response.prototype.setEncoding) {
  Response.prototype.setEncoding = function(encoding) {
    // do nothing
  }
}

// Filter component - represents a single filter item
export default class Filter extends Component {
  toggleChecked() {
    // Set the checked property to the opposite of its current value
    Filters.update(this.props.filter._id, {
      $set: { checked: !this.props.filter.checked },
    });
  }

  deleteThisFilter() {
    Filters.remove(this.props.filter._id);
  }

  sendTSXTest() {

    // on the client
    Meteor.call("tsx_feeder", function (error) {
      // identify the error
      if (error && error.error === "logged-out") {
        // show a nice error message
        Session.set("errorMessage", "Please log in to post a comment.");
      }
    });


    /* Java Script */
    /* Socket Start Packet */

    //
    //	This script will return the assigned name for a filter slot
    //
    //	Ken Sturrock
    //	January 13, 2018
    //


    // Sometime around build 9050, the code that reads the filter name also destroyed the @Focus2
    // focusing model. If you are running 9050, 9051 or something around that then update to build 9127
    // or higher.
    //


// can this work?
//https://gist.github.com/tedmiston/5935757
// MAKE SURE THE JAVASCRIPT HAS THE PRE/POST FIX
    var cmd = " \
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

    /* A quick test to confirm how to update a variable
    Filters.update(this.props.filter._id, {
      name: cmd,
      // createdAt: this.props.filter.createdAt , // current time
      //  offset: this.props.filter.offset ,
    });
    */
/*
    // Socket io client
    //https://github.com/Akryum/meteor-socket-io
    const PORT = 3040;
    // Socket io client
    let socket = require('socket.io-client')(`http://10.9.8.17:3040`);

    socket.on('connect',function() {
      console.log('Client has connected to the server!');
    });
    // Add a connect listener
    socket.on('message',function(data) {
      console.log('Received a message from the server!',data);
    });
    // Add a disconnect listener
    socket.on('disconnect',function() {
      console.log('The client has disconnected!');
    });

    socket.open();
    socket.send(cmd, function(result) {
      console.log(result);
      console.log('sent');
    });
//    socket.disconnect();
//    socket.close();
    console.log('END');
*/
/*
socket= new WebSocket('ws://10.9.8.17:3040/');
console.log('Create');
socket.onopen= function() {
    console.log('opened');
    console.log(cmd);
};
console.log('1');
socket.onmessage= function(s) {
  console.log(s);
};
console.log('2');
socket.send(cmd);
console.log('DONE');
*/

/*
    console.log('START CALL');
//    HTTP.call('POST', 'http://10.9.8.17:3040', cmd, (error, result) => {
    HTTP.post('http://10.9.8.17:3040', cmd, (error, result) => {
      console.log('START');
      if (!error) {
        console.log(result.data);
      }
      if (error) {
        console.log(error);
      }
      console.log('FINISH');
    });

    console.log('DONE');
    console.log('END CALL');
*/

/*
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((TCP_IP, TCP_PORT))
    s.send(MESSAGE)
    var res_data = s.recv(BUFFER_SIZE)
    s.close()
    print "   " + res_data
    */



/* did not work
    var net = require('net');

    var client = new net.Socket({writeable: true}); //writeable true does not appear to help
    Filters.update(this.props.filter._id, {
      name: 'Got here',
    });


    client.on('close', function() {
        console.log('Connection closed');
        Filters.update(this.props.filter._id, {
          name: 'Connection closed',
        });
    });

    client.on('error', function(err) {
        console.error('Connection error: ' + err);
        console.error(new Error().stack);
        Filters.update(this.props.filter._id, {
          name: err,
        });
    });

    client.connect(3040, '10.9.8.17', function() {
      var count = 0;
      console.log('Connected');
      for(var i = 0; i < 100000; i++) {
        client.write(cmd);
        //bufferSize does not seem to be an issue
        //console.info(client.bufferSize);
      }
    });
    */
  }

  render() {

    // Give tasks a different className when they are checked off,
    // so that we can style them nicely in CSS
    const filterClassName = this.props.filter.checked ? 'checked' : '';

    return (
      <li className={filterClassName}>
      <button className="ok" onClick={this.sendTSXTest.bind(this)}>
        &times;
      </button>

        <button className="delete" onClick={this.deleteThisFilter.bind(this)}>
          &times;
        </button>

        <input
          type="checkbox"
          readOnly
          checked={!!this.props.filter.checked}
          onClick={this.toggleChecked.bind(this)}
        />

        <span className="text">{this.props.filter.name}</span>
      </li>
    );
  }
}
