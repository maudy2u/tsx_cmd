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
class TestModal extends Component {

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
        Test
      </Segment.Group>
    );
  }
}
export default withTracker(() => {
    return {
  };
})(TestModal);
