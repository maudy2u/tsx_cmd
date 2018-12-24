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

import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Item, Dropdown, Menu, Confirm, Modal, Table, Segment, Button, Progress } from 'semantic-ui-react'

import { TakeSeriesTemplates} from '../api/takeSeriesTemplates.js';
import {
  TargetSessions,
  addNewTargetSession,
 } from '../api/targetSessions.js';
import { TheSkyXInfos } from '../api/theSkyXInfos.js';

import TargetEditor from './TargetEditor.js';
import Target  from './Target.js';

// ImageSession component - represents a single ImageSession
// export default
class TargetSessionMenu extends Component {

  state = {
    open: false ,
    addModalOpen: false,
    newTarget: {
      _id:'',
    },
    targetList: '',
  }

  handleAddModalOpen = () => this.setState({ addModalOpen: true })
  handleAddModalClose = () => this.setState({ addModalOpen: false })

// example of more than one state...
//  show = size => () => this.setState({ size, open: true })
  show = () => this.setState({ open: true })
  close = () => this.setState({ open: false })


  componentWillReceiveProps(nextProps) {

    // used to force a reload.... must be better way
    this.setState({
      targetList: nextProps.targets,
    });
  }


  //{this.testMeteorMethod.bind(this)}
  connectTsxMeteorMethod() {

    // on the client
    Meteor.call("loadTestDataTargetSessions", function (error) {
      // identify the error
      if (error && error.error === "logged-out") {
        // show a nice error message
        Session.set("errorMessage", "Please log in to post a comment.");
      }
    }.bind(this));
  }

  loadTestDataMeteorMethod() {

    // on the client
    Meteor.call("loadTestDataTargetSessions", function (error) {
      // identify the error
      if (error && error.error === "logged-out") {
        // show a nice error message
        Session.set("errorMessage", "Please log in to post a comment.");
      }
    }.bind(this));
  }

  chkTestData() {
    var target1 = this.state.targetList;
    console.log('test');
    // on the client
    Meteor.call("loadTestDataAllTakeSeriesTemplates", function (error) {
      // identify the error
      if (error && error.error === "logged-out") {
        // show a nice error message
        Session.set("errorMessage", "Please log in to post a comment.");
      }
    }.bind(this));
  }

  playScheduler() {
    Meteor.call("startScheduler", function (error, result) {
      this.forceUpdate();
      }.bind(this));
  }

  pauseScheduler() {
    Meteor.call("pauseScheduler", function (error, result) {
      }.bind(this));
  }

  stopScheduler() {
    // this.tsxStopSession();
    Meteor.call("stopScheduler", function (error, result) {
        // identify the error
        tsx_UpdateServerState(tsx_ServerStates.imagingSessionId, '' );
        tsx_UpdateServerState(tsx_ServerStates.targetImageName, '');
        tsx_UpdateServerState(tsx_ServerStates.targetDEC, '_');
        tsx_UpdateServerState(tsx_ServerStates.targetRA, '_');
        tsx_UpdateServerState(tsx_ServerStates.targetALT, '_');
        tsx_UpdateServerState(tsx_ServerStates.targetAZ, '_');
        tsx_UpdateServerState(tsx_ServerStates.targetHA, '_');
        tsx_UpdateServerState(tsx_ServerStates.targetTransit, '_');
//        tsx_UpdateServerState(tsx_ServerStates.currentStage, 'Stopped');

      }.bind(this));
  }

  renderTargets( container ) {
    // this.props.template.series.. this is a series ID
    // does not work:       this.props.template.series.map({sort: {order:1}}, (definedSeries)=>{
    return (
      this.props.targets.map((target)=>{
        return <Target key={target._id} target={target} />
      })
    )
  }

  targetButtons(
    state
    , active
    ) {

    var DISABLE = true;
    var NOT_DISABLE = false;
    // then use as needed disabled={DISABLE} or disabled={NOT_DISABLE}
    if( state == 'Stop'  && active == false ){
      DISABLE = false;
      NOT_DISABLE = true;
    }
/*
<Button.Group basic size='mini' floated='right'>
  <Button disabled={DISABLE} icon='recycle' />
  <Button disabled={DISABLE} icon='settings' />
</Button.Group>
 */
    return (
      <Button.Group>
          <Button disabled={DISABLE} icon='plus' onClick={this.addNewTargets.bind(this)} />
          <Button disabled compact   />
          <Button disabled={DISABLE}  >Refresh</Button>
          <Button disabled compact  />
          <Button disabled={DISABLE} icon='play'  onClick={this.playScheduler.bind(this)}/>
          <Button disabled={NOT_DISABLE} icon='stop' onClick={this.stopScheduler.bind(this)} />
       </Button.Group>
     )
  }

  addNewTargets() {
    // get the id for the new object
    var out = addNewTargetSession();
    // now popup the modal...
  };

  render() {
    const { open } = this.state;
    /* https://react.semantic-ui.com/modules/checkbox#checkbox-example-radio-group
    */
    var RUNNING = '';
    var ACTIVE = false;
    try {
      RUNNING = this.props.scheduler_running.value;
      ACTIVE = this.props.tool_active.value;
    } catch (e) {
      RUNNING = '';
      ACTIVE=false;
    }

    return (
      <div>
        <h1>Targets</h1>
        {this.targetButtons(
          RUNNING
          , ACTIVE
        )}
        <br />
        {this.props.targets.map((target)=>{
          return (
             <Target
              key={target._id}
              target={target}
              scheduler_running={this.props.scheduler_running}
              tool_active={this.props.tool_active}
            />
          )
        })}
      </div>
    )
  }
}
export default withTracker(() => {
    return {
  };
})(TargetSessionMenu);
