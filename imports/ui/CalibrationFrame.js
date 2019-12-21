CalibrationFrame/*
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
} from '../api/filters.js';

// import {
//   CalibrationFrames,
//   calibrationTypes,
//   addCalibrationFrame,
//   updateCalibrationFrame,
//  } from '../api/calibrationFrames.js';

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
  }

  // Initialize states
  componentWillMount() {
    // // do not modify the state directly
    if( typeof this.props.calibrationFrame == 'undefined') {
      return;
    }
    this.setState({
      id: this.props.calibrationFrame._id,
      subFrameTypes: calibrationFrame.subFrameTypes,
      filter: calibrationFrame.filter,
      exposure: calibrationFrame.exposure,
      level: calibrationFrame.level,
      quantity: calibrationFrame.quantity,
      rotation: calibrationFrame.rotation,
      order: calibrationFrame.order,
      binning: calibrationFrame.binning,
    });
  }

  handleChange = (e, { name, value }) => {

    this.setState({ [name]: value });
    updateCalibrationFrame(
      this.props.calibrationFrame._id,
      name,
      value,
    );
  };

  componentDidMount() {
    this.updateDefaults(this.props);
  }

  updateDefaults(nextProps) {
    if( typeof nextProps == 'undefined'  ) {
      return;
    }

    if( typeof nextProps.calibrationFrame != 'undefined'  ) {
      this.setState({
        id: nextProps.calibrationFrame._id
      });
      this.setState({
        subFrameTypes: nextProps.calibrationFrame.subFrameTypes
      });
      this.setState({
        filter: nextProps.calibrationFrame.filter
      });
      this.setState({
        exposure: nextProps.calibrationFrame.exposure
      });
      this.setState({
        level: nextProps.calibrationFrame.level
      });
      this.setState({
        quantity: nextProps.calibrationFrame.quantity
      });
      this.setState({
        rotation: nextProps.calibrationFrame.rotation
      });
      this.setState({
        order: nextProps.calibrationFrame.order
      });
      this.setState({
        binning: nextProps.calibrationFrame.binning
      });
    }
  }

  deleteEntry() {
    // check if the series is used - if so cannot delete... list the Targets using it
    CalibrationFrames.remove({_id:this.props.calibrationFrame._id});
  }

  render() {

/*


options={calibrationTypes()}
options={renderDropDownFilters()}

*/
    return (
      <Table.Row>
      <Table.Cell   >
          <Dropdown
            button
            search
            wrapSelection
            scrolling
            name='subFrameTypes'
            placeholder='subFrameTypes'
            text='hi'
          />
        </Table.Cell>
        <Table.Cell   >
          <Dropdown
              button
              search
              wrapSelection
              scrolling
              name='filter'
              placeholder='Filter'
              text='hi'
            />
        </Table.Cell>
        <Table.Cell   >
          <Input
            fluid
            name='exposure'
            placeholder='Exposure'
            value=''
          />
        </Table.Cell>
        <Table.Cell   >
          <Input
            fluid
            name='quantity'
            placeholder='Quantity'
            value=''
          />
        </Table.Cell>
        <Table.Cell   >
          <Input
          fluid
            name='level'
            placeholder='Level'
            value=''
          />
        </Table.Cell>
        <Table.Cell   >
          <Input
            fluid
            name='level'
            placeholder='-5'
            value=''
          />
        </Table.Cell>
        <Table.Cell   >
         <Button.Group basic size='mini'>
          <Button icon='delete'}/>
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
