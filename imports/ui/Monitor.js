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

import {
  Accordion,
  Grid,
  TextArea,
  Divider,
  Confirm,
  Input,
  Icon,
  Dropdown,
  Label,
  Table,
  Menu,
  Segment,
  Button,
  Progress,
  Modal,
  Form,
  Radio,
  Statistic,
} from 'semantic-ui-react'

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
import { AppLogsDB } from '../api/theLoggers.js'

// Import the UI
import Target  from './Target.js';
import TargetSessionMenu from './TargetSessionMenu.js';
// import Filter from './Filter.js';
import Series from './Series.js';
import TakeSeriesTemplateMenu from './TakeSeriesTemplateMenu.js';
import SessionReport from './SessionReport.js';

class Monitor extends Component {

    state = {

      focusPostion: '_',

      monitorDisplay: true,
      confirmOpen: false,

      activeItem: 'Targets',

      noFoundSession: false,

      focusTemp: '_',
      focusPos: '_',
      cameraTemp: '_',
      filter: '_',
      binning: '_',

      // tsx_progress: 0,
      tsx_total: 0,
      targetSessionId: '',


      isTwilightEnabled: true,
      isFocus3Enabled: false,
      isAutoguidingEnabled: false,
      isFocus3Binned: false,
      defaultMeridianFlip: false,
      defaultSoftPark: false,
      defaultCLSEnabled: false,
      isGuideSettlingEnabled: false,
      isFOVAngleEnabled: false,

      // enableImagingCooler: false,
      isCLSRepeatEnabled: false,
      isCalibrationEnabled: false,

      activeIndex: -1,
      activeIndex1: -1,
      playClicked: false,

  };

  handleClick = (e, titleProps) => {
    const { index } = titleProps
    const { activeIndex } = this.state
    const newIndex = activeIndex === index ? -1 : index

    this.setState({ activeIndex: newIndex })
  }
  handleClick1 = (e, titleProps) => {
    const { index } = titleProps
    const { activeIndex1 } = this.state
    const newIndex = activeIndex1 === index ? -1 : index

    this.setState({ activeIndex1: newIndex })
  }

  handleChange = (e, { name, value }) => this.setState({ [name]: value });

  // requires the ".bind(this)", on the callers
  handleToggle = (e, { name, value }) => {

    var val = eval( 'this.state.' + name);

    this.setState({
      [name]: !val
    });
    this.saveDefaultStateValue( name, !val );
  };

  noFoundSessionOpen = () => this.setState({ noFoundSession: true })
  noFoundSessionClose = () => this.setState({ noFoundSession: false })

  componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
    if (this.props.target !== prevProps.target) {
      this.updateDefaults(this.props);
    }
  }

  updateDefaults(nextProps) {
    if( typeof nextProps == 'undefined'  ) {
      return;
    }

    if( typeof nextProps.reports != 'undefined'  ) {
      this.setState({
        defaultSoftPark: Boolean(nextProps.tsxInfo.find(function(element) {
          return element.name == 'defaultSoftPark';
        }).value),
      });
    }
    if( typeof nextProps.tsxInfo != 'undefined'  ) {

      var isFlip = Boolean(nextProps.tsxInfo.find(function(element) {
        return element.name == 'defaultMeridianFlip';
      }).value);

      this.setState({
        defaultMeridianFlip: isFlip,
      });

      this.setState({
        defaultSoftPark: Boolean(nextProps.tsxInfo.find(function(element) {
          return element.name == 'defaultSoftPark';
        }).value),
      });
      this.setState({
        isTwilightEnabled: Boolean(nextProps.tsxInfo.find(function(element) {
          return element.name == 'isTwilightEnabled';
        }).value),
      });
      this.setState({
        isFocus3Enabled: Boolean(nextProps.tsxInfo.find(function(element) {
          return element.name == 'isFocus3Enabled';
        }).value),
      });
      this.setState({
        isFocus3Binned: Boolean(nextProps.tsxInfo.find(function(element) {
          return element.name == 'isFocus3Binned';
        }).value),
      });
      this.setState({
        defaultCLSEnabled: Boolean(nextProps.tsxInfo.find(function(element) {
          return element.name == 'defaultCLSEnabled';
        }).value),
      });
      // this.setState({
      //   enableImagingCooler: Boolean(nextProps.tsxInfo.find(function(element) {
      //     return element.name == 'enableImagingCooler';
      //   }).value),
      // });
      this.setState({
        isAutoguidingEnabled: Boolean(nextProps.tsxInfo.find(function(element) {
          return element.name == 'isAutoguidingEnabled';
        }).value),
      });
      this.setState({
        isGuideSettlingEnabled: Boolean(nextProps.tsxInfo.find(function(element) {
          return element.name == 'isGuideSettlingEnabled';
        }).value),
      });
      this.setState({
        isFOVAngleEnabled: Boolean(nextProps.tsxInfo.find(function(element) {
          return element.name == 'isFOVAngleEnabled';
        }).value),
      });
      this.setState({
        isCLSRepeatEnabled: Boolean(nextProps.tsxInfo.find(function(element) {
          return element.name == 'isCLSRepeatEnabled';
        }).value),
      });
      this.setState({
        isCalibrationEnabled: Boolean(nextProps.tsxInfo.find(function(element) {
          return element.name == 'isCalibrationEnabled';
        }).value),
      });
    }
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
  saveDefaultStateValue( param, val ) {

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

  confirmPlayScheduler() {
    this.setState({confirmOpen: true});
  }

  playScheduler() {
    this.setState({
      playClicked: true
    });
    Meteor.call("startScheduler", function (error, result) {
      this.forceUpdate();
      this.setState({
        playClicked: false
      });

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
//        tsx_UpdateServerState(tsx_ServerStates.currentStage, 'Stopped');

      }.bind(this));
  }

  getCurrentTarget() {
    var tid = this.props.targetSessionId[0].value;
    var target = TargetSessions.findOne({_id: tid });
    // #TODO report no valid target


    return target._id;
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

  startImaging() {

    Meteor.call( 'startImaging', this.getCurrentTarget(), function(error, result) {
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

  playButtons( state ) {

    if( state === 'Stop'
      && !this.state.playClicked
      && this.props.runScheduler.value === ''
      && this.props.tool_active.value === false
    ) {
      return (
        <div>
        <Button icon='play'  onClick={this.playScheduler.bind(this)}/>
        <Button disabled icon='stop' onClick={this.stopScheduler.bind(this)} />
        </div>
      )
    }
    else {
      return (
        <div>
          <Button disabled icon='play'  onClick={this.playScheduler.bind(this)}/>
          <Button  icon='stop' onClick={this.stopScheduler.bind(this)} />
        </div>
      )
    }
  }

  render() {

    var TARGETNAME = this.props.targetName.value;
    if( TARGETNAME !== 'No Active Target') {
      var sid = tsx_GetServerState(tsx_ServerStates.imagingSessionId);
      try {
        var target = TargetSessions.findOne({_id: sid.value });
        if( typeof target.friendlyName !== 'undefined' && target.friendlyName !== '' ) {
          TARGETNAME = target.friendlyName;
        }
      }
      catch(err) {
        console.log( ' No valid Target - yet: ' + err);
      }
    }

    var PROGRESS = '';
    var TOTAL = '';
    var RUNNING = '';
    try {
      PROGRESS = this.props.tsx_progress.value;
      TOTAL = this.props.tsx_total.value;
      RUNNING = this.props.scheduler_running.value;
    } catch (e) {
      PROGRESS = 0;
      TOTAL = 0;
    }

    var LOG = '';
    var num = 0;
    try {
      num = this.props.srvLog.length;
    }
    finally {
      for (let i = num-1; i > -1; i--) { // this puts most resent line on top
          let log = this.props.srvLog[i];
          let ts = log.date.split('|')[1].trim();
          if( log.level == 'LOG') {
            LOG = LOG + ts + ' | ' + log.message + '\n';
          }
          else {
            LOG = LOG + ts + ' |[' + log.level +']' + log.message + '\n';
          }
      }
    }

    const { activeIndex } = this.state
    const { activeIndex1 } = this.state

    return (
      <div>

        <Button.Group icon>
          {this.playButtons(RUNNING) }
        </Button.Group>
        <h1>&nbsp;&nbsp;{' ' + TARGETNAME}</h1>
        <Accordion size='mini' styled>
            <Accordion.Title
              active={activeIndex1 === 0}
              content='Coordinates'
              index={0}
              onClick={this.handleClick1}
              />
            <Accordion.Content active={activeIndex1 === 0} >
              <Segment>
                <Statistic size='mini'>
                  <Statistic.Label>Alt</Statistic.Label>
                  <Statistic.Value>{Number(this.props.scheduler_report.value.ALT).toFixed(3)}</Statistic.Value>
                </Statistic>
                <Statistic size='mini'>
                  <Statistic.Label>Az</Statistic.Label>
                  <Statistic.Value>{Number(this.props.scheduler_report.value.AZ).toFixed(3)}</Statistic.Value>
                </Statistic>
                <Statistic size='mini'>
                  <Statistic.Label>RA</Statistic.Label>
                  <Statistic.Value>{Number(this.props.scheduler_report.value.RA).toFixed(3)}</Statistic.Value>
                </Statistic>
                <Statistic size='mini'>
                  <Statistic.Label>DEC</Statistic.Label>
                  <Statistic.Value>{Number(this.props.scheduler_report.value.DEC).toFixed(3)}</Statistic.Value>
                </Statistic>
                <Statistic size='mini'>
                  <Statistic.Label>PA</Statistic.Label>
                  <Statistic.Value>{Number(this.props.last_PA.value).toFixed(2)}</Statistic.Value>
                </Statistic>
                <Statistic size='mini'>
                  <Statistic.Label>Pointing</Statistic.Label>
                  <Statistic.Value>{this.props.scheduler_report.value.pointing}</Statistic.Value>
                </Statistic>
              </Segment>
              <Segment>
                <Statistic size='mini'>
                  <Statistic.Label>RMS</Statistic.Label>
                  <Statistic.Value>{Number(this.props.scheduler_report.value.RMS_ERROR).toFixed(2)}</Statistic.Value>
                </Statistic>
                <Statistic size='mini'>
                  <Statistic.Label>HA</Statistic.Label>
                  <Statistic.Value>{Number(this.props.scheduler_report.value.HA).toFixed(2)}</Statistic.Value>
                </Statistic>
                <Statistic size='mini'>
                  <Statistic.Label>Trans</Statistic.Label>
                  <Statistic.Value>{Number(this.props.scheduler_report.value.TRANSIT).toFixed(2)}</Statistic.Value>
                </Statistic>
                <Statistic size='mini'>
                  <Statistic.Label>Sun Alt.</Statistic.Label>
                  <Statistic.Value>{Number(this.props.scheduler_report.value.sunAltitude).toFixed(2)}</Statistic.Value>
                </Statistic>
                <Statistic size='mini'>
                  <Statistic.Label>Foc. Pos.</Statistic.Label>
                  <Statistic.Value>{Number(this.props.scheduler_report.value.focusPosition).toFixed(0)}</Statistic.Value>
                </Statistic>
                <Statistic size='mini'>
                  <Statistic.Label>Foc. Temp.</Statistic.Label>
                  <Statistic.Value>{Number(this.props.scheduler_report.value.focusTemp).toFixed(0)}</Statistic.Value>
                </Statistic>
              </Segment>
            </Accordion.Content>
        </Accordion>
        <Accordion size='mini' styled>
          <Accordion.Title
            active={activeIndex === 1}
            content='Session Report'
            index={1}
            onClick={this.handleClick}
            />
          <Accordion.Content active={activeIndex === 1} >
            <SessionReport
              enabledTargetSessions={this.props.enabledTargetSessions}
              />
          </Accordion.Content>
        </Accordion>
        <br/>
        <Form unstackable>
          <Form.Group>
          <TextArea value={LOG} rows={3} style={{ minHeight: 200 }} />
          </Form.Group>
        </Form>
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
  const appLogsDBHandle = Meteor.subscribe('appLogsDB.all');
  var appLogsDBReadyYet = appLogsDBHandle.ready();
  var srvLog = AppLogsDB.find({}, {sort:{time:-1}}).fetch(10);

  return {
    appLogsDBReadyYet,
    srvLog,
    reports: TargetReports.find().fetch(),
    // tsxInfo: TheSkyXInfos.find({}).fetch(),
    takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
    // targetSessions: TargetSessions.find({}, { sort: { name: 1 } }).fetch(),
};
})(Monitor);
