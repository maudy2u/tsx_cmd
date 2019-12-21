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
import { Checkbox, Confirm, Input, Icon, Grid, Dropdown, Label, Table, Menu, Segment, Button, Progress, Modal, Form, Radio } from 'semantic-ui-react'

import {
  tsx_ServerStates,
  tsx_UpdateServerState,
  tsx_GetServerState,
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
    };
  }

  showModalCalibrationSettings() {
    this.setState({showModalCalibrationSettings: true });
  }

  closeModalCalibrationSettings() {
    this.setState({showModalCalibrationSettings: false });
  }

  // used for the modal exposure settings for flats
  handleStateChange = (e, { name, value }) => {
    this.setState({ [name]: value.trim() });
    this.saveDefaultStateValue( name, value.trim() );
    forceUpdate();
  };

  // Generic Method to determine default to save.
  saveDefaultStateValue( param, val ) {

    Meteor.call( 'updateServerState', param, val , function(error, result) {

        if (error && error.error === "logged-out") {
          // show a nice error message
          Session.set("errorMessage", "Please fix.");
        }
    });//.bind(this));
  }

  componentDidMount() {
    this.updateDefaults(this.props);
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
    console.log( ' Number of calibration targets found: ' + targets.length );
    Meteor.call( 'processCalibrationTargets', targets, function(error, result) {
      console.log('result: ' + result);
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

  calibrationSettingsTools(
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
          onChange={this.handleChange}
        />
        location:<br/>
        <br/>
        <Form.Input
         name='tool_flats_location'
         placeholder='Target name, Ra, or Alt: '
         value={flatRa}
         onChange={this.handleChange}/>
       <Form.Input
         name='tool_flats_dec_az'
         placeholder='Dec, or azimuth: '
         value={flatDec}
         onChange={this.handleChange}/>
     </div>
    )
  }

  calibrationTools(
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
         <Button disabled  compact />
         <Button disabled={DISABLE} onClick={this.gotoFlatPosition.bind(this)}>Slew</Button>
         <Button disabled  compact  />
         <Button disabled={DISABLE} icon='play' onClick={this.playButton.bind(this)} />
         <Button disabled={NOT_DISABLE} icon='stop' onClick={this.stopButton.bind(this)} />
      </Button.Group>
    )
  }

  addCalibration() {
    var out = addCalibrationFrame();
    // const id  = CalibrationFrames.insert(
    //   {
    //     subFrameTypes: "Flat",
    //     filter: "",
    //     exposure: 0,
    //     quantity: 0,
    //     level: 0,
    //     rotation: "",
    //     order: 0,
    //     binning: 1,
    //   }
    // );
  }

  stopButton() {
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

  calibrationSettings() {
    let DISABLED = true;

    if( this.props.scheduler_running.value == 'Stop'  && this.props.tool_active.value == false ){
      DISABLED = false;
    }
    return (
      <Button.Group basic size='mini' floated='right'>
        <Button disabled={DISABLED} icon='recycle' onClick={this.resetAngles.bind(this)}/>
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
            {this.calibrationSettingsTools(
              this.props.scheduler_running.value
              , this.props.tool_active.value
              , this.state.tool_flats_via
              , this.state.tool_flats_location
              , this.state.tool_flats_dec_az
            )}
          </Segment>
          <Segment raised>
            Enter the default exposure settings for each filter.<br/>
            <Form>
              <Form.Field inline >
              </Form.Field>
              {this.props.filters.map((filter)=>{
                return (
                  <Form.Field key={filter._id} inline>
                    <Label>
                      {filter.name}
                    </Label>
                    <Input
                      placeholder='Exposure'
                      name={filter._id}
                      value={filter.flat_exposure}
                      onChange={this.handleFilterChange}
                    />
              </Form.Field>
              )})}
            </Form>
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


  render() {

    return (
      <div>
      <h1>FLaTs</h1>
      <br />
      <b>Slew Position</b>
      <b>Edit Slew position</b>
      <Table basic celled unstackable >
           <Table.Header>
             <Table.Row >
              <Table.HeaderCell colSpan='7'  >
              {this.calibrationTools(
                this.props.scheduler_running
                , this.props.tool_active
              )}
              { this.calibrationSettings() }
              {this.renderModalCalibrationSettings()}
              </Table.HeaderCell>
             </Table.Row>
             <Table.Row>
               <Table.HeaderCell  >Type</Table.HeaderCell>
               <Table.HeaderCell  >Filter</Table.HeaderCell>
               <Table.HeaderCell  >Exp.(s)</Table.HeaderCell>
               <Table.HeaderCell  >Qty</Table.HeaderCell>
               <Table.HeaderCell  >Lvl</Table.HeaderCell>
               <Table.HeaderCell  >Temp</Table.HeaderCell>
               <Table.HeaderCell  ></Table.HeaderCell>
             </Table.Row>
          </Table.Header>
          <Table.Body>
          <Table.Row>
            <Table.Cell  >1</Table.Cell>
            <Table.Cell  >2</Table.Cell>
            <Table.Cell  >3.(s)</Table.Cell>
            <Table.Cell  >4</Table.Cell>
            <Table.Cell  >5</Table.Cell>
            <Table.Cell  >6</Table.Cell>
            <Table.Cell  >7</Table.Cell>
          </Table.Row>
          {this.props.calibrations.map((obj)=>{
            return (
               <CalibrationFrame
                key={obj._id}
                calibrations={this.props.calibrations}
                calibration={obj}
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
