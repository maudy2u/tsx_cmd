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

import { Header, Confirm, Input, Icon, Dropdown, Label, Table, Menu, Segment, Button, Progress, Modal, Form, Radio } from 'semantic-ui-react'

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

class Toolbox extends Component {

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

      tool_calibrate_via: '',
      tool_calibrate_ra: '',
      tool_calibrate_dec: '',
      tool_rotator_num: '',
      tool_rotator_type: '',
  };

  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value.trim() });
    this.saveDefaultStateValue( name, value.trim() );
  };

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

    if( typeof nextProps.tsxInfo != 'undefined'  ) {

      this.setState({
        tool_calibrate_via: nextProps.tsxInfo.find(function(element) {
          return element.name == 'tool_calibrate_via';
      }).value});
      this.setState({
        tool_calibrate_ra: nextProps.tsxInfo.find(function(element) {
          return element.name == 'tool_calibrate_ra';
      }).value});
      this.setState({
        tool_calibrate_dec: nextProps.tsxInfo.find(function(element) {
          return element.name == 'tool_calibrate_dec';
      }).value});
      this.setState({
        tool_rotator_type: nextProps.tsxInfo.find(function(element) {
          return element.name == 'tool_rotator_type';
      }).value});
      this.setState({
        tool_rotator_num: nextProps.tsxInfo.find(function(element) {
          return element.name == 'tool_rotator_num';
      }).value});
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


  rotateCamera() {
    Meteor.call( 'rotateCamera', function(error, result) {
      console.log('Error: ' + error);
      console.log('result: ' + result);
    }.bind(this));
  }

  calibrateGuider() {
    Meteor.call( 'calibrateGuider', function(error, result) {
      console.log('Error: ' + error);
      console.log('result: ' + result);
    }.bind(this));
  }

  rotateTool( state, ROTATOR_TYPE, ROTATOR_NUM ) {
    var typeOptions =
    [
      {
        text: 'Position',
        value: 'Position',
      },
      {
        text: 'Angle',
        value: 'Angle',
      },
      {
        text: '',
        value: '',
      },
    ];
    if( state == 'Stop') {
      return (
        <div>
          <Button.Group icon>
               <Button  onClick={this.rotateCamera.bind(this)}>Set FOV</Button>
          </Button.Group>
          <Input
            name='tool_rotator_num'
            placeholder='eg. 19826, or 0.5'
            value={ROTATOR_NUM}
            onChange={this.handleChange}/>
            <br/>Enter the Angle desired (rotator position reported below)
        </div>
      )
    }
    else {
      return (
        <div>
          <Button.Group icon>
             <Button  disabled='true' onClick={this.rotateCamera.bind(this)}>Set FOV</Button>
          </Button.Group>
          <Dropdown
            placeholder='Set via...'
            selection options={typeOptions}
            name='tool_rotator_type'
            value={ROTATOR_TYPE}
            onChange={this.handleChange}
          />
          <br/>Enter the Angle desired (rotator position reported below)
          <br/>Position or Degrees: <Input
            name='tool_rotator_num'
            placeholder='eg. 19826, or 0.5'
            value={ROTATOR_NUM}
            onChange={this.handleChange}/>
        </div>
      )
    }
  }

  calibrateTools( state
    , calType
    , calRa
    , calDec
  ) {
   // var CALIBRATE_TYPE = '';
   // var CALIBRATE_RA = '';
   // var CALIBRATE_DEC = '';
   //
   // try {
   //   CALIBRATE_TYPE = calType.value;
   //   CALIBRATE_RA = calRa.value;
   //   CALIBRATE_DEC = calDec.value;
   // } catch (e) {
   //   CALIBRATE_TYPE = '';
   //   CALIBRATE_RA = '';
   //   CALIBRATE_DEC = '';
   // }

    var slewOptions =
    [
      {
        text: 'Ra/Dec',
        value: 'Ra/Dec',
      },
      {
        text: 'Alt/Az',
        value: 'Alt/Az  ',
      },
      {
        text: '',
        value: '',
      },
    ];
    if( state == 'Stop' ) {
      return (
        <div>
        <Button.Group icon>
            <Button  onClick={this.calibrateGuider.bind(this)}>Calibrate</Button>
         </Button.Group>
         <Dropdown
            name='tool_calibrate_via'
            placeholder='Slew via...'
            selection options={slewOptions}
            value={calType}
            onChange={this.handleChange}
          />
         <br/>(Optional provide a location)
         <br/>Location: <Form.Input
           name='tool_calibrate_ra'
           placeholder='Ra/Alt: '
           value={calRa}
           onChange={this.handleChange}/>
         <Form.Input
           name='tool_calibrate_dec'
           placeholder='Dec/Az: '
           value={calDec}
           onChange={this.handleChange}/>
       </div>
      )
    }
    else {
      return (
        <div>
         <Button.Group icon>
            <Button  disabled='true' onClick={this.calibrateGuider.bind(this)}>Calibrate</Button>
         </Button.Group>
         <Dropdown
            name='tool_calibrate_via'
            placeholder='Slew via...'
            selection options={slewOptions}
            value={calType}
            onChange={this.handleChange}
          />
         <br/>(Optional provide a location)
         <br/>Location: <Form.Input
           name='tool_calibrate_ra'
           placeholder='Ra/Alt: '
           value={calRa}
           onChange={this.handleChange}/>
         <Form.Input
           name='tool_calibrate_dec'
           placeholder='Dec/Az: '
           value={calDec}
           onChange={this.handleChange}/>
       </div>
      )
    }
  }

  render() {

    var TARGETNAME ='';
    var PROGRESS = '';
    var TOTAL = '';

    try {
      TARGETNAME = this.props.targetName.value;
      PROGRESS = this.props.tsx_progress.value;
      TOTAL = this.props.tsx_total.value;
    } catch (e) {
      TARGETNAME = 'Initializing';
      PROGRESS = 0;
      TOTAL = 0;
    }

    return (
      <div>
        <Segment raised>
          <Header>Calibrate Autoguider</Header>
         {this.calibrateTools(
           this.props.scheduler_running.value
           , this.state.tool_calibrate_via
           , this.state.tool_calibrate_ra
           , this.state.tool_calibrate_dec
         )}
        </Segment>
        <Segment raised>
        <Header>Rotate FOV</Header>
          {this.rotateTool(
            this.props.scheduler_running.value
            , this.state.tool_rotator_type
            , this.state.tool_rotator_num
          )}
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
};
})(Toolbox);
