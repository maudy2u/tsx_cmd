import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Session } from 'meteor/session'

// import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';

import { Confirm, Input, Icon, Dropdown, Label, Table, Menu, Segment, Button, Progress, Modal, Form, Radio } from 'semantic-ui-react'

//Tools
import {
  canTargetSessionStart,
  getTargetSession,
  calcTargetProgress,
} from '../api/sessionTools.js';

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

  textTSX() {
    //var d = new Date(year, month, day, hours, minutes, seconds, milliseconds);
    var currentTime = new Date();
    var startTime1 = new Date(0, 0, 0, 22, 30, 0, 0);
    var startTime2 = new Date(0, 0, 0, 22, 30, 0, 0);
    var stopTime1 = new Date(0, 0, 1, 6, 30, 0, 0);

    var ip = TheSkyXInfos.findOne({name: 'ip'});
    var port = TheSkyXInfos.findOne({name: 'port'});
    // any remaining images
    var target = getTargetSession();

    if( typeof target == 'undefined') {
      // no target found... report and exit
      var msg = 'No target found. Review targets, and concstraints.'
      console.log(msg);
    }

    var percent = calcTargetProgress(target._id);

    Meteor.call("tsx_Test", function (error, result) {
      // identify the error
      console.log('Error: ' + error);
      console.log('result: ' + result);
    });
  }

  // *******************************
  // This is effectively a test methods
  // In the end everything is on the server.

  getValidSession() {
    // on the client
    console.log('getValidSession');
    var validSession = getTargetSession();
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
    var validSession = getTargetSession();
    // on the client
    console.log('startImaging');
    var found = false;
    // this.debugStartImaging(validSession);
    // return;
    Meteor.call("startImaging", validSession, function (error, result) {
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

  }

  debugStartImaging(targetSession) {
    // process for each filter
    var template = TakeSeriesTemplates.findOne( {_id:targetSession.series._id});
    var seriesProcess = template.processSeries;
    console.log('Imaging process: ' + seriesProcess );

    var numFilters = template.series.length;
    console.log('Number of filters: ' + numFilters );

    // load the filters
    var takeSeries = [];
    for (var i = 0; i < template.series.length; i++) {
      var series = Seriess.findOne({_id:template.series[i].id});
      console.log('Got series - ' + template.series[i].id + ', ' + series.filter);
      if( typeof series != 'undefined') {
        takeSeries.push(series);
      }
    }
    console.log('Number of series: ' + takeSeries.length);
    // sort the by the order.
    takeSeries.sort(function(a, b){return b.order-a.order});
    console.log('Sorted series: ' + takeSeries.length);
    // set up for the cycle through the filters
    for (var i = 0; i < takeSeries.length; i++) {

      // do we go across the set of filters once and then repear
      if( seriesProcess === 'across series' ) {
        // use length and cycle until a stop condition
        var remainingImages = false;
        for (var acrossSeries = 0; acrossSeries < takeSeries.length; acrossSeries++) {
          // take image
          var series = takeSeries[acrossSeries]; // get the first in the order

          // take image
          // var res = takeSeriesImage(series);
          console.log('Took image: ');// +res);

          // check end conditions
          if( !remainingImages && series.taken < series.repeat ) {
            remainingImages = true;
          }
        }
        // reset to check across series again
        if( remainingImages ) {
          i=0;
        }
      }

      // do we do one whole filter first.
      else if ( seriesProcess === 'per series' ) {
        // use i to lock to the current filter
        var series = takeSeries[i]; // get the first in the order

        var numImages = series.repeat - series.taken;
        for (var perSeries = 0; perSeries < numImages; repeatSeries++) {

          // take image
          // var res = takeSeriesImage(series);
          console.log('Took image: ' );

        }
        // now switch to next filter
      }
      else {
        console.log('*** FAILED to process seriess');
      }
    }
    // takeImage(exposure, filter)
    // check Twilight - force stop
    // check minAlt - stop - find next
    // check stopTime - stop - find next
    // check reFocusTemp - refocus
    // if not meridian - dither...
    // if meridian  - flip/slew... - preRun: focus - CLS - rotation - guidestar - guiding...
    // if targetDone/stopped... find next

  }


  closeMonitorDisplay() {
    this.setState({monitorDisplay: false});
  }

  tsxStat() {
    return this.props.tsxStatus.value;
  }

  render() {

// sample data: 	echo "`date "+%H:%M:%S"` Mount Direction: $mntDir, Altitude: $mntAlt degrees "

    return (
      <Segment.Group>
        <Label>Target <Label.Detail>M1</Label.Detail></Label>
        <Label>RA <Label.Detail>3.2.1.1.1</Label.Detail></Label>
        <Label>DEC <Label.Detail>123,1231,23123,</Label.Detail></Label>
        <Label>Angle <Label.Detail>123</Label.Detail></Label>
        <Label>HA <Label.Detail>0.2</Label.Detail></Label>
        <Label>Status <Label.Detail>{this.tsxStat()}</Label.Detail></Label>
        <Segment>
          <Button.Group icon>
            <Button icon='play'  onClick={this.startSessions.bind(this)}/>
            <Button icon='pause'  />
            <Button icon='stop'  />
            <Button onClick={this.textTSX.bind(this)}>Test</Button>
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
    tsxStatus: TheSkyXInfos.findOne({name: 'currentStage' }),
    tsxIP: TheSkyXInfos.find({name: 'ip' }).fetch(),
    tsxPort: TheSkyXInfos.findOne({name: 'port' }),
    tsxInfos: TheSkyXInfos.find({}).fetch(),
    seriess: Seriess.find({}, { sort: { order: 1 } }).fetch(),
    takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
    targetSessions: TargetSessions.find({}, { sort: { name: 1 } }).fetch(),
};
})(Monitor);
