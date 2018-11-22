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
import ReactDOM from 'react-dom';
// import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';

import { Item, Label, Button, Modal, Header, Icon, Table, Checkbox, Progress } from 'semantic-ui-react'

import { TargetReports } from '../api/targetReports.js';
import { TargetSessions } from '../api/targetSessions.js';
import { TakeSeriesTemplates} from '../api/takeSeriesTemplates.js';
import { TheSkyXInfos } from '../api/theSkyXInfos.js';

import TargetEditor from './TargetEditor.js';

function totalImages (target) {
  var series = target.takeSeries.series.takeSeries;
  console.log('Number of series found: ' + series.takeSeries.length);
}

// export default
class Target extends Component {
  state = {
    modalOpen: false,
    enabledActive: false,
    isCalibrationFrames: false,
    ra: '0',
    dec: '0',
    altitude: '0',
    azimuth: '0',
    description: '',
    priority: 10,
  }

  handleOpen = () => this.setState({ modalOpen: true })
  handleClose = () => this.setState({ modalOpen: false })

  handleToggleEnabled = (e, { name, checked }) => {
    this.setState({
      [name]: checked
    });
    if( name == 'enabledActive') {
      TargetSessions.update({_id:this.props.target._id}, {
        $set:{ enabledActive: checked }
      });
    }
    if( name == 'isCalibrationFrames') {
      TargetSessions.update({_id:this.props.target._id}, {
        $set:{ isCalibrationFrames: checked }
      });
    }
    this.forceUpdate();
  };

  componentWillMount() {
    // do not modify the state directly
  }

  componentDidMount() {

  }

  componentWillReceiveProps(nextProps) {
    this.updateMonitor(nextProps);
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
    console.log('In the DefineTemplate editEntry');
    this.handleOpen();
    this.forceUpdate();

  }

  getTargetReport() {

    try {

      Meteor.call( 'getTargetReport', this.props.target , function(error, result) {

          var nextProps; // send in dummy var
          this.updateMonitor(nextProps);

      }.bind(this));
    } catch (e) {

    }
  }

  updateMonitor(nextProps) {

    var prop;
    try {
      prop = nextProps.target;
    } catch (e) {
      prop = this.props.target;
    }

    // reports
    var report = TargetReports.findOne( {
      target_id: prop._id,
    });

    // it is possible for a new target to not have a report
    if( typeof report == 'undefined' ) {
      return ;
    }
    this.setState({
      ra: report.RA,
      dec: report.DEC,
      altitude: report.ALT,
      azimuth: report.AZ,
    });
  }

  copyEntry() {
    console.log('In the DefineTemplate editEntry');

    orgTarget = this.props.target;

    // get the id for the new object
    const id = TargetSessions.insert(
      {
        name: orgTarget.name + ' Duplicated',
        targetFindName: orgTarget.targetFindName,
        targetImage: orgTarget.targetImage,
        description: 'DUPLICATED: ' + orgTarget.description,
        enabledActive: false,
        isCalibrationFrames: orgTarget.isCalibrationFrames,
        series: {
          _id: orgTarget.series._id,
          value: orgTarget.series.text,
        },
        progress: [
//            {_id: seriesId, taken:0},
        ],
        report_d: orgTarget.report_id,
        ra: orgTarget.ra,
        dec: orgTarget.dec,
        angle: orgTarget.angle,
        scale: orgTarget.scale,
        coolingTemp: orgTarget.coolingTemp,
        clsFliter: orgTarget.clsFliter,
        focusFliter: orgTarget.focusFliter,
        foccusSamples: orgTarget.foccusSamples,
        focusBin: orgTarget.focusBin,
        focusTarget: orgTarget.focusTarget,
        focusExposure: Number(this.props.target.focusExposure),
        guideExposure: orgTarget.guideExposure,
        guideDelay: orgTarget.guideDelay,
        startTime: orgTarget.startTime,
        stopTime: orgTarget.stopTime,
        priority: orgTarget.priority,
        tempChg: orgTarget.tempChg,
        currentAlt: orgTarget.currentAlt,
        minAlt: orgTarget.minAlt,
        report: '',

        completed: orgTarget.completed,
        createdAt: orgTarget.createdAt,
      }
    )
    // do not copy series progress
    this.forceUpdate();

  }

  startImaging() {
    Meteor.call( 'startImaging', this.props.target, function(error, result) {
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
    Meteor.call( 'centreTarget', this.props.target, function(error, result) {
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
    Meteor.call( 'startImaging', this.props.target, function(error, result) {
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

  renderTargeting() {
    var session = TheSkyXInfos.findOne({name: 'imagingSessionId'});
    var tid = session.value;
    try {
      if( this.props.target.enabledActive == true ) {
        if( tid == this.props.target._id ) {
          return (
            <Button.Group basic size='mini'  floated='right'>
              {/* <Button icon='toggle on' onClick={this.setInactive.bind(this)}/> */}
            </Button.Group>
          )
        }
        else {
          return (
            <Button.Group basic size='mini'  floated='right'>
              {/* <Button icon='toggle off' onClick={this.setActive.bind(this)}/> */}
            </Button.Group>
          )
        }
      }
    } catch (e) {
      return (
        <div/>
      )
    }
  }

  render() {
// Use the image for a stretched image in the Future
//       <Item.Image size='tiny' src='' />
    if( typeof this.props.target == 'undefined' ) {
      return (
        <div/>
      )
    }

    var ENABLEACTIVE ='';
    var CALIBRATION = '';
    try {
      ENABLEACTIVE = this.props.target.enabledActive;
      CALIBRATION = this.props.target.isCalibrationFrames;
    } catch (e) {
      ENABLEACTIVE = this.state.enabledActive;
      CALIBRATION = this.state.isCalibrationFrames;
    }

    return (
    <Item>
      <Item.Content>
      <Checkbox
        label='  '
        name='enabledActive'
        toggle
        checked={ENABLEACTIVE}
        onChange={this.handleToggleEnabled.bind(this)}
        /> 
      <Item.Header as='a' onClick={this.editEntry.bind(this)}>
        {this.props.target.targetFindName}
        </Item.Header>
        <Item.Description>
          {this.props.target.description}
        </Item.Description>
        <Item.Meta>
        <Label>Images Taken: <Label.Detail>{this.props.target.totalImagesTaken()}/{this.props.target.totalImagesPlanned()}</Label.Detail></Label>
        <Label>Priority: <Label.Detail>{this.props.target.priority}</Label.Detail></Label>
        <Label>Start time: <Label.Detail>{this.props.target.startTime}</Label.Detail></Label>
        <Label>Stop time: <Label.Detail>{this.props.target.stopTime}</Label.Detail></Label>
        <Label>Min. Altitude: <Label.Detail>{this.props.target.minAlt}</Label.Detail></Label>
        </Item.Meta>
        <Item.Extra>
          {this.renderTargeting()}
          <Label.Group>
            {/*
            <Label>Direction: <Label.Detail>{this.state.azimuth}</Label.Detail></Label> */}
          </Label.Group>
          <Button.Group basic size='mini'>
            <Button icon='refresh' onClick={this.getTargetReport.bind(this)}/>
            <Button icon='location arrow' onClick={this.clsTarget.bind(this)}/>
            <Button icon='retweet' onClick={this.eraseProgress.bind(this)}/>
            {/* <Button icon='edit' onClick={this.editEntry.bind(this)}/> */}
            <Button icon='copy' onClick={this.copyEntry.bind(this)}/>
            <Button icon='delete' onClick={this.deleteEntry.bind(this)}/>
          </Button.Group>
          <Checkbox
            label=' Calibration Target'
            name='isCalibrationFrames'
            toggle
            checked={CALIBRATION}
            onChange={this.handleToggleEnabled.bind(this)}
          />
          <Modal
            open={this.state.modalOpen}
            onClose={this.handleClose}
            closeIcon>
            <Modal.Header>Editing Target {this.props.target.targetFindName}</Modal.Header>
            <Modal.Content>
              <Modal.Description>
                <TargetEditor key={this.props.target._id} target={this.props.target} />
              </Modal.Description>
            </Modal.Content>
          </Modal>
        </Item.Extra>
      </Item.Content>
    </Item>
    )
  }
}

export default withTracker(() => {
    return {
      // report: TargetReports.find().fetch(),
  };

})(Target);
