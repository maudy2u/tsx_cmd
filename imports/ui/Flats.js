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

// import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';

import { Confirm, Input, Icon, Grid, Dropdown, Label, Table, Menu, Segment, Button, Progress, Modal, Form, Radio } from 'semantic-ui-react'

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
import {
  Filters,
  updateFlatExposure,
} from '../api/filters.js';
import {
  FlatSeries,
  addFlatSeries,
  addFlatFilter,
  resetStoredFlat,
} from '../api/flatSeries.js';

// Import the UI
import Target  from './Target.js';
import TargetSessionMenu from './TargetSessionMenu.js';
// import Filter from './Filter.js';
import Series from './Series.js';
import FlatGrid from './FlatGrid.js';
import TakeSeriesTemplateMenu from './TakeSeriesTemplateMenu.js';
//import TheSkyXInfo from './TheSkyXInfo.js';

class Flats extends Component {

  constructor() {
    super();
    this.state = {
      showModal: false,

      flatPosition: '',
      tool_flats_via: '',
      tool_flats_location: '',
      tool_flats_dec_az: '',
  };
  }


  showModal() {
    this.setState({showModal: true });
  }

  closeModal() {
    this.setState({showModal: false });
  }

  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value.trim() });
    this.saveDefaultStateValue( name, value.trim() );
    resetStoredFlat(this.props.flat._id);
    forceUpdate();
  };

  handleFilterChange = (e, { name, value }) => {
    var fid = name;
    updateFlatExposure( fid, value );
    resetStoredFlat(this.props.flat._id);
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
    // obtain calibration targetSession
    var targets = TargetSessions.find({ isCalibrationFrames: true }).fetch();

    Meteor.call( 'processCalibrationTargets', targets, function(error, result) {
      console.log('Error: ' + error);
      console.log('result: ' + result);
    }.bind(this));
  }


  gotoFlatPosition() {
    var slew = this.state.tool_flats_via;
    var location = this.state.tool_flats_location;
    var dec_az = this.state.tool_flats_dec_az;
    Meteor.call( 'slewPosition', slew, location, dec_az, function(error, result) {
      console.log('Error: ' + error);
      console.log('result: ' + result);
    }.bind(this));
  }

  flatsTools(
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

    if( state == 'Stop'  && active == false ) {
      return (
        <div>
         <Dropdown
            name='tool_flats_via'
            placeholder='Slew via...'
            selection options={slewOptions}
            value={flatSlewType}
            onChange={this.handleChange}
          />
         <br/>Provide a location (position) for OTA
         <br/>Location: <Form.Input
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
    else {
      return (
        <div>
         <Dropdown
            name='tool_flats_via'
            placeholder='Slew via...'
            selection options={slewOptions}
            value={flatSlewType}
            onChange={this.handleChange}
          />
         <br/>Provide a location (position) for OTA
         <br/>Location: <Form.Input
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
  }

  addFilterForFlats(
    state
    , active
    ) {
    if( state == 'Stop'  && active == false ) {
      return (
        <Button.Group>
            <Button icon='plus' onClick={addFlatSeries.bind(this)} />
            <Button icon='minus' onClick={this.gotoFlatPosition.bind(this)} />
            <Button disabled icon=''  />
            <Button  onClick={this.gotoFlatPosition.bind(this)}>Slew</Button>
            <Button disabled icon=''  />
            <Button icon='play' onClick={this.startFlats.bind(this)} />
         </Button.Group>
       )
    }
    else {
      return (
        <Button.Group icon>
           <Button disabled icon='plus' disabled onClick={addFlatSeries.bind(this)} />
           <Button disabled icon='minus' disabled onClick={this.gotoFlatPosition.bind(this)} />
           <Button disabled icon=''  />
           <Button disabled onClick={this.gotoFlatPosition.bind(this)}>Slew</Button>
           <Button disabled icon=''  />
           <Button disabled icon='play' onClick={this.startFlats.bind(this)} />
        </Button.Group>
      )
    }

  }

  flatSettings() {
    if( this.props.scheduler_running.value == 'Stop'  && this.props.tool_active.value == false ){
      return (
        <Button.Group basic size='mini' floated='right'>
          <Button icon='settings' onClick={this.showModal.bind(this)}/>
        </Button.Group>
      )
    }
    else {
      return (
        <Button.Group basic size='mini' floated='right'>
          <Button disabled icon='settings' onClick={this.showModal.bind(this)}/>
        </Button.Group>
      )
    }
  }

  render() {

    return (
      <div>
        <h1>FLATs</h1>
        {this.addFilterForFlats(
          this.props.scheduler_running.value
          , this.props.tool_active.value
        )}
        { this.flatSettings() }
          <br />
            Remember to check if the Rotator position is set.
            If it is set then the position needs to be set.
            Used the tsx_RotateCamera, same as the toolbox,
            but everything can be ignored, as it is a simple
            rotatorPosition.
          <br />
          Look to delete from the drop down and thus delete
          the stored target angle.
          <Segment raised>
            <h4>Flat position</h4>
            {this.flatsTools(
              this.props.scheduler_running.value
              , this.props.tool_active.value
              , this.state.tool_flats_via
              , this.state.tool_flats_location
              , this.state.tool_flats_dec_az
            )}
          </Segment>
          <h4>FLAT Series</h4>
          {
            this.props.flatSeries.map((flat)=>{
              return (
                <FlatGrid
                  key={flat._id}
                  flat={flat}
                  scheduler_report={this.props.scheduler_report}
                  tsxInfo={this.props.tsxInfo}
                  scheduler_running={this.props.scheduler_running}
                  tool_active = {this.props.tool_active}
                  flatSeries = {this.props.flatSeries}
                />
            )})
          }
        <Modal
          open={this.state.showModal}
          onClose={this.closeModal.bind(this)}
          basic
          size='small'
          closeIcon>
          <Modal.Header>Flat Filter Exposures</Modal.Header>
          <Modal.Content>
            <Segment raised>
              <Form>
                <Form.Field inline >
                    <Label>Filter</Label>
                    <Label>Exposure</Label>
                    <br/>
                </Form.Field>
                {this.props.filters.map((filter)=>{
                  return (
                    <Form.Field key={filter._id} inline pointing='right'>
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
          </Modal.Content>
          <Modal.Description>
          Enter the default exposure settings for each filter.
          </Modal.Description>
          <Modal.Actions>
          </Modal.Actions>
        </Modal>
    </div>
    )
  }
}
export default withTracker(() => {
  return {
};
})(Flats);
