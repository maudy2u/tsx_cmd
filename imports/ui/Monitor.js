import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Session } from 'meteor/session'

// import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';

import { Confirm, Input, Icon, Dropdown, Label, Table, Menu, Segment, Button, Progress, Modal, Form, Radio } from 'semantic-ui-react'

import {
  tsx_ServerStates,
  tsx_UpdateServerState,
  tsx_GetServerState,
} from  '../api/serverStates.js';

// Import the API Model
import { TakeSeriesTemplates} from '../api/takeSeriesTemplates.js';
import { Seriess } from '../api/seriess.js';
import { TargetSessions } from '../api/targetSessions.js';
import { TheSkyXInfos } from '../api/theSkyXInfos.js';

// Import the UI
import Target  from './Target.js';
import TargetSessionMenu from './TargetSessionMenu.js';
// import Filter from './Filter.js';
import Series from './Series.js';
import TakeSeriesTemplateMenu from './TakeSeriesTemplateMenu.js';
import TheSkyXInfo from './TheSkyXInfo.js';

class Monitor extends Component {

    state = {

      currentTarget: 'None',
      monRA: '_',
      monDEC: '_',
      monALT: '_',
      monAZ: '_',
      monAngle: '_',
      monHA: '_',
      monTransit: '_',
      monitorStatus: '_',

      monitorDisplay: true,
      confirmOpen: false,

      activeItem: 'Targets',

      defaultMinAlt: 30,
      defaultCoolTemp: -20,
      defaultFocusTempDiff: 0.7,
      defaultMeridianFlip: true,
      defaultStartTime: 21,
      defaultStopTime: 6,
      noFoundSession: false,
      noFoundSessions: [],

      focusTemp: '_',
      focusPos: '_',
      cameraTemp: '_',
      filter: '_',
      binning: '_',

  };

  handleChange = (e, { name, value }) => this.setState({ [name]: value })
  handleToggle = (e, { name, value }) => this.setState({ [name]: !value })
  noFoundSessionOpen = () => this.setState({ noFoundSession: true })
  noFoundSessionClose = () => this.setState({ noFoundSession: false })

  componentWillReceiveProps(nextProps) {
    this.updateMonitor(nextProps);
  }

  textTSX2() {


    // *******************************
    // get a session to use
    Meteor.call("tsxTestImageSession", function (error, result) {
      if ( error ) {
        // show a nice error message
        this.noFoundSessionOpen();
        Session.set("errorMessage", "Please check connection and constraints.");
      }
      else {

        // *******************************
        // START AN IMAGE SERIES
        // if success then TheSkyX has made this point the target...
        // now get the coordinates
        var sessionId = result.split('|')[0].trim();
        Meteor.call("startImaging", sessionId, function (error, result) {


        }.bind(this));
      }
    }.bind(this));
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

    Meteor.call("tsxTestImageSession", function (error, result) {
      console.log('Error: ' + error);
      console.log('result: ' + result);
      for (var i = 0; i < result.split('|').length; i++) {
        var txt = result.split('|')[i].trim();
        console.log('Found: ' + txt);
      }
      if (error && error.error === "logged-out") {
        // show a nice error message
        this.noFoundSessionOpen();

        Session.set("errorMessage", "Please log in to post a comment.");
      }
      else {
        // if success then TheSkyX has made this point the target...
        // now get the coordinates
        cmdSuccess = true;
    }
  }.bind(this));
}

  // *******************************
  // This is effectively a test methods
  // In the end everything is on the server.
  getTargetDetails(target) {

    Meteor.call("targetFind", target.targetFindName, function (error, result) {
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
          var altitude = result.split('|')[3].trim();
          this.setState({monRA: ra});
          this.setState({monDEC: dec});
          this.setState({monALT: atl});
          var azimuth = result.split('|')[4].trim();
          if (azimuth < 179)
          //
          // Simplify the azimuth value to simple east/west
          //
          {
            this.setState({monAZ: "East"});
          } else {
            this.setState({monAZ: "West"});
          }

        }
      }.bind(this));
  }

  // *******************************

  startSessions() {
    Meteor.call("startScheduler", function (error, result) {
      }.bind(this));
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

        var taken = targetSession.imagesTakenFor(series._id);
        var numImages = series.repeat - taken;
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

  totalTaken() {
    try {
      return TargetSessions.findOne({_id: this.props.target._id}).totalImagesTaken();
    } catch (e) {
      // Do nothing
    }
    return 0;
  }

  totalPlanned() {
    try {
      return TargetSessions.findOne({_id: this.props.target._id}).totalImagesPlanned();
    } catch (e) {
      // Do nothing
    }
    return 0;
  }

  updateMonitor(nextProps) {
    this.setState({
      targetImageName: nextProps.tsxInfo.find(function(element) {
        return element.name == 'targetImageName';
      }).value,
      targetRA: nextProps.tsxInfo.find(function(element) {
        return element.name == 'targetRA';
      }).value,
      targetDEC: nextProps.tsxInfo.find(function(element) {
        return element.name == 'targetDEC';
      }).value,
      targetALT: nextProps.tsxInfo.find(function(element) {
        return element.name == 'targetALT';
      }).value,
      targetAZ: nextProps.tsxInfo.find(function(element) {
        return element.name == 'targetAZ';
      }).value,
      targetHA: nextProps.tsxInfo.find(function(element) {
        return element.name == 'targetHA';
      }).value,
      targetTransit: nextProps.tsxInfo.find(function(element) {
        return element.name == 'targetTransit';
      }).value,
      currentStage: nextProps.tsxInfo.find(function(element) {
        return element.name == 'currentStage';
      }).value,
    });
  }

  confirmPlayScheduler() {
    this.setState({confirmOpen: true});
  }

  playScheduler() {
    Meteor.call("startScheduler", function (error, result) {
      }.bind(this));
  }

  pauseScheduler() {
    Meteor.call("pauseScheduler", function (error, result) {
      }.bind(this));
  }

  stopScheduler() {
    // this.tsxStopSession();
    Meteor.call("stopScheduler", function (error, result) {
        // identify the error
        tsx_UpdateServerState(tsx_ServerStates.imagingSessionId, '' );
        tsx_UpdateServerState(tsx_ServerStates.targetImageName, '');
        tsx_UpdateServerState(tsx_ServerStates.targetDEC, '_');
        tsx_UpdateServerState(tsx_ServerStates.targetRA, '_');
        tsx_UpdateServerState(tsx_ServerStates.targetALT, '_');
        tsx_UpdateServerState(tsx_ServerStates.targetAZ, '_');
        tsx_UpdateServerState(tsx_ServerStates.targetHA, '_');
        tsx_UpdateServerState(tsx_ServerStates.targetTransit, '_');
        tsx_UpdateServerState(tsx_ServerStates.currentStage, 'Stopped');

      }.bind(this));
  }

  testTryTarget() {
    Meteor.call( 'testTryTarget', function(error, result) {
      console.log('Error: ' + error);
      console.log('result: ' + result);
    }.bind(this));
  }

  testPicking() {
    Meteor.call( 'testTargetPicking', function(error, result) {
      console.log('Error: ' + error);
      console.log('result: ' + result);
    }.bind(this));
  }

  testEndConditions() {
    Meteor.call( 'testEndConditions', function(error, result) {
      console.log('Error: ' + error);
      console.log('result: ' + result);
    }.bind(this));
  }

  testTakeSeries() {

    Meteor.call( 'startImaging', this.props.targetImageName, function(error, result) {
      console.log('Error: ' + error);
      console.log('result: ' + result);
    }.bind(this));
  }

  renderTarget() {
    var sid = this.props.targetSessionId;
    var tid = sid[0].value;
    var target;
    var str;
    try {
      target = TargetSessions.findOne({_id:tid});
      return (
        <Target key={tid} target={target} />
      )
    } catch (e) {
      console.log('error');
      return (
        <div/>
      )
    }
  }

  render() {

// sample data: 	echo "`date "+%H:%M:%S"` Mount Direction: $mntDir, Altitude: $mntAlt degrees "

    return (
      <Segment.Group>
        <Segment>
          <Label>RA <Label.Detail>{Number(this.state.targetRA).toFixed(4)}</Label.Detail></Label>
          <Label>DEC <Label.Detail>{Number(this.state.targetDEC).toFixed(4)}</Label.Detail></Label>
          <Label>Angle <Label.Detail>{Number(this.state.targetAngle).toFixed(4)}</Label.Detail></Label>
        </Segment>
        <Segment>
          <Label>Atl <Label.Detail>{Number(this.state.targetALT).toFixed(4)}</Label.Detail></Label>
          <Label>Az <Label.Detail>{this.state.targetAZ}</Label.Detail></Label>
          <Label>HA <Label.Detail>{Number(this.state.targetHA).toFixed(4)}</Label.Detail></Label>
          <Label>Transit <Label.Detail>{Number(this.state.targetTransit).toFixed(4)}</Label.Detail></Label>
        </Segment>
        <Segment>
          <h3>Scheduler: </h3>
          <Button.Group icon>
            <Button icon='play'  onClick={this.playScheduler.bind(this)}/>
            {/* <Button icon='pause' onClick={this.pauseScheduler.bind(this)}  /> */}
            <Button icon='stop' onClick={this.stopScheduler.bind(this)} />
            {/*

            <Button onClick={this.textTSX.bind(this)}>Test</Button>
            <Button onClick={this.textTSX2.bind(this)}>Test2</Button>
            imagesTaken: TargetSessions.findOne({_id: this.props.target._id}).totalImagesTaken(),
            imagesPlanned: TargetSessions.findOne({_id:this.props.target._id}).totalImagesPlanned(),

            */}
        </Button.Group>
        <Button.Group icon floated='right'>
          <Button icon='checkmark box' onClick={this.testPicking.bind(this)} />
          <Button icon='move' onClick={this.testEndConditions.bind(this)} />
          <Button icon='find' onClick={this.testTryTarget.bind(this)} />
          <Button icon='camera' onClick={this.testTryTarget.bind(this)} />
        </Button.Group>
          {/* <Progress
            value={this.totalTaken()}
            total={this.totalPlanned()}
            progress='ratio'>Images Taken</Progress> */}
        </Segment>
        <Segment>
        {this.renderTarget()}
        </Segment>
        {/*  */}
        {/* <Segment>
          <h3>Focuser  <Label>Temp<Label.Detail>{this.state.focusTemp}</Label.Detail></Label>
          <Label>Position<Label.Detail>{this.state.focusPos}</Label.Detail></Label>
          </h3>
        </Segment>
        <Segment>
          <h3>Camera <Label>Temp<Label.Detail>{this.state.cameraTemp}</Label.Detail></Label>
            <Label>Filter<Label.Detail>{this.state.filter}</Label.Detail></Label>
            <Label>Binning<Label.Detail>{this.state.binning}</Label.Detail></Label>
          </h3>
          <Progress percent='50' progress>Current Exposure</Progress>
          <Progress value='3' total='5' progress='ratio'>Frames per Filter</Progress>
        </Segment> */}
        <Confirm
          header='Start an imaging session'
          name='confirmOpen'
          open={this.state.confirmOpen}
          content='Do you wish to continue and start an imaging session?'
          onCancel={this.handleToggle}
          onConfirm={this.startSessions.bind(this)}
        />
        <Modal
          open={this.state.noFoundSession}
          onClose={this.noFoundSessionClose.bind(this)}
          basic
          size='small'
          closeIcon>
          <Modal.Header>Could not find a session</Modal.Header>
          <Modal.Content>
            <h3>content='There were no sessions that could be run. Please check the constraints on the sessions and that at least on is enabled.'
            </h3>
          </Modal.Content>
          <Modal.Actions>
            <Button color='red' onClick={this.noFoundSessionClose.bind(this)} inverted>
              <Icon name='stop' /> Try again!
            </Button>
          </Modal.Actions>
        </Modal>

      </Segment.Group>
    )
  }
}
export default withTracker(() => {

  return {
    targetSessionId: TheSkyXInfos.find({name: 'imagingSessionId'}).fetch(),
    targetImageDEC: TheSkyXInfos.findOne({ name: tsx_ServerStates.targetDEC }),
    targetImageRA: TheSkyXInfos.findOne({ name: tsx_ServerStates.targetRA }),
    targetImageALT: TheSkyXInfos.findOne({ name: tsx_ServerStates.targetALT }),
    targetImageAZ: TheSkyXInfos.findOne({ name: tsx_ServerStates.targetAZ }),
    targetHA: TheSkyXInfos.findOne({ name: tsx_ServerStates.targetHA }),
    targetTransit: TheSkyXInfos.findOne({ name: tsx_ServerStates.targetTransit }),
    tsxInfo: TheSkyXInfos.find({}).fetch(),
    seriess: Seriess.find({}, { sort: { order: 1 } }).fetch(),
    takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
    targetSessions: TargetSessions.find({}, { sort: { name: 1 } }).fetch(),
};
})(Monitor);
