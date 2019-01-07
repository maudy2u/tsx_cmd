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
class ModalTemplate extends TrackerReact(Component) {


  constructor() {
    super();
    this.state = {
      showModal: false,
    };
  }
  handleToggle = (e, { name, value }) => this.setState({ [name]: Boolean(!eval('this.state.'+name)) })

  render() {
    return (
      <Modal
        open={this.state.modalOpenWindow}
        onClose={this.props.modalParentClose}
        basic
        size='small'
        closeIcon>
        <Modal.Header>{this.props.modalWindowTitle}</Modal.Header>
        <Modal.Content>
          <h3>Check that TheSkyX server is available, and the IP and Port to use to connect to the TSX Server.</h3>
        </Modal.Content>
        <Modal.Description>
          <Input
            label='IP:'
            value={this.state.ip}
          />
          <Input
            label='Port:'
            value={this.state.port}
          />
        </Modal.Description>
        <Modal.Actions>
          <Button onClick={this.props.modalParentClose} inverted>
            <Icon name='stop' />Stop
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }
}
// *******************************
// THIS IS THE DEFAULT EXPORT AND IS WHERE THE LOADING OF THE COMPONENT STARTS
export default withTracker(() => {
  // Meteor.subscribe('targetSessions');
  // Meteor.subscribe('tsxIP');
  // Meteor.subscribe('scheduler_running');
  // Meteor.subscribe('scheduler_report');
  // Meteor.subscribe('currentStage');
  return {
    /*
    tool_calibrate_via: TheSkyXInfos.findOne({name: 'tool_calibrate_via'}),
    tool_calibrate_location: TheSkyXInfos.findOne({name: 'tool_calibrate_location'}),
    tool_rotator_num: TheSkyXInfos.findOne({name: 'tool_rotator_num'}),
    tool_rotator_type: TheSkyXInfos.findOne({name: 'tool_rotator_type'}),
    tool_active: TheSkyXInfos.findOne({name: 'tool_active'}),
    tool_flats_dec_az: TheSkyXInfos.findOne({name: 'tool_flats_dec_az'}),
    tool_flats_location: TheSkyXInfos.findOne({name: 'tool_flats_location'}),
    tool_flats_via: TheSkyXInfos.findOne({name: 'tool_flats_via'}),

    tsx_version: TheSkyXInfos.findOne({name: 'tsx_version'}),
    tsx_date: TheSkyXInfos.findOne({name: 'tsx_date'}),
    flatSettings: TheSkyXInfos.findOne({name: 'flatSettings'}),
    currentStage: TheSkyXInfos.findOne({name: 'currentStage'}),
    activeMenu: TheSkyXInfos.findOne({name: 'activeMenu'}),
    targetName: TheSkyXInfos.findOne({name: 'targetName'}),
    tsx_progress: TheSkyXInfos.findOne({name: 'tsx_progress'}),
    tsx_total:  TheSkyXInfos.findOne({name: 'tsx_total'}),
    tsx_message: TheSkyXInfos.findOne({name: 'tsx_message'}),
    scheduler_running: TheSkyXInfos.findOne({name: 'scheduler_running'}),
    scheduler_report: TheSkyXInfos.findOne({name: 'scheduler_report'}),
    tsxIP: TheSkyXInfos.findOne({name: 'ip'}),
    tsxPort: TheSkyXInfos.findOne({name: 'port'}),
    tsxInfo: TheSkyXInfos.find({}).fetch(),
    srvLog: AppLogsDB.find({}, {sort:{time:-1}}).fetch(10),
    filters: Filters.find({}, { sort: { slot: 1 } }).fetch(),
    flatSeries: FlatSeries.find({}).fetch(),
    takeSeriesTemplates: TakeSeriesTemplates.find({ isCalibrationFrames: false }, { sort: { name: 1 } }).fetch(),
    targetSessions: TargetSessions.find({ isCalibrationFrames: false }, { sort: { enabledActive: -1, targetFindName: 1 } }).fetch(),
    targetReports: TargetReports.find({}).fetch(),
*/
  };
})(ModalTemplate);
