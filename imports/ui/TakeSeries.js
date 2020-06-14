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
  // Modal,
  Segment,
  // Item,
  Header,
  // Icon,
  // Table,
  Accordion,
  Label,
  Dimmer,
  Loader,
} from 'semantic-ui-react'

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
    activeIndex: 0,
  }

  handleClick = (e, titleProps) => {
     const { index } = titleProps
     const { activeIndex } = this.state
     const newIndex = activeIndex === index ? -1 : index

     this.setState({ activeIndex: newIndex })
  }

  editOpen = () => this.setState({ editOpen: true })
  editClose = () => this.setState({ editOpen: false })
  deleteFailedOpen = () => this.setState({ deleteFailed: true })
  deleteFailedClose = () => this.setState({ deleteFailed: false })

  deleteEntry() {
    // check if the series is used - if so cannot delete... list the Targets using it
    var sessions  = this.props.targetSessions;
    var foundTargets = [];
    var sid = this.props.seriesTemplate._id;
    for (var i = 0; i < sessions.length; i++) {
      var ses = sessions[i];
      if( ses.series._id === sid ) {
        foundTargets.push(sessions[i]);
      }
    }
    if( foundTargets.length>0 ) {
      var msg = 'Cannot delete. Used by: ';
      for( var  i=0; i<foundTargets.length; i++ ) {
        var t = foundTargets[i];
        msg = msg + '\n' + t.targetFindName;
      }
      alert(  msg );
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

  canHeaderClick( state, active ) {
    if( state == 'Stop' && active == false ) {
      return this.editEntry.bind(this);
    }
  }

  renderEditor() {
    return (
      <Segment>
        <TakeSeriesTemplateEditor
          key={this.props.seriesTemplate._id}
          template={this.props.seriesTemplate}
        />
      </Segment>
    )
  }

  render() {
    if( this.props.seriessReadyYet ) {

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

      const { activeIndex } = this.state

      return (
        <Accordion styled fluid>
          <Accordion.Title
            active={activeIndex === 1}
            index={1}
            onClick={this.handleClick}>
            <Header style={{color: 'black'}} as='a' onClick={this.canHeaderClick(this.props.scheduler_running.value, TOOL_ACTIVE)}>

              {this.props.seriesTemplate.name}<Label><small> {DESCRIPTION}</small></Label>
            </Header>
            <Button icon='delete'  size='mini'  floated='right' onClick={this.deleteEntry.bind(this)}/>
            </Accordion.Title>
            <Accordion.Content  active={activeIndex === 1} >
                  {/*
                    <Segment>
                      { this.seriesDetails() }
                    </Segment>
                    <Button.Group basic size='mini' floated='right'>
                    </Button.Group>
                    size='mini'  <Button icon='edit' onClick={this.editEntry.bind(this)}/>
                    <Button icon='copy' onClick={this.copyEntry.bind(this)}/>                */}
              { this.renderEditor() }
          </Accordion.Content>
        </Accordion>
      )
    }
    else {
      return(
        <Dimmer active>
           <Loader />
         </Dimmer>
       )
    }
  }
}

export default withTracker(() => {
  const seriessHandle = Meteor.subscribe('seriess.all');
  const seriessReadyYet = seriessHandle.ready();


  return {
    seriessReadyYet,
    seriess: Seriess.find({}, { sort: { order: 1 } }).fetch(10),
    takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(10),
    targetSessions: TargetSessions.find({}, { sort: { name: 1 } }).fetch(10),
  };
})(TakeSeries);
