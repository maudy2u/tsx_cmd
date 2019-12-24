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
} from 'semantic-ui-react'

import { TargetReports } from '../api/targetReports.js';
import { TargetSessions } from '../api/targetSessions.js';
import {
  TakeSeriesTemplates,
  seriesDescription,
} from '../api/takeSeriesTemplates.js';

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
    isCalibrationFrames: false,
    ra: '0',
    dec: '0',
    altitude: '0',
    azimuth: '0',
    currentAlt: '',
    HA: '',

    description: '',
    priority: 10,
    activeIndex: 0,
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

  handleClick = (e, titleProps) => {
     const { index } = titleProps
     const { activeIndex } = this.state
     const newIndex = activeIndex === index ? -1 : index

     this.setState({ activeIndex: newIndex })
  }

  componentWillMount() {
    // do not modify the state directly
  }

  componentDidMount() {

  }

  componentWillReceiveProps(nextProps) {
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

      Meteor.call( 'getUpdateTargetReport', this.props.target , function(error, result) {

        if( typeof result != 'undefined') {
          this.updateMonitor(result);
        }

      }.bind(this));
    } catch (e) {

    }
  }

  updateMonitor(report) {

    if( typeof report != 'undefined' && report != '') {
      this.setState({
        currentAlt: report.ALT,
      });
    }
  }

  copyEntry() {
    // console.log('In the DefineTemplate editEntry');

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

  targetButtons( state, active ) {
    if( state == 'Stop' && active == false ) {
      return(
        <Button.Group basic size='mini'>
          <Button icon='refresh' onClick={this.getTargetReport.bind(this)}/>
          <Button icon='location arrow' onClick={this.clsTarget.bind(this)}/>
          <Button icon='repeat' onClick={this.eraseProgress.bind(this)}/>
          {/* <Button icon='edit' onClick={this.editEntry.bind(this)}/> */}
          {/* <Button icon='copy' onClick={this.copyEntry.bind(this)}/> */}
          <Button icon='delete' onClick={this.deleteEntry.bind(this)}/>
        </Button.Group>
      )
    }
  }

  canHeaderClick( state, active ) {
    if( state == 'Stop' && active == false ) {
      return this.editEntry.bind(this);
    }
  }

  seriesDetails() {
    var tSeries = TakeSeriesTemplates.findOne({_id: this.props.target.series._id});
    if( typeof tSeries != 'undefined') {
      return seriesDescription(tSeries);
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

    let ENABLEACTIVE ='';
    let CALIBRATION = '';
    let TOOL_ACTIVE = false;
    let ALT = '';
    let HA = '';
    let TRANSIT = '';
    let RA = '';
    let DEC = '';
    let POINT = '';
    try {
      ENABLEACTIVE = this.props.target.enabledActive;
      CALIBRATION = this.props.target.isCalibrationFrames;
      TOOL_ACTIVE = this.props.tool_active.value;

      ALT = Number(this.props.report.ALT).toFixed(3);
      HA = Number(this.props.report.HA).toFixed(3);
      TRANSIT = Number(this.props.report.TRANSIT).toFixed(3);
      RA = Number(this.props.report.RA).toFixed(3);
      DEC = Number(this.props.report.DEC).toFixed(3);
      POINT = this.props.report.direction;
    } catch (e) {
      ENABLEACTIVE = this.state.enabledActive;
      CALIBRATION = this.state.isCalibrationFrames;
      TOOL_ACTIVE = false;

      ALT = '';
      HA = '';
      TRANSIT = '';
      RA = '';
      DEC = '';
      POINT = '';
    }

    let DTIME = '';
    try {
      let year = this.props.report.updatedAt.getFullYear();
      let mon = Number(this.props.report.updatedAt.getMonth())+1; // needed to pull out so not a string
      let MM = ('0'  + mon ).slice(-2); // 0-11, so plus 1
      let day = ('0'  + this.props.report.updatedAt.getDate()).slice(-2);
      let hours = ('0'  + this.props.report.updatedAt.getHours()).slice(-2);
      let minutes = ('0'  + this.props.report.updatedAt.getMinutes()).slice(-2);
      DTIME = hours + ':' + minutes + ', ' + year +'-'+MM+'-'+day;
    }
    catch( e ) {
    }
    finally {
      //
    }

    const { activeIndex } = this.state

    return (
      <Accordion styled fluid>
        <Accordion.Title
          active={activeIndex === 1}
          index={1}
          onClick={this.handleClick}>
          <Checkbox
            label='  '
            name='enabledActive'
            toggle
            checked={ENABLEACTIVE}
            onChange={this.handleToggleEnabled.bind(this)}
            />
          <Header style={{color: 'black'}} as='a' onClick={this.canHeaderClick(this.props.scheduler_running.value, TOOL_ACTIVE)}>
            {this.props.target.targetFindName} <small>{this.props.target.description}</small>
          </Header>
        </Accordion.Title>
        <Accordion.Content  active={activeIndex === 1} >
          <Segment>
            <small>Constraints:</small><br/>
            <Label>Images: <Label.Detail>{this.props.target.totalImagesTaken()}/{this.props.target.totalImagesPlanned()}</Label.Detail></Label>
            <Label>Priority: <Label.Detail>{this.props.target.priority}</Label.Detail></Label>
            <Label>Start: <Label.Detail>{this.props.target.startTime}</Label.Detail></Label>
            <Label>Stop: <Label.Detail>{this.props.target.stopTime}</Label.Detail></Label>
            <Label>Min. Alt.: <Label.Detail>{this.props.target.minAlt}</Label.Detail></Label>
            <br/><small>Last position: {DTIME}</small><br/>
            <Label>Alt.: <Label.Detail>{ALT}</Label.Detail></Label>
            <Label>HA: <Label.Detail>{HA}</Label.Detail></Label>
            <Label>Transit: <Label.Detail>{TRANSIT}</Label.Detail></Label>
            <Label>RA: <Label.Detail>{RA}</Label.Detail></Label>
            <Label>DEC: <Label.Detail>{DEC}</Label.Detail></Label>
            <Label>Point: <Label.Detail>{POINT}</Label.Detail></Label><br/>
            <small>{this.seriesDetails()}</small>
          </Segment>
          <center>
            {this.targetButtons(this.props.scheduler_running.value, TOOL_ACTIVE)}
          </center>
          <Modal
            open={this.state.modalOpen}
            onClose={this.handleClose}
            basic
            size='small'
            closeIcon>
            <Modal.Header>Editing Target {this.props.target.targetFindName}</Modal.Header>
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
