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
import { Button, Dropdown, Grid, Label, Input, Modal, Item, Header, Icon, Table, } from 'semantic-ui-react'
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
  renderDropDownFilters,
  getFlatExposure,
} from '../api/filters.js';

import {
  FlatSeries,
  deleteFlatFilter,
  updateFlatFilter,
 } from '../api/flatSeries.js';

export const subFrameTypes = [
  'Flat',
  'Dark',
  'Bias',
];

class Flat extends Component {

  state = {
    frame: 'Flat',
    filter: '',
    exposure: 0,
    repeat: 1,
  }

  editOpen = () => this.setState({ editOpen: true })
  editClose = () => this.setState({ editOpen: false })
  deleteFailedOpen = () => this.setState({ deleteFailed: true })
  deleteFailedClose = () => this.setState({ deleteFailed: false })

  handleChange = (e, { name, value }) => {

    this.setState({ [name]: value });
    updateFlatFilter(
      this.props.flat._id,
      this.props.filter._id,
      name,
      value,
    );
  };

  handleFilterChange = (e, { name, value }) => {

    this.setState({ [name]: value });
    updateFlatFilter(
      this.props.flat._id,
      this.props.filter._id,
      name,
      value,
    );
    var e = getFlatExposure( value );
    this.setState( {exposure: e } );
    updateFlatFilter(
      this.props.flat._id,
      this.props.filter._id,
      'exposure',
      e,
    );
  };

  componentDidMount() {
    this.updateDefaults(this.props);
  }

  updateDefaults(nextProps) {
    if( typeof nextProps == 'undefined'  ) {
      return;
    }

    if( typeof nextProps.filter != 'undefined'  ) {
      this.setState({
        frame: nextProps.filter.frame
      });
      this.setState({
        filter: nextProps.filter.filter
      });
      this.setState({
        exposure: nextProps.filter.exposure
      });
      this.setState({
        repeat: nextProps.filter.repeat
      });
    }
  }

  // *******************************
  // This is used to populate drop down frame lists
  renderDropDownFrames() {

    var frameArray = [];
    for (var i = 0; i < subFrameTypes.length; i++) {
      frameArray.push({ key: subFrameTypes[i], text: subFrameTypes[i], value: subFrameTypes[i] });
    }
    return frameArray;
  }


  deleteEntry() {
    // check if the series is used - if so cannot delete... list the Targets using it
    deleteFlatFilter(this.props.flat._id, this.props.filter._id);
  }

  render() {

/*
<Grid.Column width={1}>
  <Dropdown
    fluid
    name='frame'
    options={this.renderDropDownFrames()}
    placeholder='Frame'
    value={this.state.frame}
    onChange={this.handleChange}
  />
</Grid.Column>

*/

    return (
      <Grid.Row centered textAlign='center' >
        <Grid.Column>
          <Dropdown
            fluid
            name='filter'
            options={renderDropDownFilters()}
            placeholder='Filter'
            value={this.state.filter}
            onChange={this.handleFilterChange}
          />
        </Grid.Column>
        <Grid.Column>
          <Label>
          {this.state.exposure}
          </Label>
        </Grid.Column>
        <Grid.Column>
          <Input
            fluid
            placeholder='Repeat'
            name='repeat'
            value={this.state.repeat}
            onChange={this.handleChange}
          />
        </Grid.Column>
        <Grid.Column>
          <Button.Group basic size='mini' floated='right'>
            <Button icon='delete' onClick={this.deleteEntry.bind(this)}/>
          </Button.Group>
        </Grid.Column>
      </Grid.Row>
    )
  }

}

export default withTracker(() => {
    return {
  };
})(Flat);
