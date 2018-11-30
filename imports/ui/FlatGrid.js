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
import { Button, Segment, Dropdown, Grid, Input, Modal, Item, Header, Icon, Table, } from 'semantic-ui-react'
import {
  tsx_ServerStates,
  tsx_UpdateServerState,
  tsx_GetServerState,
} from  '../api/serverStates.js';

// Import the API Model
import { TakeSeriesTemplates} from '../api/takeSeriesTemplates.js';
import { TargetSessions } from '../api/targetSessions.js';
import { TargetReports } from '../api/targetReports.js';
import {
  TargetAngles,
  renderDropDownAngles,
} from '../api/targetAngles.js';

import { TheSkyXInfos } from '../api/theSkyXInfos.js';
import {
  Filters,
} from '../api/filters.js';
import {
  FlatSeries,
  addFlatFilter,
  updateFlatRotation,
 } from '../api/flatSeries.js';

 import Flat from './Flat.js';

export const subFrameTypes = [
  'Flat',
  'Dark',
  'Bias',
];

class FlatGrid extends Component {

  state = {
    rotatorPosition: '',
  }

  editOpen = () => this.setState({ editOpen: true })
  editClose = () => this.setState({ editOpen: false })
  deleteFailedOpen = () => this.setState({ deleteFailed: true })
  deleteFailedClose = () => this.setState({ deleteFailed: false })

  handleChange = (e, { name, value }) => {

    this.setState({ [name]: value });

    updateFlatRotation(
      this.props.flat._id,
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

    if( typeof nextProps.flat != 'undefined'  ) {
      this.setState({
        rotatorPosition: nextProps.flat.rotatorPosition
      });
    }
  };

  deleteEntry() {
    // check if the series is used - if so cannot delete... list the Targets using it
    FlatSeries.remove({_id:this.props.flat._id});
  }
  addEntry() {
    // check if the series is used - if so cannot delete... list the Targets using it
    addFlatFilter( this.props.flat._id);
  }
  render() {
    //{this.props.flat.rotatorPosition}

    return (
      <Segment key={this.props.flat._id} raised>
        <Button icon='delete' onClick={this.deleteEntry.bind(this)}/> RotatorGroup:
        <Button.Group basic size='mini' floated='right'>
        </Button.Group>
        <Dropdown
          fluid
          compact
          selection
          name='rotatorPosition'
          options={renderDropDownAngles()}
          placeholder='Pick Rotator'
          value={this.state.rotatorPosition}
          onChange={this.handleChange}
        />
          <Grid columns={5} centered divided='vertically'>
            <Grid.Row >
              <Grid.Column>
                <b>Frame</b>
              </Grid.Column>
              <Grid.Column>
                <b>Filter</b>
              </Grid.Column>
              <Grid.Column>
                <b>Exposure</b>
              </Grid.Column>
              <Grid.Column>
                <b>Repeat</b>
              </Grid.Column>
              <Grid.Column>
                <Button size='mini' icon='plus' onClick={this.addEntry.bind(this)}/>
              </Grid.Column>
            </Grid.Row>
            {this.props.flat.filtergroup.map((filter)=>{
                return (
                  <Flat key={filter._id}
                    flat={this.props.flat}
                    scheduler_report={this.props.scheduler_report}
                    tsxInfo={this.props.tsxInfo}
                    scheduler_running={this.props.scheduler_running}
                    tool_active = {this.props.tool_active}
                    filter = {filter}
                    flatSeries = {this.props.flatSeries}
                  />
                )
              })
            }
          </Grid>
      </Segment>
    )
  }

}

export default withTracker(() => {
    return {
  };
})(FlatGrid);
