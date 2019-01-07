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
import { Checkbox, Confirm, Input, Icon, Grid, Dropdown, Label, Table, Menu, Segment, Button, Progress, Modal, Form, Radio } from 'semantic-ui-react'

import {
  TargetAngles,
  eraseAllAngles,
} from '../api/targetAngles.js';

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
  flatSeriesDescription,
  flatSeriesName,
} from '../api/flatSeries.js';

// Import the UI
import {
  Series,
  seriesDescription,
} from './Series.js';
import Target  from './Target.js';
import TargetSessionMenu from './TargetSessionMenu.js';
import FlatGrid from './FlatGrid.js';
import FlatMenuItem from './FlatMenuItem.js';
import TakeSeriesTemplateMenu from './TakeSeriesTemplateMenu.js';
//import TheSkyXInfo from './TheSkyXInfo.js';

class FlatsMenu extends Component {

  constructor() {
    super();
    this.state = {
      showModalFlatSettings: false,

      flatPosition: '',
      tool_flats_via: '',
      tool_flats_location: '',
      tool_flats_dec_az: '',
    };
  }

  showModalFlatSettings() {
    this.setState({showModalFlatSettings: true });
  }

  closeModalFlatSettings() {
    this.setState({showModalFlatSettings: false });
  }

  // used for the modal exposure settings for flats
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
    return (
      <div>
       <Dropdown
          name='tool_flats_via'
          placeholder='Slew via...'
          selection options={slewOptions}
          value={flatSlewType}
          onChange={this.handleChange}
        />
        <br/><Label>Provide a location (position) for OTA</Label>
        <br/><Label>Location: </Label><Form.Input
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

  addFilterForFlats(
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
         <Button disabled={DISABLE} icon='plus' onClick={addFlatSeries.bind(this)} />
         <Button disabled  compact />
         <Button disabled={DISABLE} onClick={this.gotoFlatPosition.bind(this)}>Slew</Button>
         <Button disabled  compact  />
         <Button disabled={DISABLE} icon='play' onClick={this.startFlats.bind(this)} />
         <Button disabled={NOT_DISABLE} icon='stop' onClick={this.stopScheduler.bind(this)} />
      </Button.Group>
    )
  }

  stopScheduler() {
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

  flatSettings() {
    let DISABLED = true;

    if( this.props.scheduler_running.value == 'Stop'  && this.props.tool_active.value == false ){
      DISABLED = false;
    }
    return (
      <Button.Group basic size='mini' floated='right'>
        <Button disabled={DISABLED} icon='recycle' onClick={this.resetAngles.bind(this)}/>
        <Button disabled={DISABLED} icon='settings' onClick={this.showModalFlatSettings.bind(this)}/>
      </Button.Group>
    )
  }

  renderModalFlatSettings() {
    return (
      <Modal
        open={this.state.showModalFlatSettings}
        onClose={this.closeModalFlatSettings.bind(this)}
        basic
        size='small'
        closeIcon>
        <Modal.Header>Settings</Modal.Header>
        <Modal.Content>
        <Segment secondary >
          <Segment raised>
            <Label>Flat position</Label>
            {this.flatsTools(
              this.props.scheduler_running.value
              , this.props.tool_active.value
              , this.state.tool_flats_via
              , this.state.tool_flats_location
              , this.state.tool_flats_dec_az
            )}
          </Segment>
          <Segment raised>
            <Label>Enter the default exposure settings for each filter.</Label>
            <Form>
              <Form.Field inline >
                  <Label>Filter</Label>
                  <Label>Exposure</Label>
                  <br/>
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
  renderModalFlatGrid( flat ) {
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
    )
  }

  render() {

    return (
      <div>
        <h1>FLaTs</h1>
        {this.addFilterForFlats(
          this.props.scheduler_running
          , this.props.tool_active
        )}
        { this.flatSettings() }
        {this.renderModalFlatSettings()}
        <br />
        {
          this.props.flatSeries.map((flat)=>{
//            return this.renderModalFlatGrid( flat );
//seriesDescription( this.props.seriesTemplate );
            return (
              <FlatMenuItem
                key={flat._id}
                flat={flat}
                scheduler_running={this.props.scheduler_running}
                tool_active = {this.props.tool_active}
              />
            )
          })
        }
    </div>
    )
  }
}
export default withTracker(() => {
  return {
};
})(FlatsMenu);
