/*
tsx cmd - A web page to send commands to TheSkyX server
    Copyright (C) 2018  Stephen Townsend

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

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
import { TargetSessions } from '../api/targetSessions.js';
import { TargetReports } from '../api/targetReports.js';
import { TheSkyXInfos } from '../api/theSkyXInfos.js';

// Import the UI
import Target  from './Target.js';
import TargetSessionMenu from './TargetSessionMenu.js';
// import Filter from './Filter.js';
import Series from './Series.js';
import TakeSeriesTemplateMenu from './TakeSeriesTemplateMenu.js';
//import TheSkyXInfo from './TheSkyXInfo.js';

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
      monIsDark: '_',
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

      tsx_progress: 0,
      tsx_total: 0,
      tsx_actions: '',
      targetSessionId: '',

      isTwilightEnabled: true,
      isFocus3Enabled: false,
      isFocus3Binned: false,
      defaultMeridianFlip: true,
      defaultSoftPark: false,
      defaultCLSEnabled: true,

      enableImagingCooler: false,

  };

  handleChange = (e, { name, value }) => this.setState({ [name]: value });
//  handleToggle = (e, { name, value }) => this.setState({ [name]: !value });

  // requires the ".bind(this)", on the callers
  handleToggle = (e, { name, value }) => {

    var val = eval( 'this.state.' + name);

    this.setState({
      [name]: !val
    });
    this.toggleDefaultState( name, !val );
  };

  noFoundSessionOpen = () => this.setState({ noFoundSession: true })
  noFoundSessionClose = () => this.setState({ noFoundSession: false })

  componentWillReceiveProps(nextProps) {
    this.updateMonitor(nextProps);
  }

  // Use this method to save any defaults gathered
  saveDefaults(){

    // this.saveDefaultState('ip');
    // this.saveDefaultState('port');
    this.saveDefaultState('defaultMeridianFlip');
    this.saveDefaultState('defaultSoftPark');
    this.saveDefaultState('isTwilightEnabled');
    this.saveDefaultState('isFocus3Enabled');
    this.saveDefaultState('defaultCLSEnabled');
    this.saveDefaultState('enableImagingCooler');

  }

  // Generic Method to determine default to save.
  saveDefaultState( param ) {
    var value = eval("this.state."+param);

    Meteor.call( 'updateServerState', param, value , function(error, result) {

        if (error && error.error === "logged-out") {
          // show a nice error message
          Session.set("errorMessage", "Please fix.");
        }
    });//.bind(this));
  }

  // Generic Method to determine default to save.
  toggleDefaultState( param, val ) {
    Meteor.call( 'updateServerState', param, val , function(error, result) {

        if (error && error.error === "logged-out") {
          // show a nice error message
          Session.set("errorMessage", "Please fix.");
        }
    });//.bind(this));
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

  startSessions() {
    Meteor.call("startScheduler", function (error, result) {
      }.bind(this));
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

    try {
      this.setState({ // use this to trigger reloading the Monitor Target
        targetSessionId: nextProps.tsxInfo.find(function(element) {
          return element.name == 'imagingSessionId';
        }).value,
      });

      var tid = this.state.targetSessionId;//.value;
      // reports
      var report = TargetReports.findOne( {
        target_id: tid
      });

      this.setState({
        monRA: report.RA,
        monDEC: report.DEC,
        monALT: report.ALT,
        monAZ: report.AZ,
        monHA: report.HA,
        monTransit: report.TRANSIT,
        monAngle: report.angle,
        monIsDark: report.isDark,
      });

      this.setState({
        tsx_total: nextProps.tsxInfo.find(function(element) {
          return element.name == 'tsx_total';
        }).value,
        tsx_progress: nextProps.tsxInfo.find(function(element) {
          return element.name == 'tsx_progress';
        }).value,
      });
    }
    finally {

    }
  }

  componentDidMount() {
    this.updateDefaults(this.props);
  }

  updateDefaults(nextProps) {
    if( typeof nextProps == 'undefined'  ) {
      return;
    }

    if( typeof nextProps.tsxInfo == 'undefined'  ) {
      return;
    }

    this.setState({
      defaultMeridianFlip: Boolean(nextProps.tsxInfo.find(function(element) {
        return element.name == 'defaultMeridianFlip';
      }).value),
      defaultSoftPark: Boolean(nextProps.tsxInfo.find(function(element) {
        return element.name == 'defaultSoftPark';
      }).value),
      isTwilightEnabled: nextProps.tsxInfo.find(function(element) {
        return element.name == 'isTwilightEnabled';
      }).value,
      isFocus3Enabled: nextProps.tsxInfo.find(function(element) {
        return element.name == 'isFocus3Enabled';
      }).value,
      isFocus3Binned: nextProps.tsxInfo.find(function(element) {
        return element.name == 'isFocus3Binned';
      }).value,
      defaultCLSEnabled: nextProps.tsxInfo.find(function(element) {
        return element.name == 'defaultCLSEnabled';
      }).value,
      enableImagingCooler: nextProps.tsxInfo.find(function(element) {
        return element.name == 'enableImagingCooler';
      }).value,

    });

  }

  confirmPlayScheduler() {
    this.setState({confirmOpen: true});
  }

  playScheduler() {
    Meteor.call("startScheduler", function (error, result) {
      this.forceUpdate();
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

  getCurrentTarget() {
    var tid = this.props.targetSessionId[0].value;
    var target = TargetSessions.findOne({_id: tid });
    // #TODO report no valid target


    return target;
  }

  testTryTarget() {
    Meteor.call( 'testTryTarget', this.getCurrentTarget(), function(error, result) {
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

  startImaging() {

    Meteor.call( 'startImaging', this.getCurrentTarget(), function(error, result) {
      console.log('Error: ' + error);
      console.log('result: ' + result);
    }.bind(this));
  }

  testDither() {

    Meteor.call( 'testDither', this.getCurrentTarget(),  function(error, result) {
      console.log('Error: ' + error);
      console.log('result: ' + result);
    }.bind(this));
  }

  testGuide() {

    Meteor.call( 'testGuide', this.getCurrentTarget(),  function(error, result) {
      console.log('Error: ' + error);
      console.log('result: ' + result);
    }.bind(this));
  }

  testSolve() {

    Meteor.call( 'testSolve', this.getCurrentTarget(),  function(error, result) {
      console.log('Error: ' + error);
      console.log('result: ' + result);
    }.bind(this));
  }

  testFocus3 () {

    Meteor.call( 'testFocus3', this.getCurrentTarget(),  function(error, result) {
      console.log('Error: ' + error);
      console.log('result: ' + result);
    }.bind(this));
  }

  testAbortGuide () {

    Meteor.call( 'testAbortGuide', this.getCurrentTarget(),  function(error, result) {
      console.log('Error: ' + error);
      console.log('result: ' + result);
    }.bind(this));
  }

  testMatchRotation() {

    Meteor.call( 'testMatchRotation', this.getCurrentTarget(),  function(error, result) {
      console.log('Error: ' + error);
      console.log('result: ' + result);
    }.bind(this));
  }

  renderTarget( tid ) {
    var target;
    var str;
    try {
      target = TargetSessions.findOne({_id:tid});
      if( tid == '' ) {
        return (
          <Label>No active target</Label>
        )
      }
      else {
        return (
          <Target key={tid} target={target} />
        )
      }
    } catch (e) {
      console.log('error');
      return (
        <Label>No active target</Label>
      )
    }
  }

  getTsxActions() {

    var actionArray = [];
    actionArray.push({
      key: 'Pick',
      text: 'test Picking target',
      value: 'Pick'
    });
    actionArray.push({
      key: 'Test End',
      text: 'Test End',
      value: 'Test End'
    });
    actionArray.push({
      key: '@Focus3',
      text: '@Focus3',
      value: '@Focus3'
    });
    actionArray.push({
      key: 'Dither',
      text: 'Dither',
      value: 'Dither'
    });
    actionArray.push({
      key: 'Guide',
      text: 'Guide',
      value: 'Guide'
    });
    actionArray.push({
      key: 'Solve',
      text: 'Solve',
      value: 'Solve'
    });
    actionArray.push({
      key: 'Test Angle',
      text: 'Test Angle',
      value: 'Test Angle'
    });
    actionArray.push({
      key: 'Start Series',
      text: 'Start Series',
      value: 'Start Series'
    });
    actionArray.push({
      key: 'AbortGuide',
      text: 'AbortGuide',
      value: 'AbortGuide'
    });


    return actionArray;
  }

  handleTsx_actionsChange = (e, { name, value }) => {
    this.setState({ [name]: value })
  };

  dropDownAction() {

    var value = this.state.tsx_action;

    if( value == 'Pick' ) {
      this.testPicking();
    }
    else if ( value == 'Test End' ) {
      this.testEndConditions();
    }
    else if ( value == '@Focus3' ) {
      this.testFocus3();
    }
    else if ( value == 'Dither' ) {
      this.testDither();
    }
    else if ( value == 'Guide' ) {
      this.testGuide();
    }
    else if ( value == 'Solve' ) {
      this.testSolve();
    }
    else if ( value == 'Test Angle' ) {
      this.testMatchRotation();
    }
    else if ( value == 'Start Series' ) {
      this.startImaging();
    }
    else if ( value == 'AbortGuide' ) {
      this.testAbortGuiding();
    }

  };

  render() {

    var tsx_actions = this.getTsxActions();

    return (
      <div>
         <Segment raised>
           <h3>Scheduler: </h3>
           <Button.Group icon>
             <Button icon='play'  onClick={this.playScheduler.bind(this)}/>
             {/* <Button icon='pause' onClick={this.pauseScheduler.bind(this)}  /> */}
             <Button icon='stop' onClick={this.stopScheduler.bind(this)} />
             <Button icon='refresh' onClick={this.updateMonitor.bind(this)}/>
          </Button.Group>
        {/* </Segment>
           {/* <Segment> */}
          {/* <Form.Group widths='equal'> */}
            {/* <Dropdown compact
               label='Action '
               name='tsx_action'
               options={tsx_actions}
               placeholder='Action for TheSkyX'
               text={this.state.tsx_actions}
               onChange={this.handleTsx_actionsChange}
            />
            <Button icon='toggle right' onClick={this.dropDownAction.bind(this)}/> */}
         {/* </Form.Group> */}
         {/* <Button.Group icon floated='right'>
         </Button.Group> */}
        </Segment>
           <Segment>
             <Progress value={this.state.tsx_progress} total={this.state.tsx_total} progress='ratio'>Processing</Progress>
           </Segment>
        <Segment>
          {this.renderTarget( this.state.targetSessionId )}
        </Segment>
        <Segment.Group  size='mini' horizontal>
          <Segment>
            <Label>RA <Label.Detail>{Number(this.state.monRA).toFixed(4)}</Label.Detail></Label>
          </Segment>
            <Segment>
            <Label>DEC <Label.Detail>{Number(this.state.monDEC).toFixed(4)}</Label.Detail></Label>
          </Segment>
            <Segment>
            <Label>Angle <Label.Detail>{Number(this.state.monAngle).toFixed(4)}</Label.Detail></Label>
          </Segment>
        </Segment.Group>
        <Segment.Group size='mini' horizontal>
          <Segment>
            <Label>Atl <Label.Detail>{Number(this.state.monALT).toFixed(4)}</Label.Detail></Label>
          </Segment>
            <Segment>
            <Label>Az <Label.Detail>{this.state.monAZ}</Label.Detail></Label>
          </Segment>
            <Segment>
            <Label>HA <Label.Detail>{Number(this.state.monHA).toFixed(4)}</Label.Detail></Label>
          </Segment>
            <Segment>
            <Label>Transit <Label.Detail>{Number(this.state.monTransit).toFixed(4)}</Label.Detail></Label>
          </Segment>
        </Segment.Group>
        <Segment.Group size='mini'>
          <Segment>
            <h3 className="ui header">Session Controls</h3>
            <Form.Group>
              <Form.Checkbox
                label='Enable Meridian Flip '
                name='defaultMeridianFlip'
                toggle
                placeholder= 'Enable auto meridian flip'
                checked={this.state.defaultMeridianFlip}
                onChange={this.handleToggle.bind(this)}
              />
              <Form.Checkbox
                label='Enable CLS '
                name='defaultCLSEnabled'
                toggle
                placeholder= 'Enable CLS'
                checked={this.state.defaultCLSEnabled}
                onChange={this.handleToggle.bind(this)}
              />
              <Form.Checkbox
                label='Enable Soft Parking (Stop tracking) '
                name='defaultSoftPark'
                toggle
                placeholder= 'Enable soft parking'
                checked={this.state.defaultSoftPark}
                onChange={this.handleToggle.bind(this)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Checkbox
                label='Enable Autofocusing (@Focus3) '
                name='isFocus3Enabled'
                toggle
                placeholder= 'Enable focus checking'
                checked={this.state.isFocus3Enabled}
                onChange={this.handleToggle.bind(this)}
              />
              {/* <Form.Checkbox
                label='Bin 2x2 Focus Enabled '
                name='isFocus3Binned'
                toggle
                placeholder= 'Enable to bin when focusing'
                checked={this.state.isFocus3Binned}
                onChange={this.handleToggle.bind(this)}
              /> */}
            </Form.Group>
            <Form.Group>
              <Form.Checkbox
                label='Enable Twilight Check '
                name='isTwilightEnabled'
                toggle
                placeholder= 'Enable twilight check'
                checked={this.state.isTwilightEnabled}
                onChange={this.handleToggle.bind(this)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Checkbox
                label='Enable Imaging Cooler '
                name='enableImagingCooler'
                toggle
                placeholder= 'Cool down camera'
                checked={this.state.enableImagingCooler}
                onChange={this.handleToggle.bind(this)}
              />
            </Form.Group>
          </Segment>
        </Segment.Group>
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
      {/* </Segment.Group> */}
    </div>
    )
  }
}
export default withTracker(() => {

  return {
    reports: TargetReports.find().fetch(),
    tsxInfo: TheSkyXInfos.find({}).fetch(),
    takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
    targetSessions: TargetSessions.find({}, { sort: { name: 1 } }).fetch(),
};
})(Monitor);
