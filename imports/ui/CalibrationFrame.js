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

import React, { Component } from 'react'
import { withTracker } from 'meteor/react-meteor-data';
import {
  Button,
  Checkbox,
  Dropdown,
  Label,
  Input,
  Header,
  Icon,
  Table,
} from 'semantic-ui-react'

import {
  tsx_ServerStates,
  tsx_UpdateServerState,
  tsx_GetServerState,
} from  '../api/serverStates.js';

// Import the API Model
import {
  TheSkyXInfos
} from '../api/theSkyXInfos.js';

import {
  Filters,
  renderDropDownFilters,
  getFlatExposure,
} from '../api/filters.js';

import {
  CalibrationFrames,
  calibrationTypes,
  addCalibrationFrame,
  updateCalibrationFrame,
 } from '../api/calibrationFrames.js';

class CalibrationFrame extends Component {

  state = {
    id: '',
    subFrameTypes: 'Flat',
    filter: '',
    exposure: 0,
    level: 0,
    quantity: 1,
    rotation: '',
    order: 0,
    binning: 1,
    on_enabled: true,
    flatbox_enabled: false,
  }

  // Initialize states
  componentWillMount() {
    // // do not modify the state directly

    if( typeof this.props.calibration == 'undefined') {
      return;
    }
    this.setState({
      id: this.props.calibration._id,
      subFrameTypes: this.props.calibration.subFrameTypes,
      filter: this.props.calibration.filter,
      exposure: this.props.calibration.exposure,
      level: this.props.calibration.level,
      quantity: this.props.calibration.quantity,
      rotation: this.props.calibration.rotation,
      order: this.props.calibration.order,
      binning: this.props.calibration.binning,
      on_enabled: this.props.calibration.on_enabled,
    });
  }

  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value });
    updateCalibrationFrame(
      this.props.calibration._id,
      name,
      value,
    );
  };
  handleToggle = (e, { name }) => {
    var val = eval( 'this.state.' + name);
    this.setState({
      [name]: !val
    });
    updateCalibrationFrame(
      this.props.calibration._id,
      name,
      !val,
    );
  };


  componentDidMount() {
    this.updateDefaults(this.props);
  }

  updateDefaults(nextProps) {
    if( typeof nextProps == 'undefined'  ) {
      return;
    }
    if( typeof nextProps.tsxInfo != 'undefined'  ) {
      this.setState({
        flatbox_enabled: nextProps.tsxInfo.flatbox_enabled
      });
    }
    if( typeof nextProps.calibration != 'undefined'  ) {
      this.setState({
        id: nextProps.calibration._id
      });
      this.setState({
        subFrameTypes: nextProps.calibration.subFrameTypes
      });
      this.setState({
        filter: nextProps.calibration.filter
      });
      this.setState({
        exposure: nextProps.calibration.exposure
      });
      this.setState({
        level: nextProps.calibration.level
      });
      this.setState({
        quantity: nextProps.calibration.quantity
      });
      this.setState({
        rotation: nextProps.calibration.rotation
      });
      this.setState({
        order: nextProps.calibration.order
      });
      this.setState({
        binning: nextProps.calibration.binning
      });
      this.setState({
        on_enabled: nextProps.calibration.on_enabled
      });
    }
  }

  deleteEntry() {
     // check if the series is used - if so cannot delete... list the Targets using it
     CalibrationFrames.remove({_id:this.props.calibration._id});
  }

  renderFlatbox_level() {
    if( this.props.flatbox_enabled == true ) {
      return (
        <Table.Cell   >
          <Input
            fluid
            size='mini'
            name='level'
            placeholder='Level'
            value={this.state.level}
            onChange={this.handleChange}
          />
        </Table.Cell>
      )
    }
  }

  render() {

    return (
      <Table.Row>
      <Table.Cell   >
      <Checkbox
        name='on_enabled'
        label=''
        checked={this.state.on_enabled }
        onChange={this.handleToggle}
        />
      </Table.Cell   >
      <Table.Cell   >
          <Dropdown
            button
            size='mini'
            search
            wrapSelection
            scrolling
            name='subFrameTypes'
            options={calibrationTypes()}
            placeholder='subFrameTypes'
            text={this.state.subFrameTypes}
            onChange={this.handleChange}
          />
        </Table.Cell>
        <Table.Cell   >
          <Dropdown
              button
              size='mini'
              search
              wrapSelection
              scrolling
              name='filter'
              options={renderDropDownFilters()}
              placeholder='Filter'
              text={this.state.filter}
              onChange={this.handleChange}
            />
        </Table.Cell>
        <Table.Cell   >
          <Input
            fluid
            size='mini'
            name='exposure'
            placeholder='Exposure'
            value={this.state.exposure}
            onChange={this.handleChange}
          />
        </Table.Cell>
        <Table.Cell   >
          <Input
            fluid
            size='mini'
            name='quantity'
            placeholder='Quantity'
            value={this.state.quantity}
            onChange={this.handleChange}
          />
        </Table.Cell>
        { this.renderFlatbox_level()}
        <Table.Cell   >
         <Button.Group basic size='mini'>
            <Button icon='delete' onClick={this.deleteEntry.bind(this)}/>
          </Button.Group>
        </Table.Cell>
      </Table.Row>
    )
  }
}

export default withTracker(() => {
    return {
  };
})(CalibrationFrame);
