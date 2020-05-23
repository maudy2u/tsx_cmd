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
import { Header, TextArea, Dimmer, Loader, Grid, Form, Input, Icon, Dropdown, Label, Table, Menu, Segment, Button, Progress, Modal, Radio } from 'semantic-ui-react'

import SessionControls from './SessionControls.js';
import BackupModal from './BackupModal.js';

import {
  tsx_ServerStates,
  tsx_UpdateServerState,
  tsx_GetServerState,
} from  '../api/serverStates.js';

// Import the API Model
import { TheSkyXInfos } from '../api/theSkyXInfos.js';
import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js'
import { Seriess } from '../api/seriess.js'
import { TargetSessions } from '../api/targetSessions.js'

import {
  Filters,
  renderDropDownFilters,
  getFlatExposure,
} from '../api/filters.js';

import {
  calcTargetFilterExposureSessionTotal,
  calcTargetFilterExposureRunningTotal,
} from '../api/imagingSessionLogs.js'

class AppStates extends Component {

  constructor() {
    super();
    this.state = {
     ip: 'localhost',
     port: 3040,
     version: 'tbd',
     date: 'unknown',

     modalOpenWindowSessionControls: false,
     modalOpenBackup: false,
     modalConnectionFailed: false,
   };
 }

 modalOpenSessionsControls = () => this.setState({ modalOpenWindowSessionControls: true });
 modalCloseSessionsControls = () => this.setState({ modalOpenWindowSessionControls: false });
 modalOpenBackup = () => this.setState({ modalOpenBackup: true });
 modalCloseBackup = () => this.setState({ modalOpenBackup: false });

  // Initialize states
  componentDidMount() {
    // Typical usage (don't forget to compare props):
    this.updateDefaults(this.props);
  }

  componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
    if (this.props !== prevProps) {
      this.updateDefaults(this.props);
    }
  }

  updateDefaults(nextProps) {
      if( typeof nextProps == 'undefined'  ) {
        return;
      }

      // // GOT TO BE A BETTER WAY THAN THIS CHECK!!!
      // if( typeof nextProps.ip !== 'undefined'  ) {
      //   this.setState({
      //     ip: nextProps.ip.value,
      //     port: nextProps.port.value,
      //     version: nextProps.version.value,
      //     date: nextProps.date.value,
      //   });
      // }
  }

  park() {
    Meteor.call("park", function (error, result) {
      // identify the error
      if (error && error.reason === "Internal server error") {
        // show a nice error message
        this.setState({modalConnectionFailed: true});
      }
    }.bind(this));
  }


  appButtons( state, active ) {
    // detective
    var DISABLE = true;
    var NOT_DISABLE = false;
    // then use as needed disabled={DISABLE} or disabled={NOT_DISABLE}
    if( state == 'Stop'  && active == false ){
      DISABLE = false;
      NOT_DISABLE = true;
    }
    return (
      <Button.Group compact size='mini' floated='right'>
        <Button icon='cloud download' onClick={this.modalOpenBackup}/>
        <Button disabled={DISABLE} icon='car' onClick={this.park.bind(this)}/>
      </Button.Group>
    )
  }

  renderBackupModal() {
    return(
      <Modal
        open={this.state.modalOpenBackup}
        onClose={this.modalCloseBackup}
        basic
        size='small'
        closeIcon>
        <Modal.Header>Backup tsx_cmd DB</Modal.Header>
        <Modal.Content>
          <BackupModal
            scheduler_running={this.props.scheduler_running}
            tool_active = {this.props.tool_active}
            tsxInfo = { this.props.tsxInfo }
            currentStage= {this.props.currentStage}
            target_reports={this.props.target_reports}
            scheduler_report={this.props.scheduler_report}
          />
        </Modal.Content>
        <Modal.Description>
        </Modal.Description>
        <Modal.Actions>
        </Modal.Actions>
      </Modal>
    )
  }

  renderSessionControls( ) {
    /*
    modalWindowTitle='ControlPanel'
    let test = this.props.defaultMeridianFlip;
     */
    return(
      <Modal
        open={this.state.modalOpenWindowSessionControls}
        onClose={this.modalCloseSessionsControls}
        basic
        size='small'
        closeIcon>
        <Modal.Header>Session Controls</Modal.Header>
        <Modal.Content>
          <SessionControls
            tsxInfo = { this.props.tsxInfo }
          />
        </Modal.Content>
        <Modal.Description>
        </Modal.Description>
        <Modal.Actions>
        </Modal.Actions>
      </Modal>
    )
  }

  render() {

    var RUNNING = '';
    var ACTIVE = false;
    var STATUS = 'Ready?';
    var DISABLE = true;
    var NOT_DISABLE = false;
    try {
      RUNNING = this.props.scheduler_running.value;
      ACTIVE = this.props.tool_active.value;
      STATUS =this.props.currentStage.value;
      PROGRESS = this.props.progress.value;
      TOTAL = this.props.progress_total.value;

    } catch (e) {
      // RUNNING = TheSkyXInfos.findOne({name: 'scheduler_running'}).value;
      // ACTIVE = TheSkyXInfos.findOne({name: 'tool_active'}).value;
      // STATUS = TheSkyXInfos.findOne({name: 'currentStage'}).value;
      // PROGRESS = TheSkyXInfos.findOne({name: 'tsx_progress'}).value;
      // TOTAL =  TheSkyXInfos.findOne({name: 'tsx_total'}).value;

    }
//     if( RUNNING == 'Stop'  && ACTIVE == false ){
//       DISABLE = false;
//       NOT_DISABLE = true;
// //      STATUS = "Ready?";
//     }

//    let PROGRESS = this.props.progress.value;
//    let TOTAL = this.props.progress_total.value;

//    if( TOTAL == 0 ) {
//      TOTAL = 60;
//    }
/*
<Label>
  {STATUS}
</Label>


value={PROGRESS}
total={TOTAL}

*/
    return (
      <Progress
        size='small'
        autoSuccess
        progress='ratio'
        value={0}
        total={1}
        >
        <Label>
          {STATUS}
        </Label>
        <Button.Group compact size='mini' floated='left'>
          <Button icon='detective' onClick={this.modalOpenSessionsControls}/>
        </Button.Group>
        {this.appButtons(RUNNING, ACTIVE)}
        {this.renderSessionControls()}
        {this.renderBackupModal()}
      </Progress>
    )
  }
}

export default withTracker(() => {
    return {
      // scheduler_running: TheSkyXInfos.findOne({name: 'scheduler_running'}),
  };
})(AppStates);
