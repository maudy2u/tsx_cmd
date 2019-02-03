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

// import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';

import {
  Header,
  Label,
  Segment,
  Button,
} from 'semantic-ui-react'

import {
  Form,
  Input,
  Dropdown,
} from 'formsy-semantic-ui-react';
const ERRORLABEL = <Label color="red" pointing/>

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
      tool_calibrate_location: '',
      tool_calibrate_dec_az: '',
      tool_rotator_fov: '',
      tool_rotator_num: '',
      tool_rotator_type: '',
  };

  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value.trim() });
    this.saveDefaultStateValue( name, value.trim() );
  };

  handleNumericChange = (e, { name, value }) => {

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
        tool_calibrate_location: nextProps.tsxInfo.find(function(element) {
          return element.name == 'tool_calibrate_location';
      }).value});
      this.setState({
        tool_calibrate_dec_az: nextProps.tsxInfo.find(function(element) {
          return element.name == 'tool_calibrate_dec_az';
      }).value});
      this.setState({
        tool_rotator_type: nextProps.tsxInfo.find(function(element) {
          return element.name == 'tool_rotator_type';
      }).value});
      this.setState({
        tool_rotator_num: nextProps.tsxInfo.find(function(element) {
          return element.name == 'tool_rotator_num';
      }).value});
      this.setState({
        tool_rotator_fov: nextProps.tsxInfo.find(function(element) {
          return element.name == 'tool_rotator_fov';
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
  rotateCameraFOV() {
    Meteor.call( 'rotateCamera', 0, function(error, result) {
      console.log('Error: ' + error);
      console.log('result: ' + result);
    }.bind(this));
  }

  rotateCamera() {
    Meteor.call( 'rotateCamera', 1, function(error, result) {
      console.log('Error: ' + error);
      console.log('result: ' + result);
    }.bind(this));
  }

  calibrateGuider() {
    var slew = this.state.tool_calibrate_via;
    var location = this.state.tool_calibrate_location;
    var dec_az = this.state.tool_calibrate_dec_az;
    Meteor.call( 'calibrateGuider', slew, location, dec_az, function(error, result) {
      console.log('Error: ' + error);
      console.log('result: ' + result);
    }.bind(this));
  }

  rotateFOV( state, ROTATOR_TYPE, ROTATOR_NUM, active ) {
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
    let DISABLE = true;
    let NOT_DISABLE = false;
    // then use as needed disabled={DISABLE} or disabled={NOT_DISABLE}
    if( state == 'Stop'  && active == false ){
      DISABLE = false;
      NOT_DISABLE = true;
    }

    return (
      <div>
        <Button.Group icon>
             <Button disabled={DISABLE} onClick={this.rotateCameraFOV.bind(this)}>Set FOV</Button>
       </Button.Group>
       <Form>
       <Form.Input
         name='tool_rotator_fov'
         placeholder='eg. 19826, or 0.5'
         value={ROTATOR_NUM}
         onChange={this.handleChange}
         validations="isNumeric"
         validationErrors={{ isNumeric: 'Must be a number' }}
         errorLabel={ ERRORLABEL }
        />
        </Form>
       <br/>Enter the FOV angle for ImageLink, e.g. 0 for PEC
      </div>
    )
  }

  rotateTool( state, ROTATOR_TYPE, ROTATOR_NUM, active ) {
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
    let DISABLE = true;
    let NOT_DISABLE = false;
    // then use as needed disabled={DISABLE} or disabled={NOT_DISABLE}
    if( state == 'Stop'  && active == false ){
      DISABLE = false;
      NOT_DISABLE = true;
    }

    return (
      <div>
        <Button.Group icon>
             <Button disabled={DISABLE} onClick={this.rotateCamera.bind(this)}>Set Position</Button>
       </Button.Group>
       <Form>
         <Form.Input
           name= 'tool_rotator_num'
           placeholder='eg. 19826, or 0.5'
           value={ROTATOR_NUM}
           onChange={this.handleChange}
           validations="isNumeric"
           validationErrors={{ isNumeric: 'Must be a number' }}
           errorLabel={ ERRORLABEL }
          />
        </Form>
       <br/>Enter the rotator position, e.g. 49.02
      </div>
    )
  }

  calibrateTools( state
    , calType
    , calLocation
    , calDecAz
    , active
  ) {

    var slewOptions =
    [
      {
        text: 'Ra/Dec',
        value: 'Ra/Dec',
      },
      {
        text: 'Alt/Az',
        value: 'Alt/Az',
      },
      {
        text: 'Target name',
        value: 'Target name',
      },
      {
        text: 'Do not slew',
        value: 'Do not slew',
      },
    ];

    let DISABLE = true;
    let NOT_DISABLE = false;
    // then use as needed disabled={DISABLE} or disabled={NOT_DISABLE}
    if( state == 'Stop'  && active == false ){
      DISABLE = false;
      NOT_DISABLE = true;
    }

    return (
      <div>
      <Button.Group icon>
          <Button  disabled={DISABLE} onClick={this.calibrateGuider.bind(this)}>Calibrate</Button>
       </Button.Group>
       <Form>
         <Dropdown
            name='tool_calibrate_via'
            placeholder='Slew via...'
            selection options={slewOptions}
            value={calType}
            onChange={this.handleChange}
          />
          <Input
            name='tool_calibrate_location'
            placeholder='Target name, Ra, or Alt: '
            value={calLocation}
            onChange={this.handleChange}
          />
          <Input
            name='tool_calibrate_dec_az'
            placeholder='Dec, or azimuth: '
            value={calDecAz}
            onChange={this.handleChange}
            validations="isNumeric"
            validationErrors={{ isNumeric: 'Must be a number' }}
            errorLabel={ ERRORLABEL }
          />
        </Form>
        <br/>(Optionaly select a slew type and specify a location, e.g 5.95, 21.99)
     </div>
    )
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
           , this.state.tool_calibrate_location
           , this.state.tool_calibrate_dec_az
           , this.props.tool_active.value
         )}
        </Segment>
        <Segment raised>
        <Header>Rotator FOV/Position</Header>
        <Segment.Group horizontal>
        <Segment>
          {this.rotateFOV(
            this.props.scheduler_running.value
            , this.state.tool_rotator_type
            , this.state.tool_rotator_fov
            , this.props.tool_active.value
          )}
          </Segment>
          <Segment>
            {this.rotateTool(
              this.props.scheduler_running.value
              , this.state.tool_rotator_type
              , this.state.tool_rotator_num
              , this.props.tool_active.value
            )}
            </Segment>
        </Segment.Group>
        </Segment>
        <Segment>
        Future idea - launch a filteroffset script to collect the filters focus offset and then average.
        </Segment>
    </div>
    )
  }
}
export default withTracker(() => {
  return {
};
})(Toolbox);
