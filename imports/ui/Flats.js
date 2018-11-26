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

      flatPosition: '',

  };

  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value.trim() });
    this.saveDefaultState( name );
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

    if( typeof nextProps.reports != 'undefined'  ) {
      this.setState({
        defaultSoftPark: Boolean(nextProps.tsxInfo.find(function(element) {
          return element.name == 'defaultSoftPark';
        }).value),
      });
    }
    if( typeof nextProps.tsxInfo != 'undefined'  ) {
      this.setState({
        flatPosition: Boolean(nextProps.tsxInfo.find(function(element) {
          return element.name == 'flatPosition';
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

  stopFlats() {
    // this.tsxStopSession();
    Meteor.call("stopScheduler", function (error, result) {
        // identify the error
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

  startFlats() {
    Meteor.call( 'testTargetPicking', function(error, result) {
      console.log('Error: ' + error);
      console.log('result: ' + result);
    }.bind(this));
  }

  gotoFlatPosition() {
    Meteor.call( 'testEndConditions', function(error, result) {
      console.log('Error: ' + error);
      console.log('result: ' + result);
    }.bind(this));
  }

  flatsTools( state
    , flatSlewType
    , flatRa
    , flatDec
  ) {

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
            <Button  onClick={this.gotoFlatPosition.bind(this)}>Slew</Button>
         </Button.Group>
         <Dropdown
            name='tool_flats_slew_via'
            placeholder='Slew via...'
            selection options={slewOptions}
            value={flatSlewType}
            onChange={this.handleChange}
          />
         <br/>Provide a location (position) for OTA
         <br/>Location: <Form.Input
           name='tool_flats_slew_ra'
           placeholder='Ra/Alt: '
           value={flatRa}
           onChange={this.handleChange}/>
         <Form.Input
           name='tool_flats_slew_dec'
           placeholder='Dec/Az: '
           value={flatDec}
           onChange={this.handleChange}/>
       </div>
      )
    }
    else {
      return (
        <div>
         <Button.Group icon>
            <Button  disabled='true' onClick={this.gotoFlatPosition.bind(this)}>Slew</Button>
         </Button.Group>
         <Dropdown
            name='tool_flats_slew_via'
            placeholder='Slew via...'
            selection options={slewOptions}
            value={flatSlewType}
            onChange={this.handleChange}
          />
         <br/>Provide a location (position) for OTA
         <br/>Location: <Form.Input
           name='tool_flats_slew_ra'
           placeholder='Ra/Alt: '
           value={flatRa}
           onChange={this.handleChange}/>
         <Form.Input
           name='tool_flats_slew_dec'
           placeholder='Dec/Az: '
           value={flatDec}
           onChange={this.handleChange}/>
       </div>
      )
    }
  }

  render() {

    return (
      <div>
        <Segment raised>
          {this.flatsTools(
            this.props.scheduler_running.value,
          )}
        </Segment>
        <Segment raised>
        Present the targets, and check of which ones to
        calibrate - use the target FOV rotator position
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
