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

import _ from 'lodash'
import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import {
  Item,
  Dropdown,
  Menu,
  Confirm,
  Modal,
  Table,
  Segment,
  Button,
  Progress,
  Search,
} from 'semantic-ui-react'

import { TakeSeriesTemplates} from '../api/takeSeriesTemplates.js';
import {
  TargetSessions,
  addNewTargetSession,
 } from '../api/targetSessions.js';
import { TheSkyXInfos } from '../api/theSkyXInfos.js';

import TargetEditor from './TargetEditor.js';
import Target  from './Target.js';

const XRegExp = require('xregexp');
const XRegExpPositiveReal = XRegExp('^[0-9]\\.?[0-9]+|[1-9][0-9]\\.?[0-9]+$');
const XRegExpPosNum = XRegExp('^0$|(^([1-9]\\d*(\\.\\d+)?)$)|(^0?\\.\\d*[1-9]\\d*)$');
const XRegExpNonZeroPosInt = XRegExp('^([1-9]\\d*)$');
const XRegExpZeroOrPosInt = XRegExp('^(\\d|[1-9]\\d*)$');
const XRegExpZeroToNine = XRegExp('^\\d$');
const XRegExpZeroToTwenty = XRegExp('^([0-9]|[1-9][0-9]|20)$');
const XRegExp24hr = XRegExp('^([0-9]:[0-5][0-9]|[1-2][0-9]:[0-5][0-9])$');

// ImageSession component - represents a single ImageSession
// export default

const initialState = { isLoading: false, results: [], value: '' }

class TargetSessionMenu extends Component {

  state = {
    initialState,
    open: false ,
    addModalOpen: false,
    // newTarget: {
    //   _id:'',
    // },
    // targetList: '',
//    matchName: '',
  }

  handleResultSelect = (e, { result }) => {
    this.setState({ value: result.title })
  }
  handleSearchChange = (e, { value }) => {
    this.setState({ isLoading: true, value })

    setTimeout(() => {
      if (this.state.value.length < 1) return this.setState(initialState)

      const re = new RegExp(_.escapeRegExp(this.state.value), 'i')
      const isMatch = (result) => re.test(result.title + ' ' +result.description)

      this.setState({
        isLoading: false,
        results: _.filter(this.source(), isMatch),
      })
    }, 300)
  }

  source() {
      const source = []
      var objs = TargetSessions.find({}).fetch();
      if( typeof objs == "undefined") {
        return source; // do not try to process
      }
      for( var i=0; i<objs.length; i++ ) {
        var title = '';
        var desc = '';
        if( objs[i].friendlyName !='' && typeof objs[i].friendlyName != 'undefined' ) {
          title = objs[i].friendlyName;
          desc = objs[i].description + ' ('+objs[i].targetFindName+ ')';
        }
        else {
          title = objs[i].targetFindName;
          desc = objs[i].description;
        }
        source.push({
          id: objs[i]._id,
          title: title,
          description: desc,
        })
      }
      return source;
  }

  handleAddModalOpen = () => this.setState({ addModalOpen: true })
  handleAddModalClose = () => this.setState({ addModalOpen: false })

// example of more than one state...
//  show = size => () => this.setState({ size, open: true })
  show = () => this.setState({ open: true })
  close = () => this.setState({ open: false })


  componentWillReceiveProps(nextProps) {

    // // used to force a reload.... must be better way
    // this.setState({
    //   targetList: nextProps.targets,
    // });
  }

  playScheduler() {
    Meteor.call("startScheduler", function (error, result) {
      // this.forceUpdate();
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

  refreshTargetReports() {
    Meteor.call("refreshTargetReports", function (error, result) {
      }.bind(this));
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

    return (
      <Button.Group>
          <Button disabled={DISABLE} icon='plus' onClick={addNewTargetSession.bind(this)} />
          <Button disabled compact   />
          <Button disabled={DISABLE} onClick={this.refreshTargetReports.bind(this)} >Refresh</Button>
          <Button disabled compact  />
          <Button disabled={DISABLE} icon='play'  onClick={this.playScheduler.bind(this)}/>
          <Button disabled={NOT_DISABLE} icon='stop' onClick={this.stopScheduler.bind(this)} />
       </Button.Group>
     )
  }

  // addNewTargets() {
  //   // get the id for the new object
  //   var out = addNewTargetSession();
  //   // now popup the modal...
  // };

  render() {
    const { open } = this.state;
    const { isLoading, value, results } = this.state;
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
    // this.props.targets.map((target)=>{
    //     var nam;
    //     if( this.state.initialState.results.length > 0 ) {
    //       nam = results
    //     }
    //     // this
    //     if( typeof nam != 'undefined') {
    //       var found = RegExp.exec(target.targetFindName, name);
    //     }
    // });
    return (
      <div>
        <h1>Targets</h1>
        <Table style={{background: 'black'}}>
          <Table.Body>
          <Table.Row>
            <Table.Cell>
              {this.targetButtons(
                RUNNING
                , ACTIVE
              )}
            </Table.Cell>
            <Table.Cell>
              <Search
                loading={isLoading}
                onResultSelect={this.handleResultSelect}
                onSearchChange={_.debounce(this.handleSearchChange, 500, {
                  leading: true,
                })}
                results={results}
                value={value}
                //{...this.props} // This causes a warning...
              />
            </Table.Cell>
          </Table.Row>
          </Table.Body>
        </Table>
        <br />
        {this.props.targets.map((target)=>{
          let report = this.props.target_reports.find(function(element) {
            return element.target_id == target._id;});

          if( typeof this.state.value != 'undefined' && this.state.value != '' ){
            if(
              target.targetFindName.indexOf(this.state.value) == -1 &&
              target.description.indexOf(this.state.value) == -1 &&
              target.friendlyName.indexOf(this.state.value) == -1
            ) {
              // searching and not a match so filter out
              return
            }
          }
          return (
             <Target
              key={target._id}
              target={target}
              report={report}
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
