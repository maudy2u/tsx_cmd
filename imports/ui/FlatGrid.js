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
import { Button, Segment, Checkbox, Dropdown, Grid, Input, Modal, Item, Header, Icon, Table, } from 'semantic-ui-react'
import {
  tsx_ServerStates,
  tsx_UpdateServerState,
  tsx_GetServerState,
} from  '../api/serverStates.js';

// Import the API Model
import {
  Seriess
} from '../api/seriess.js';
import {
  TakeSeriesTemplates,
  addNewTakeSeriesTemplate,
} from '../api/takeSeriesTemplates.js';
import {
  TargetSessions,
  addNewTargetSession,
} from '../api/targetSessions.js';
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
  updateFlatSeries,
  deleteAnyFlatTargets,
  resetStoredFlat,
 } from '../api/flatSeries.js';

 import Flat from './Flat.js';

export const subFrameTypes = [
  'Flat',
  'Dark',
  'Bias',
];

class FlatGrid extends Component {

  constructor(props) {
    super(props);

    this.disableFlat = this.disableFlat.bind(this);

    this.state = {
        rotatorPosition: '',
        enabledActive: false,
    };

  }

  editOpen = () => this.setState({ editOpen: true })
  editClose = () => this.setState({ editOpen: false })
  deleteFailedOpen = () => this.setState({ deleteFailed: true })
  deleteFailedClose = () => this.setState({ deleteFailed: false })

  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value });
    updateFlatSeries(
      this.props.flat._id,
      name,
      value,
    );
    resetStoredFlat(this.props.flat._id);
    this.disableFlat();
  };

  disableFlat() {
    //this.state.enabledActive
    this.setState({
      enabledActive: false
    })
  }

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
      this.setState({
        enabledActive: nextProps.flat.enabledActive
      });
    }
  };

  deleteEntry() {
    // check if the series is used - if so cannot delete... list the Targets using it
    resetStoredFlat(this.props.flat._id);
    FlatSeries.remove({_id: this.props.flat._id});
    this.disableFlat();
  }

  addEntry() {
    // check if the series is used - if so cannot delete... list the Targets using it
    addFlatFilter( this.props.flat._id);
    resetStoredFlat(this.props.flat._id);
    this.disableFlat();
  }

  // *******************************
  // THis handles the creation of the Calibration target series...
  // *******************************
  handleToggleOfCalibrationTargets = (e, { name, checked }) => {
    this.setState({
      [name]: checked
    });
    updateFlatSeries(
      this.props.flat._id,
      name,
      checked,
    );

    // *******************************
    // IF TURNED ON
    if( checked ) {
      // create the targetTransit
      //      var tid = addNewTakeSeriesTemplate();
      let tid = TakeSeriesTemplates.insert(
        {
          name: this.props.flat._id,
          description: "Flat series id",
          processSeries:"per series",
          repeatSeries: false,
          createdAt: new Date(),
          series: [],
          isCalibrationFrames: true,

        }
      );
      // create an array of the filters for the seriess
      let filters = [];
      for( let i=0; i < this.props.flat.filtergroup.length; i++ ) {
        let filter = this.props.flat.filtergroup[i];
        let sid = Seriess.insert(
          {
            order: i,
            exposure: filter.exposure,
            binning: 1,
            frame: 'Flat',
            filter: filter.filter,
            repeat: filter.repeat,
            takeSeriesTemplate: this.props.flat._id,
          }
        );
        TakeSeriesTemplates.update({_id: tid}, {
          $push: { 'series': {id: sid} }
        });
      }

      // add the target
      let tsid = addNewTargetSession();
      // var target = TargetSessions.findOne({_id: tid });
      TargetSessions.update({ _id:tsid }, {
        $set: {
          isCalibrationFrames: true,
          description: "Flat series",
          name: this.props.flat._id,
          targetFindName: 'Flats',
          rotator_position:this.props.flat.rotatorPosition,
          series: {
            _id: tid,
            value: this.props.flat._id,
          },
        }
      });

      updateFlatSeries(
        this.props.flat._id,
        'target_id',
        tsid,
      );
    }

    // *******************************
    // TURND OFF
    else {
      resetStoredFlat(this.props.flat._id);
    }
};

  render() {
    //{this.props.flat.rotatorPosition}

    return (
      <Segment key={this.props.flat._id} raised>
        <Checkbox
          label='  '
          name='enabledActive'
          toggle
          checked={this.state.enabledActive}
          onChange={this.handleToggleOfCalibrationTargets.bind(this)}
        />
        <Button.Group basic size='mini' floated='right'>
          <Button icon='delete' onClick={this.deleteEntry.bind(this)}/>
        </Button.Group>
        <br/>RotatorGroup:
        <Dropdown
          selection
          name='rotatorPosition'
          options={renderDropDownAngles()}
          placeholder='Pick Rotator'
          value={this.state.rotatorPosition}
          onChange={this.handleChange}
        />
        <br/>
        <br/>
          <Grid columns={4} centered divided='vertically'>
            <Grid.Row centered textAlign='center'>
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
                    disableFlats={this.disableFlat}
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
