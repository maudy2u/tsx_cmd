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
import { Button, Modal, Segment, Item, Header, Icon, Table, } from 'semantic-ui-react'

import {
  TakeSeriesTemplates,
  seriesDescription,
} from '../api/takeSeriesTemplates.js';
import { TargetSessions } from '../api/targetSessions.js';
import { Seriess } from '../api/seriess.js';

import TakeSeriesTemplateEditor from './TakeSeriesTemplateEditor.js';

class TakeSeries extends Component {

  state = {
    editOpen: false,
    deleteFailed: false,
    targetsPreventingDelete: [],
  }

  editOpen = () => this.setState({ editOpen: true })
  editClose = () => this.setState({ editOpen: false })
  deleteFailedOpen = () => this.setState({ deleteFailed: true })
  deleteFailedClose = () => this.setState({ deleteFailed: false })

  deleteEntry() {
    // check if the series is used - if so cannot delete... list the Targets using it
    var sessions  = this.props.targetSessions;
    var targets = [];
    for (var i = 0; i < sessions.length; i++) {
      if( sessions[i].series._id == this.props.seriesTemplate._id) {
        targets.push(sessions[i]);
      }
    }
    if( targets.length>0 ) {
      this.setState({ targetsPreventingDelete: targets });
      this.deleteFailedOpen();
    }
    else {
      for( var i=0; i<this.props.seriesTemplate.series.length; i++ ) {
        var sid = this.props.seriesTemplate.series[i].id;
        Seriess.remove( sid );
      }
      TakeSeriesTemplates.remove(this.props.seriesTemplate._id);
    }
  }

  editEntry() {
    console.log('In the DefineTemplate editEntry');
    // #TODO prevent editing the series if it is in use by scheduler
    this.editOpen();
  }

  copyEntry() {
    console.log('In the DefineTemplate copyEntry');

    orgSeries = this.props.seriesTemplate;

    // get the id for the new object
    const id = TakeSeriesTemplates.insert(
      {
        name: orgSeries.name + ' Duplicated',
        description: orgSeries.description,
        processSeries: orgSeries.processSeries,
        repeatSeries: orgSeries.repeatSeries,
        createdAt: new Date(),
        series: [],
      }
    )

    var series = orgSeries.series;
    for (var i = 0; i < series.length; i++) {
      seriesMap = series[i];
      TakeSeriesTemplates.update({_id: id}, {
        $push: { 'series': seriesMap },
      });
    }
  }

  seriesDetails() {

    return seriesDescription( this.props.seriesTemplate );
  }

  canHeaderClick( state, active ) {
    if( state == 'Stop' && active == false ) {
      return this.editEntry.bind(this);
    }
  }

  render() {
    let DESCRIPTION = '';
    if( this.props.seriesTemplate.description != '') {
      DESCRIPTION = this.props.seriesTemplate.description;
    }
    let ENABLEACTIVE ='';
    let TOOL_ACTIVE = false;
    try {
      ENABLEACTIVE = this.props.target.enabledActive;
      TOOL_ACTIVE = this.props.tool_active.value;
    } catch (e) {
      ENABLEACTIVE = this.state.enabledActive;
      TOOL_ACTIVE = false;
    }
    return (
      <Segment raised>
        <Item>
          <Item.Content>
            <Item.Header as='a' onClick={this.canHeaderClick(this.props.scheduler_running.value, TOOL_ACTIVE)}>
              {this.props.seriesTemplate.name}
            </Item.Header>
            <Button.Group basic size='mini' floated='right'>
              {/* <Button icon='edit' onClick={this.editEntry.bind(this)}/> */}
              {/* <Button icon='copy' onClick={this.copyEntry.bind(this)}/> */}
              <Button icon='delete' onClick={this.deleteEntry.bind(this)}/>
            </Button.Group>
            <Item.Description>
            {DESCRIPTION}
            </Item.Description>
            <Item.Meta>
            </Item.Meta>
            <Item.Extra>
              {this.seriesDetails()}
              {/* *******************************
                Used to handle the Editing deleting of a series
                */}
              <Modal
                open={this.state.editOpen}
                onClose={this.editClose}
                closeIcon>
                <Modal.Header>Editing Imaging Series</Modal.Header>
                <Modal.Content>
                  <Modal.Description>
                    <TakeSeriesTemplateEditor key={this.props.seriesTemplate._id} template={this.props.seriesTemplate}/>
                  </Modal.Description>
                </Modal.Content>
              </Modal>
            </Item.Extra>
          </Item.Content>
        </Item>
      </Segment>
    )
  }

}

export default withTracker(() => {
    return {
      seriess: Seriess.find({}, { sort: { order: 1 } }).fetch(),
      takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
      targetSessions: TargetSessions.find({}, { sort: { name: 1 } }).fetch(),
  };
})(TakeSeries);
