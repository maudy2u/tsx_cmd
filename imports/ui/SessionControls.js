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
import TrackerReact from 'meteor/ultimatejs:tracker-react'
// import ReactDOM from 'react-dom';
// import { Session } from 'meteor/session'
// import {mount} from 'react-mounter';

// used for log files
import { Logger }     from 'meteor/ostrio:logger';
import { LoggerFile } from 'meteor/ostrio:loggerfile';
import { withTracker } from 'meteor/react-meteor-data';

import { TextArea, Form, Input, Icon, Dropdown, Label, Table, Menu, Segment, Button, Progress, Modal, Radio
} from 'semantic-ui-react'

// Import the API Model
import {
  TakeSeriesTemplates,
  addNewTakeSeriesTemplate,
} from '../api/takeSeriesTemplates.js';
import {
  TargetSessions,
  addNewTargetSession,
} from '../api/targetSessions.js';
import {
  TargetReports
} from '../api/targetReports.js'
import {
  TargetAngles
} from '../api/targetAngles.js'

import { Filters } from '../api/filters.js';
import { FlatSeries } from '../api/flatSeries.js';
import { TheSkyXInfos } from '../api/theSkyXInfos.js';
import { AppLogsDB } from '../api/theLoggers.js'

import {
  tsx_ServerStates,
  tsx_UpdateServerState,
  saveDefaultStateValue,
  UpdateStatus,
  // tsx_GetServerState,
} from  '../api/serverStates.js';

// App component - represents the whole app
class SessionControls extends Component {

  constructor(props) {
    super(props);

    this.state = {

        defaultMeridianFlip: this.props.tsxInfo.find(function(element) {
        return element.name == 'defaultMeridianFlip';}).value,
        defaultCLSEnabled: this.props.tsxInfo.find(function(element) {
        return element.name == 'defaultCLSEnabled';}).value,
        defaultSoftPark: this.props.tsxInfo.find(function(element) {
        return element.name == 'defaultSoftPark';}).value,

        isFOVAngleEnabled: this.props.tsxInfo.find(function(element) {
        return element.name == 'isFOVAngleEnabled';}).value,
        isFocus3Enabled: this.props.tsxInfo.find(function(element) {
        return element.name == 'isFocus3Enabled';}).value,
        isFocus3Binned: this.props.tsxInfo.find(function(element) {
        return element.name == 'isFocus3Binned';}).value,

        isAutoguidingEnabled: this.props.tsxInfo.find(function(element) {
        return element.name == 'isAutoguidingEnabled';}).value,
        isCalibrationEnabled: this.props.tsxInfo.find(function(element) {
        return element.name == 'isCalibrationEnabled';}).value,
        isGuideSettlingEnabled: this.props.tsxInfo.find(function(element) {
        return element.name == 'isGuideSettlingEnabled';}).value,

        isDitheringEnabled: this.props.tsxInfo.find(function(element) {
        return element.name == 'isDitheringEnabled';}).value,

        isCLSRepeatEnabled: this.props.tsxInfo.find(function(element) {
        return element.name == 'isCLSRepeatEnabled';}).value,
        isTwilightEnabled: this.props.tsxInfo.find(function(element) {
        return element.name == 'isTwilightEnabled';}).value,

    };
  }

  handleToggle = (e, { name, value }) => this.setState({ [name]: Boolean(!eval('this.state.'+name)) })

  handleToggleAndSave = (e, { name, value }) => {
    var val = eval( 'this.state.' + name);

    this.setState({
      [name]: !val
    });
    saveDefaultStateValue( name, !val );
  };

  render() {

    /*
     */

    return (
      <Segment.Group size='mini'>
        <Segment secondary>{/* use this icon fro the Model settings configure */}
        <Form>
          <Form.Checkbox
            label='Enable Twilight Check '
            name='isTwilightEnabled'
            toggle
            placeholder= 'Enable twilight check'
            checked={this.state.isTwilightEnabled}
            onChange={this.handleToggleAndSave.bind(this)}
          />
          <br/>
          <Form.Checkbox
            label='Enable Meridian Flip '
            name='defaultMeridianFlip'
            toggle
            placeholder= 'Enable auto meridian flip'
            checked={this.state.defaultMeridianFlip}
            onChange={this.handleToggleAndSave.bind(this)}
          />
          <Form.Checkbox
            label='Enable CLS '
            name='defaultCLSEnabled'
            toggle
            placeholder= 'Enable CLS'
            checked={this.state.defaultCLSEnabled}
            onChange={this.handleToggleAndSave.bind(this)}
          />
          <Form.Checkbox
            label='Enable Soft Parking (Stop tracking) '
            name='defaultSoftPark'
            toggle
            placeholder= 'Enable soft parking'
            checked={this.state.defaultSoftPark}
            onChange={this.handleToggleAndSave.bind(this)}
          />
          <br />
          <Form.Checkbox
            label='Enable Autofocus (@Focus3) '
            name='isFocus3Enabled'
            toggle
            placeholder= 'Enable focus checking'
            checked={this.state.isFocus3Enabled}
            onChange={this.handleToggleAndSave.bind(this)}
          />
          <br /><Form.Checkbox
            label='Enable Autoguiding '
            name='isAutoguidingEnabled'
            toggle
            placeholder= 'Enable Autoguiding checking'
            checked={this.state.isAutoguidingEnabled}
            onChange={this.handleToggleAndSave.bind(this)}
          />
          <Form.Checkbox
            label='Enable Guiding Settling '
            name='isGuideSettlingEnabled'
            toggle
            placeholder= 'Enable Autoguiding Settling'
            checked={this.state.isGuideSettlingEnabled}
            onChange={this.handleToggleAndSave.bind(this)}
          />
          <br />
          <br />
          <Form.Checkbox
            label='Enable Autoguide Calibrating '
            name='isCalibrationEnabled'
            toggle
            placeholder= 'Enable Autoguiding Calibrating'
            checked={this.state.isCalibrationEnabled}
            onChange={this.handleToggleAndSave.bind(this)}
          />
          <br />
          <br />
          <Form.Checkbox
            label='Enable FOV Rotator Angle/Position Matching '
            name='isFOVAngleEnabled'
            toggle
            placeholder= 'Enable using the targets angle'
            checked={this.state.isFOVAngleEnabled}
            onChange={this.handleToggleAndSave.bind(this)}
          />
          <br />
          <Form.Checkbox
            label='Enable Dithering '
            name='isDitheringEnabled'
            toggle
            placeholder= 'Enable using the dither settings'
            checked={this.state.isDitheringEnabled}
            onChange={this.handleToggleAndSave.bind(this)}
          />
          <br />
          <Form.Checkbox
            label='Enable Cloud Check (periodic CLS) '
            name='isCLSRepeatEnabled'
            toggle
            placeholder= 'CLS every X secs'
            checked={this.state.isCLSRepeatEnabled}
            onChange={this.handleToggleAndSave.bind(this)}
          />
          </Form>
          &nbsp;<br/>
          &nbsp;<br/>
        </Segment>
      </Segment.Group>
    );
  }
}
export default withTracker(() => {
    return {
  };
})(SessionControls);
