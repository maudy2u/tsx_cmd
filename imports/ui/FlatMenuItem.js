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
import { Segment, Checkbox, Button, Dropdown, Grid, Label, Input, Modal, Item, Header, Icon, Table, } from 'semantic-ui-react'
import {
  tsx_ServerStates,
  tsx_UpdateServerState,
  tsx_GetServerState,
} from  '../api/serverStates.js';

// Import the API Model
import { TakeSeriesTemplates} from '../api/takeSeriesTemplates.js';
import {
  TargetSessions,
  addNewTargetSession,
 } from '../api/targetSessions.js';
import { TargetReports } from '../api/targetReports.js';
import { TheSkyXInfos } from '../api/theSkyXInfos.js';
import {
  Seriess
} from '../api/seriess.js';
import {
  Filters,
  updateFlatExposure,
} from '../api/filters.js';
import {
  FlatSeries,
  addFlatFilter,
  updateFlatSeries,
  deleteAnyFlatTargets,
  resetStoredFlat,
  flatSeriesDescription,
  flatSeriesName,
} from '../api/flatSeries.js';
import FlatGrid from './FlatGrid.js';


export const subFrameTypes = [
  'Flat',
  'Dark',
  'Bias',
];

class FlatMenuItem extends Component {

  constructor(props) {
    super(props);

    this.state = {
      editOpen: false,
      frame: 'Flat',
      filter: '',
      exposure: 0,
      repeat: 1,
      enabledActive: false,
    }
    this.disableFlat = this.disableFlat.bind(this);
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
    resetStoredFlat(this.props.flat._id);
    this.props.disableFlats();
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
    resetStoredFlat(this.props.flat._id);
    this.props.disableFlats();
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

  disableFlat() {
    //this.state.enabledActive
    this.setState({
      enabledActive: false
    })
  }

  deleteEntry() {
    // check if the series is used - if so cannot delete... list the Targets using it
    deleteFlatFilter(this.props.flat._id, this.props.filter._id);
    resetStoredFlat(this.props.flat._id);
    this.props.disableFlats();
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
          enabledActive: true,
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
  }

  deleteEntry() {
    // check if the series is used - if so cannot delete... list the Targets using it
    resetStoredFlat(this.props.flat._id);
    FlatSeries.remove({_id: this.props.flat._id});
    this.disableFlat();
  }

  canHeaderClick( state, active ) {
    if( state == 'Stop' && active == false ) {
      return this.editEntry.bind(this);
    }
  }

  editEntry() {
    console.log('edit flat');
    this.editOpen();
    this.forceUpdate();
  }

  renderFlatEditor() {

    return (
      <Modal
        open={this.state.editOpen}
        onClose={this.editClose}
        basic
        size='small'
        closeIcon>
        <Modal.Header>Flats Editor Controls</Modal.Header>
        <Modal.Content>
          <FlatGrid
            tsxInfo = { this.props.tsxInfo }
            flat = { this.props.flat }
            scheduler_running={this.props.scheduler_running}
            tool_active = {this.props.tool_active}
          />
        </Modal.Content>
        <Modal.Description>
        </Modal.Description>
        <Modal.Actions>
        </Modal.Actions>
      </Modal>
    )
  }

  render() {
    let TOOL_ACTIVE = false;
    try {
      TOOL_ACTIVE = this.props.tool_active.value;
    } catch (e) {
      TOOL_ACTIVE = false;
    }
    return (
      <Segment key={this.props.flat._id} raised>
        <Checkbox
          label='  '
          name='enabledActive'
          toggle
          checked={this.props.flat.enabledActive}
          onChange={this.handleToggleOfCalibrationTargets.bind(this)}
        />
        <Header as='a' onClick={this.canHeaderClick(this.props.scheduler_running.value, TOOL_ACTIVE)}>
          {flatSeriesName( this.props.flat._id )}
          </Header>
        { ": " + flatSeriesDescription( this.props.flat._id )}
        { this.renderFlatEditor() }
        <Button.Group basic size='mini' floated='right'>
          <Button icon='delete' onClick={this.deleteEntry.bind(this)}/>
        </Button.Group>
      </Segment>
    )
  }
}

export default withTracker(() => {
    return {
  };
})(FlatMenuItem);
