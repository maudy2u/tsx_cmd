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
import { TargetSessions } from '../api/targetSessions.js';
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
      // targetSessionId: nextProps.tsxInfo.find(function(element) {
      //   return element.name == 'imagingSessionId';
      // }).value,
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


  // addEntry() {
  //   console.log('In the TargetSessionMenu addEntry');
  //
  //   // get the id for the new object
  //   var newSession = TargetSessions.insert(
  //     {
  //       name: '',
  //       targetFindName: '',
  //       targetImage: '',
  //       description: '',
  //       enabledActive: false,
  //       series: {
  //       },
  //       progress: [
  //         //            {_id: seriesId, taken:0},
  //       ],
  //       report_d: '',
  //       ra: '',
  //       dec: '',
  //       angle: '',
  //       scale: '',
  //       coolingTemp: '',
  //
  //   /*
  //   *******************************
  //   #todo Need to work on the loading of the defaults properly
  //   */
  //       // coolingTemp: TheSkyXInfos.findOne({name: 'defaultCoolTemp'}),
  //       clsFilter: TheSkyXInfos.findOne({name: 'defaultFilter'}).value,
  //       focusFilter: TheSkyXInfos.findOne({name: 'defaultFilter'}).value,
  //       foccusSamples: '',
  //       focusBin: '',
  //       focusTarget: '',
  //       focusExposure: TheSkyXInfos.findOne({name: 'defaultFocusExposure'}).value,
  //       guideExposure: '',
  //       guideDelay: '',
  //       startTime: TheSkyXInfos.findOne({name: 'defaultStartTime'}).value,
  //       stopTime: TheSkyXInfos.findOne({name: 'defaultStopTime'}).value,
  //       priority: TheSkyXInfos.findOne({name: 'defaultPriority'}).value,
  //       tempChg: TheSkyXInfos.findOne({name: 'defaultFocusTempDiff'}).value,
  //       currentAlt: 0, // set to zero for now.
  //       minAlt: TheSkyXInfos.findOne({name: 'defaultMinAlt'}).value,
  //       completed: false,
  //       createdAt: new Date(),
  //       enableMeridianFlip: TheSkyXInfos.findOne({name: 'defaultMeridianFlip'}).value,
  //       // startTime: '',
  //       // stopTime: '',
  //
  //     }
  //   );
  //
  //   this.setState({newTarget:
  //     TargetSessions.findOne({_id: newSession })
  //   });
  //   this.setState({addModalOpen: true });
  //
  // }
  //
  renderTargets() {

    var list = {};
    if( typeof this.props.targets != 'undefined' ) {
      list = this.state.targetList;
    }

    return (
      this.props.targets.map( (target)=>{
        return <Target key={target._id} target={target} />
      })
    )
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


  render() {

    const { open } = this.state;

      return (
        <div>
          {/* <Segment>
            <Button.Group basic size='small'>
              <Button icon='linkify' onClick={this.loadTestDataMeteorMethod.bind(this)}/>
              <Button icon='settings' onClick={this.loadTestDataMeteorMethod.bind(this)}/>
              <Button icon='find' onClick={this.chkTestData.bind(this)}/>
            </Button.Group>
          </Segment> */}
          <Modal
            open={this.state.addModalOpen}
            onClose={this.handleAddModalClose}
            closeIcon>
            <Modal.Header>Add Session</Modal.Header>
            <Modal.Content>
              <Modal.Description>
                <TargetEditor key={this.state.newTarget._id} target={this.state.newTarget} />
              </Modal.Description>
            </Modal.Content>
          </Modal>
          <Segment>
          <Item.Group divided unstackable>
            {this.renderTargets(this.state.targetList)}
        </Item.Group>
      </Segment>
      </div>
    )
  }
}
export default withTracker(() => {
    return {
      targets: TargetSessions.find({}, { sort: { enabledActive: -1, targetFindName: 1, } }).fetch(),
  };
})(TargetSessionMenu);
