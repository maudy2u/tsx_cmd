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
//import ReactDOM from 'react-dom';
// import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';

import {
  Accordion,
  Header,
  Segment,
  Item,
  Label,
  Button,
  Modal,
  Icon,
  Table,
  Checkbox,
  Progress,
  Statistic,
} from 'semantic-ui-react'

import { TargetReports } from '../api/targetReports.js';
import { TargetSessions } from '../api/targetSessions.js';
import {
  TakeSeriesTemplates,
  seriesDescription,
} from '../api/takeSeriesTemplates.js';

import {
  updateTargetStateValue,
} from  '../api/serverStates.js';

import { TheSkyXInfos } from '../api/theSkyXInfos.js';

import TargetEditor from './TargetEditor.js';

function totalImages (target) {
  var series = target.takeSeries.series.takeSeries;
  // console.log('Number of series found: ' + series.takeSeries.length);
}

// export default
class Target extends Component {
  state = {
    modalOpen: false,
    enabledActive: false,
    activeIndex: 0,
  }

  handleOpen = () => this.setState({ modalOpen: true })
  handleClose = () => this.setState({ modalOpen: false })

  handleToggleEnabled = (e, { name, checked }) => {
    var val = eval( 'this.state.' + name);
    this.setState({
      [name]: !val
    });
    updateTargetStateValue( this.props.target._id, name, !val );
  };

  handleClick = (e, titleProps) => {
     const { index } = titleProps
     const { activeIndex } = this.state
     const newIndex = activeIndex === index ? -1 : index

     this.setState({ activeIndex: newIndex })
  }

  eraseProgress() {
    var progress = [];
    TargetSessions.update({_id:this.props.target._id},{
      $set:{ progress: progress }
    });
    this.forceUpdate();
  }

  deleteEntry() {
      TargetSessions.remove(this.props.target._id);
      this.forceUpdate();
  }

  editEntry() {
    // console.log('In the DefineTemplate editEntry');
    this.handleOpen();
    this.forceUpdate();
  }

  getTargetReport() {

    try {

      Meteor.call( 'getUpdateTargetReport', this.props.target._id , function(error, result) {

        if( typeof result != 'undefined') {
        }

      }.bind(this));
    } catch (e) {

    }
  }

  startImaging() {
    Meteor.call( 'startImaging', this.props.target._id, function(error, result) {
      console.log('Error: ' + error);
      console.log('result: ' + result);
    }.bind(this));
  }

  clsTarget() {
    var session = TheSkyXInfos.findOne({name: 'imagingSessionId'});

    // set the session to the curretn target
    TheSkyXInfos.update( {_id: session._id }, {
        $set: { value: this.props.target._id }
    });
    Meteor.call( 'centreTarget', this.props.target._id, function(error, result) {
      console.log('Error: ' + error);
      console.log('result: ' + result);
    }.bind(this));
  }

  startTakeSeries() {
    // get the session variable to store which target is Currently
    // being imaged
    var session = TheSkyXInfos.findOne({name: 'imagingSessionId'});

    // set the session to the curretn target
    TheSkyXInfos.update( {_id: session._id }, {
        $set: { value: this.props.target._id }
    });
    Meteor.call( 'startImaging', this.props.target._id, function(error, result) {
      console.log('Error: ' + error);
      console.log('result: ' + result);
    }.bind(this));
  }

  setActive() {
    var session = TheSkyXInfos.findOne({name: 'imagingSessionId'});

    // set the session to the curretn target
    TheSkyXInfos.update( {_id: session._id }, {
        $set: { value: this.props.target._id }
    });
    this.forceUpdate();
  }

  setInactive() {
    var session = TheSkyXInfos.findOne({name: 'imagingSessionId'});

    // set the session to the curretn target
    TheSkyXInfos.update( {_id: session._id }, {
        $set: { value: '' }
    });
    this.forceUpdate();
  }

  targetButtons( state, active ) {
    if( state == 'Stop' && active == false ) {
      return(
        <Button.Group basic size='mini' floated='right'>
          <Button icon='refresh' onClick={this.getTargetReport.bind(this)}/>
          <Button icon='location arrow' onClick={this.clsTarget.bind(this)}/>
          <Button icon='repeat' onClick={this.eraseProgress.bind(this)}/>
          {/* <Button icon='edit' onClick={this.editEntry.bind(this)}/> */}
          {/* <Button icon='copy' onClick={copyTarget.bind(this)}/> */}
          <Button icon='delete' onClick={this.deleteEntry.bind(this)}/>
        </Button.Group>
      )
    }
  }

  canHeaderClick( state, active ) {
    if( state === 'Stop' && active === false ) {
      return this.editEntry.bind(this);
    }
  }

  seriesDetails() {
    var tSeries = TakeSeriesTemplates.findOne({_id: this.props.target.series._id});
    if( typeof tSeries != 'undefined') {
      return seriesDescription(this.props.target.series._id);
    }
  }

  render() {
    // Use the image for a stretched image in the Future
    //       <Item.Image size='tiny' src='' />
    if( typeof this.props.target === 'undefined' ) {
      return (
        <div/>
      )
    }

    var ENABLEACTIVE = this.props.target.enabledActive;
    var TOOL_ACTIVE = this.props.tool_active.value;
    var SCHEDULER_RUNNING = this.props.scheduler_running.value;

    var MAXALT = Number(this.props.target.report.maxAlt).toFixed(2);
    var SERIES_DESCRIPTION = seriesDescription(this.props.target.series._id);
    var TARGET_NAME = this.props.target.getFriendlyName();

    const { activeIndex } = this.state

    return (
      <Accordion styled fluid>
        <Accordion.Title
          active={activeIndex === 1}
          index={1}
          onClick={this.handleClick.bind(this)}
           >
           <Checkbox
             label='  '
             name='enabledActive'
             toggle
             checked={ENABLEACTIVE}
             onClick={this.handleToggleEnabled.bind(this)}
             />
          <Header style={{color: 'black'}} as='a' onClick={this.canHeaderClick(SCHEDULER_RUNNING, TOOL_ACTIVE)}>
            {TARGET_NAME}
          </Header>
          <Label><small>{this.props.target.description}</small></Label>
          {this.targetButtons(SCHEDULER_RUNNING, TOOL_ACTIVE)}
        </Accordion.Title>
        <Accordion.Content  active={activeIndex === 1} >
          <Segment>
            <small>
              <Statistic size='mini'>
                <Statistic.Label>Priority</Statistic.Label>
                <Statistic.Value>{this.props.target.priority}</Statistic.Value>
              </Statistic>
              <Statistic size='mini'>
                <Statistic.Label>Start</Statistic.Label>
                <Statistic.Value>{this.props.target.startTime}</Statistic.Value>
              </Statistic>
              <Statistic size='mini'>
                <Statistic.Label>Stop</Statistic.Label>
                <Statistic.Value>{this.props.target.stopTime}</Statistic.Value>
              </Statistic>
              <Statistic size='mini'>
                <Statistic.Label>Min. Alt.</Statistic.Label>
                <Statistic.Value>{this.props.target.minAlt}</Statistic.Value>
              </Statistic>
              <Statistic size='mini'>
                <Statistic.Label>Max. Alt.</Statistic.Label>
                <Statistic.Value>{MAXALT}</Statistic.Value>
              </Statistic>
            </small>
            <br/><small><Label>{SERIES_DESCRIPTION}</Label></small>
          </Segment>
          <center>
          </center>
          <Modal
            open={this.state.modalOpen}
            onClose={this.handleClose}
            basic
            size='small'
            closeIcon>
            <Modal.Header>Editing Target {TARGET_NAME}</Modal.Header>
            <Modal.Content>
              <Modal.Description>
                <TargetEditor key={this.props.target._id} target={this.props.target} />
              </Modal.Description>
            </Modal.Content>
          </Modal>
          </Accordion.Content>
      </Accordion>
    )
  }
}

/*
*/

export default withTracker(() => {
    return {
      // report: TargetReports.find().fetch(),
  };

})(Target);
