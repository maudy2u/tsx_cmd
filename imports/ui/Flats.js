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

class Flats extends Component {

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
      tsx_actions: '',
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

      enableImagingCooler: false,
      isCLSRepeatEnabled: false,
      isCalibrationEnabled: false,

  };

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

  componentDidMount() {
    this.updateDefaults(this.props);
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
      this.setState({
        enableImagingCooler: Boolean(nextProps.tsxInfo.find(function(element) {
          return element.name == 'enableImagingCooler';
        }).value),
      });
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
//        tsx_UpdateServerState(tsx_ServerStates.currentStage, 'Stopped');

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
    var TARGETNAME ='';
    var PROGRESS = '';
    var TOTAL = '';
    try {
      TARGETNAME = this.props.targetName.value;
      PROGRESS = this.props.tsx_progress.value
      TOTAL = this.props.tsx_total.value
    } catch (e) {
      TARGETNAME = 'Initializing';
      PROGRESS = 0;
      TOTAL = 0;
    }

    return (
      <div>
         <Segment raised>
          <Button.Group icon>
             <Button  onClick={this.getCurrentTarget.bind(this)}>Calibrate</Button>
          </Button.Group>
        </Segment>
        <Segment raised>
          <Button.Group icon>
             <Button  onClick={this.getCurrentTarget.bind(this)}>Flat Position</Button>
          </Button.Group>
        </Segment>
        <Segment raised>
          <Button.Group icon>
             <Button  onClick={this.getCurrentTarget.bind(this)}>FOV Angle</Button>
          </Button.Group>
        </Segment>
        <Segment.Group  size='mini' horizontal>
          <Segment>
            <Form.Group>
              <Label>Atl <Label.Detail>{Number(this.props.scheduler_report.value.ALT).toFixed(4)}</Label.Detail></Label>
            </Form.Group>
            <Form.Group>
              <Label>Az <Label.Detail>{this.props.scheduler_report.value.AZ}</Label.Detail></Label>
            </Form.Group>
            <Form.Group>
              <Label>HA <Label.Detail>{Number(this.props.scheduler_report.value.HA).toFixed(4)}</Label.Detail></Label>
            </Form.Group>
            <Form.Group>
              <Label>Transit <Label.Detail>{Number(this.props.scheduler_report.value.TRANSIT).toFixed(4)}</Label.Detail></Label>
            </Form.Group>
            <Form.Group>
              <Label>Pointing <Label.Detail>{Number(this.props.scheduler_report.value.pointing).toFixed(4)}</Label.Detail></Label>
            </Form.Group>
            <Form.Group>
              <Label>Rotator <Label.Detail>{Number(this.props.scheduler_report.value.focusPostion).toFixed(4)}</Label.Detail></Label>
            </Form.Group>
            <Form.Group>
              <Label>Angle <Label.Detail>{Number(this.props.scheduler_report.value.ANGLE).toFixed(4)}</Label.Detail></Label>
            </Form.Group>
            <Form.Group>
              <Label>RA <Label.Detail>{Number(this.props.scheduler_report.value.RA).toFixed(4)}</Label.Detail></Label>
            </Form.Group>
            <Form.Group>
              <Label>DEC <Label.Detail>{Number(this.props.scheduler_report.value.DEC).toFixed(4)}</Label.Detail></Label>
            </Form.Group>
          </Segment>
        </Segment.Group>
    </div>
    )
  }
}
export default withTracker(() => {

  return {
    // reports: TargetReports.find().fetch(),
    // tsxInfo: TheSkyXInfos.find({}).fetch(),
    // takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
    // targetSessions: TargetSessions.find({}, { sort: { name: 1 } }).fetch(),
};
})(Flats);
