import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Session } from 'meteor/session'

// import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';

import { Confirm, Input, Icon, Dropdown, Label, Table, Menu, Segment, Button, Progress, Modal, Form, Radio } from 'semantic-ui-react'

// Import the API Model
import { SessionTemplates } from '../api/sessionTemplates.js';
import { TakeSeriesTemplates} from '../api/takeSeriesTemplates.js';
import { Seriess } from '../api/seriess.js';
import { Filters } from '../api/filters.js';
import { TargetSessions } from '../api/targetSessions.js';
import { TheSkyXInfos } from '../api/theSkyXInfos.js';

// Import the UI
import TargetSessionMenu from './TargetSessionMenu.js';
import SessionTemplate from './SessionTemplate.js';
import Filter from './Filter.js';
import Series from './Series.js';
import TakeSeriesTemplateMenu from './TakeSeriesTemplateMenu.js';
import TheSkyXInfo from './TheSkyXInfo.js';

class Monitor extends Component {

    state = {

      monitorDisplay: true,
      confirmOpen: false,

      activeItem: 'Targets',
      ip: 'Not connected',
      port: 'Not connected',
      saveServerFailed: false,
      modalEnterIp: false,
      modalEnterPort: false,

      defaultMinAlt: 30,
      defaultCoolTemp: -20,
      defaultFocusTempDiff: 0.7,
      defaultMeridianFlip: true,
      defaultStartTime: 21,
      defaultStopTime: 6,
  };

  handleChange = (e, { name, value }) => this.setState({ [name]: value })
  handleToggle = (e, { name, value }) => this.setState({ [name]: !value })

  componentWillMount() {
    // do not modify the state directly
  }


  // *******************************
  // This is effectively a test methods
  // In the end everything is on the server.

  getValidSession() {
    // on the client
    console.log('getValidSession');
    var validSession;
    var found = false;
    Meteor.call("getValidSession", function (error, result) {
        // identify the error
        console.log('Error: ' + error);
        console.log('result: ' + result);
        for (var i = 0; i < result.split('|').length; i++) {
          var txt = result.split('|')[i].trim();
          console.log('Found: ' + txt);
        }
        if (error && error.error === "logged-out") {
          // show a nice error message
          Session.set("errorMessage", "Please log in to post a comment.");
        }
        else {
          // if success then TheSkyX has made this point the target...
          // now get the coordinates
          cmdSuccess = true;
          var ra = result.split('|')[1].trim();
          var dec = result.split('|')[2].trim();
          var description = result.split('|')[3].trim();
          this.setState({ra: ra});
          this.setState({dec: dec});
          this.setState({description: description});

        }
      });
   }

  // *******************************

  startSessions() {
    var validSession;
    // on the client
    console.log('startImaging');
    var found = false;
    Meteor.call("startImaging", function (error, result) {
      // identify the error
      var success = result.split('|')[0].trim();
      console.log('Error: ' + error);
      console.log('result: ' + result);
      if (success != "Success") {
        // show a nice error message
        Session.set("errorMessage", "Please confirm TSX is active.\nerror.error");
      }
      else {
        // not sure... this is to find target to start imaging...
      }
    });
    // tell server to get a valid session and report results
    // get session Details
    // tell server to start the session...
/*
    and now we monitor the session details.

    Target | Ra | DEC | angle
    focus
    Guide Results
    Camera status - taking image of Xof Y
    Report on image series progress

*/

    var d = this.props.targets[0].takeSeries.series[0];
    var f = d.frame;
    var e = d.filter;
    var e1 = d.repeat;
    var e2 = d.taken;
    var cmd = tsxCmdTakeImage(e,d.exposure);

    var remainingImages = d.repeat - d.taken;

    if( (remainingImages < d.repeat) && (remainingImages > 0) ) {
      console.log('Launching take image for: ' + d.filter + ' at ' + d.exposure + ' seconds');
      // var res = this.takeImage(series.filter,series.exposure);
      console.log('Taken image: ' +series.taken);
      series.taken++;
      console.log('Taken image: ' +series.taken);
    }
    // return;
    // on the client
    Meteor.call("startImaging", this.props.targets[0], function (error) {
      // identify the error
      if (error && error.error === "logged-out") {
        // show a nice error message
        Session.set("errorMessage", "Please log in to post a comment.");
      }
    });
  }

  closeMonitorDisplay() {
    this.setState({monitorDisplay: false});
  }

  render() {

    return (
      <Segment.Group>
        <Label>Target<Label.Detail>M1</Label.Detail></Label>
        <Label>RA<Label.Detail>3.2.1.1.1</Label.Detail></Label>
        <Label>DEC<Label.Detail>123,1231,23123,</Label.Detail></Label>
        <Label>Angle<Label.Detail>123</Label.Detail></Label>
        <Label>HA<Label.Detail>0.2</Label.Detail> not sure for this one</Label>
        <Segment>
          <Button.Group icon>
            <Button icon='play'  onClick={this.startSessions.bind(this)}/>
            <Button icon='pause'  />
            <Button icon='stop'  />
          </Button.Group>
        </Segment>
        <Segment>
          <h3>Target</h3>
        </Segment>
        <Segment>
          <h3>Focuser</h3>
          <Label>Temp<Label.Detail>-20</Label.Detail></Label>
          <Label>Position<Label.Detail>1231424</Label.Detail></Label>
        </Segment>
        <Segment>
          <h3>Camera</h3>
          <Label>Temp<Label.Detail>-20</Label.Detail></Label>
          <Label>Exposure<Label.Detail>'Information goes here'</Label.Detail>
            <Progress percent='50' progress />
          </Label>
          <Label>Filter<Label.Detail>LUM</Label.Detail></Label>
          <Label>Binning<Label.Detail>1x1</Label.Detail></Label>
          <Label>1 of 20 <Label.Detail>'Information goes here'</Label.Detail>
            <Progress percent='50' progress />
          </Label>
        </Segment>
        <Confirm
          header='Start an imaging session'
          name='confirmOpen'
          open={this.state.confirmOpen}
          content='Do you wish to continue and start an imaging session?'
          onCancel={this.handleToggle}
          onConfirm={this.startSessions.bind(this)}
        />
      </Segment.Group>
    )
  }
}
export default withTracker(() => {

  return {
    tsxIP: TheSkyXInfos.find({name: 'ip' }).fetch(),
    tsxPort: TheSkyXInfos.findOne({name: 'port' }),
    tsxInfos: TheSkyXInfos.find({}).fetch(),
    seriess: Seriess.find({}, { sort: { order: 1 } }).fetch(),
    takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
    targetSessions: TargetSessions.find({}, { sort: { name: 1 } }).fetch(),
};
})(Monitor);
