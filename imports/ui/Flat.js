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
import { Button, Dropdown, Input, Modal, Item, Header, Icon, Table, } from 'semantic-ui-react'
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
  subFrameTypes,
} from '../api/filters.js';
import {
  FlatSeries,
  addFlatSeries,
 } from '../api/flatSeries.js';

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
  };

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
    }

  render() {
    return (
      <div>

        Filter: {this.props.filter._id}>
        frame: <Dropdown
          fluid
          name='frame'
          options={this.renderDropDownFrames()}
          placeholder='Frame'
          text={this.state.frame}
          onChange={this.handleChange}
        />
        filter: {this.props.filter.filter}<br/>
        Exposure: <Input
          fluid
          placeholder='Exposure'
          name='exposure'
          value={this.props.filter.exposure}
          onChange={this.handleChange}
        />
        {}<br/>
        repeat: {this.props.filter.repeat}<br/>
        <Button.Group basic size='mini' floated='right'>
          <Button icon='delete' onClick={this.deleteEntry.bind(this)}/>
        </Button.Group>
    </div>
    )
  }

}

export default withTracker(() => {
    return {
  };
})(Flat);
