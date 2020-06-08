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
//import ReactDOM from 'react-dom';
// import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';
import {
  Checkbox,
  Confirm,
  Input,
  Icon,
  Grid,
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
  Accordion,
  Divider,
} from 'semantic-ui-react'

import {
  tsx_ServerStates,
  tsx_UpdateServerState,
  tsx_GetServerState,
  saveDefaultStateValue,
} from  '../api/serverStates.js';

import { TheSkyXInfos } from '../api/theSkyXInfos.js';

import {
  Filters,
  updateFlatExposure,
} from '../api/filters.js';

import {
  CalibrationFrames,
  calibrationTypes,
  addCalibrationFrame,
  updateCalibrationFrame,
 } from '../api/calibrationFrames.js';


import CalibrationFrame from './CalibrationFrame.js';


// Import the UI
class CalibrationsMenu extends Component {

  constructor() {
    super();
    this.state = {
      showModalCalibrationSettings: false,

      flatPosition: '',
      tool_flats_via: '',
      tool_flats_location: '',
      tool_flats_dec_az: '',

      activeIndex: 1,
    };
  }

  showModalCalibrationSettings() {
    this.setState({showModalCalibrationSettings: true });
  }

  closeModalCalibrationSettings() {
    this.setState({showModalCalibrationSettings: false });
  }

  // used for Accordion
  handleClick = (e, titleProps) => {
   const { index } = titleProps
   const { activeIndex } = this.state
   const newIndex = activeIndex === index ? -1 : index

   this.setState({ activeIndex: newIndex })
 }

  // used for the modal exposure settings for flats
  handleStateChange = (e, { name, value }) => {
    this.setState({ [name]: value.trim() });
    saveDefaultStateValue( name, value.trim() );
    forceUpdate();
  };

//  handleToggle = (e, { name, value }) => this.setState({
//    [name]: Boolean(!eval('this.state.'+name)) })

  handleToggleAndSave = (e, { name, value }) => {
    var val = eval( 'this.state.' + name);

    this.setState({
      [name]: !val
    });
    saveDefaultStateValue( name, !val );
  };

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
    if( typeof nextProps.tsxInfo != 'undefined'  ) {

      this.setState({
        tool_flats_via: nextProps.tsxInfo.find(function(element) {
          return element.name == 'tool_flats_via';
      }).value});

      this.setState({
        tool_flats_dec_az: nextProps.tsxInfo.find(function(element) {
          return element.name == 'tool_flats_dec_az';
      }).value});

      this.setState({
        tool_flats_location: nextProps.tsxInfo.find(function(element) {
          return element.name == 'tool_flats_location';
      }).value});
    }

  }

  playButton() {
    // obtain calibration targetSession
    Meteor.call( 'processCalibrationTargets', function(error, result) {

    }.bind(this));
  }

  findFilterLevels() {
    // obtain calibration targetSession
    Meteor.call( 'findFilterLevels', function(error, result) {
      alert('Filter Levels: ' + result);
    }.bind(this));
  }

  gotoFlatPosition() {
    var slew = this.state.tool_flats_via;
    var location = this.state.tool_flats_location;
    var dec_az = this.state.tool_flats_dec_az;
    Meteor.call( 'slewPosition', slew, location, dec_az, 1, function(error, result) {
      console.log('Slew result: ' + result);
    }.bind(this));
  }

  renderCalibrationMountPosition(
      state
    , active
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
        value: 'Alt/Az',
      },
      {
        text: 'Target name',
        value: 'Target name',
      },
      {
        text: '',
        value: '',
      },
    ];
    return (
      <div>
        Pointing (position) for OTA calibration<br/>
        <br/>
       <Dropdown
          name='tool_flats_via'
          placeholder='Slew via...'
          selection options={slewOptions}
          value={flatSlewType}
          onChange={this.handleStateChange}
        />
        location:<br/>
        <br/>
        <Form.Input
         name='tool_flats_location'
         placeholder='Target name, Ra, or Alt: '
         value={flatRa}
         onChange={this.handleStateChange}/>
       <Form.Input
         name='tool_flats_dec_az'
         placeholder='Dec, or azimuth: '
         value={flatDec}
         onChange={this.handleStateChange}/>
     </div>
    )
  }

  renderCalibrationControls(
    state
    , active
    ) {
    var DISABLE = true;
    var NOT_DISABLE = false;

    // then use as needed disabled={DISABLE} or disabled={NOT_DISABLE}
    if( state.value == 'Stop'  && active.value == false ){
      DISABLE = false;
      NOT_DISABLE = true;
    }

    return (
      <Button.Group icon>
         <Button disabled={DISABLE} icon='plus' onClick={this.addCalibration.bind(this)} />
         <Button disabled compact />
         <Button disabled={DISABLE} icon='play' onClick={this.playButton.bind(this)} />
         <Button disabled={NOT_DISABLE} icon='stop' onClick={this.stopButton.bind(this)} />
      </Button.Group>
    )
  }

  addCalibration() {
    var out = addCalibrationFrame();
  }

  stopButton() {
    // this.tsxStopSession();
    Meteor.call("artesky_off", function (error, result) {
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

  resetAngles() {
    let ids = this.props.flatSeries;
    for( let i=0; i<ids.length; i++ ) {
      let id = ids[i];
      resetStoredFlat(id._id);
      // update state... meteor will update later
      this.props.flatSeries[i].enabledActive = false;
    }
    eraseAllAngles();
    this.render();
  }

  renderCalibrationButtonBar() {
    let DISABLED = true;

    if( this.props.scheduler_running.value == 'Stop'  && this.props.tool_active.value == false ){
      DISABLED = false;
    }
    return (
      <Button.Group basic size='mini' floated='right'>
        <Button disabled={DISABLED} onClick={this.gotoFlatPosition.bind(this)}>Slew</Button>
        <Button disabled  compact  />
        <Button disabled={DISABLED} icon='find' onClick={this.findFilterLevels.bind(this)} />
        <Button disabled compact />
        <Button disabled={true} icon='recycle' onClick={this.resetAngles.bind(this)}/>
        <Button disabled={DISABLED} icon='settings' onClick={this.showModalCalibrationSettings.bind(this)}/>
      </Button.Group>
    )
  }

  renderModalCalibrationSettings() {
    return (
      <Modal
        open={this.state.showModalCalibrationSettings}
        onClose={this.closeModalCalibrationSettings.bind(this)}
        basic
        size='small'
        closeIcon>
        <Modal.Header>Calibration Settings</Modal.Header>
        <Modal.Content>
        <Segment secondary >
          <Segment raised>
            {this.renderCalibrationMountPosition(
              this.props.scheduler_running.value
              , this.props.tool_active.value
              , this.state.tool_flats_via
              , this.state.tool_flats_location
              , this.state.tool_flats_dec_az
            )}
          </Segment>
         </Segment>
        </Modal.Content>
        <Modal.Description>
        </Modal.Description>
        <Modal.Actions>
        </Modal.Actions>
      </Modal>
    )
  }

  renderFlatbox_level() {
  if( this.props.flatbox_enabled.value === true ) {
      return (
        <Table.HeaderCell  >Level</Table.HeaderCell>
      )
    }
  }


  render() {

    return (
      <div>
      <h1>Calibration files: FLaTs, DArKs, BIaS</h1>
      <br />
      <Table basic celled compact unstackable >
           <Table.Header>
             <Table.Row >
              <Table.HeaderCell colSpan='7'  >
              {this.renderCalibrationControls(
                this.props.scheduler_running
                , this.props.tool_active
              )}
              { this.renderCalibrationButtonBar() }
              { this.renderModalCalibrationSettings()}
              </Table.HeaderCell>
             </Table.Row>
             <Table.Row>
               <Table.HeaderCell  >On/Off</Table.HeaderCell>
               <Table.HeaderCell  >Frame</Table.HeaderCell>
               <Table.HeaderCell  >Filter</Table.HeaderCell>
               <Table.HeaderCell  >Bin</Table.HeaderCell>
               <Table.HeaderCell  >Exp(s)</Table.HeaderCell>
               <Table.HeaderCell  >Temp.</Table.HeaderCell>
               <Table.HeaderCell  >Quantity</Table.HeaderCell>
               { this.renderFlatbox_level() }
               <Table.HeaderCell  ></Table.HeaderCell>
             </Table.Row>
          </Table.Header>
          <Table.Body>
          {this.props.calibrations.map((obj)=>{
            return (
               <CalibrationFrame
                key={obj._id}
                calibrations={this.props.calibrations}
                calibration={obj}
                flatbox_enabled={this.props.flatbox_enabled}
                tsxInfo={this.props.tsxInfo}
                scheduler_running={this.props.scheduler_running}
                tool_active={this.props.tool_active}
              />
            )
          })}
          </Table.Body>
       </Table>
      </div>
    )
  }
}
export default withTracker(() => {
  return {
  };
})(CalibrationsMenu);
