import React, { Component } from 'react'
import ReactDOM from 'react-dom';
// import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';

import { Item, Label, Button, Modal, Header, Icon, Table, Checkbox, Progress } from 'semantic-ui-react'

import { TargetReports } from '../api/targetReports.js';
import { TargetSessions } from '../api/targetSessions.js';
import { TakeSeriesTemplates} from '../api/takeSeriesTemplates.js';
import { Seriess } from '../api/seriess.js';
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
    checked: false ,
    ra: '0',
    dec: '0',
    altitude: '0',
    azimuth: '0',
    description: '',
    priority: 10,
  }

  handleOpen = () => this.setState({ modalOpen: true })
  handleClose = () => this.setState({ modalOpen: false })

  onChangeChecked() {
    // this.setState({checked: !this.props.target.enabledActive});
    TargetSessions.update({_id: this.props.target._id}, {
      $set: { enabledActive: !this.props.target.enabledActive },
    })
    this.props.target.enabledActive = !this.props.target.enabledActive;
  }

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

  }

  deleteEntry() {
      TargetSessions.remove(this.props.target._id);
  }

  editEntry() {
    console.log('In the DefineTemplate editEntry');
    this.handleOpen();
  }

  getTargetReport() {
    var done = false;

    try {
//      Meteor.call( 'targetFind', this.props.target.targetFindName , function(error, result) {
      Meteor.call( 'getTargetReport', this.props.target , function(error, result) {

          // if success then TheSkyX has made this point the target...
          // now get the coordinates
          /*
          angle: '',
          scale: '',
          isValid: isValid,
          AZ: az,
          ALT: alt,
          RA:  ra,
          DEC: dec,
          HA: ha,
          TRANSIT: transit,
          isDark: isDark,
          sunAltitude: sunAlt,
          updatedAt: update,
          */
//          var report = TargetReports.findOne({_id: this.props.target.report_id });
/*
          if( typeof result != 'undefined') {
            this.setState({altitude: result.ALT});
            this.setState({ra: result.RA});
            this.setState({dec: result.DEC});
            this.setState({azimuth: result.AZ});

            this.forceUpdate();
          }
          */
          var nextProps;
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
        guideExposure: orgTarget.guideExposure,
        guideDelay: orgTarget.guideDelay,
        startTime: orgTarget.startTime,
        stopTime: orgTarget.stopTime,
        priority: orgTarget.priority,
        tempChg: orgTarget.tempChg,
        currentAlt: orgTarget.currentAlt,
        minAlt: orgTarget.minAlt,
        completed: orgTarget.completed,
        createdAt: orgTarget.createdAt,
      }
    )
    // do not copy series progress
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
            <Button.Group basic size='small'  floated='right'>
              <Button icon='location arrow' onClick={this.clsTarget.bind(this)}/>
              <Button icon='toggle on' onClick={this.setInactive.bind(this)}/>
            </Button.Group>
          )
        }
        else {
          return (
            <Button.Group basic size='small'  floated='right'>
              <Button icon='location arrow' onClick={this.clsTarget.bind(this)}/>
              <Button icon='toggle off' onClick={this.setActive.bind(this)}/>
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

    return (
    <Item>
      <Item.Content>
        <Checkbox
          label='  '
          toggle
          checked={this.props.target.enabledActive}
          onChange={this.onChangeChecked}
        />
        <Item.Header as='a' onClick={this.editEntry.bind(this)}>
          {this.props.target.targetFindName}
        </Item.Header>
        <Button.Group basic size='small' floated='right'>
          <Button icon='refresh' onClick={this.getTargetReport.bind(this)}/>
          <Button icon='edit' onClick={this.editEntry.bind(this)}/>
          <Button icon='copy' onClick={this.copyEntry.bind(this)}/>
          <Button icon='delete' onClick={this.deleteEntry.bind(this)}/>
          <Button icon='retweet' onClick={this.eraseProgress.bind(this)}/>
        </Button.Group>
        {this.renderTargeting()}
        <Item.Description>
          {this.props.target.description}
        </Item.Description>
        <Item.Meta>
          <Progress value={this.props.target.totalImagesTaken()} total={this.props.target.totalImagesPlanned()} progress='ratio'>Images Taken</Progress>
        </Item.Meta>
        <Item.Extra>
          <Label>Priority: <Label.Detail>{this.props.target.priority}</Label.Detail></Label>
          <Label>Start time: <Label.Detail>{this.props.target.startTime}</Label.Detail></Label>
          <Label>Stop time: <Label.Detail>{this.props.target.stopTime}</Label.Detail></Label>
          <Label>Altitude: <Label.Detail>{this.state.altitude}</Label.Detail></Label>
          <Label>Direction: <Label.Detail>{this.state.azimuth}</Label.Detail></Label>
          <Modal
            open={this.state.modalOpen}
            onClose={this.handleClose}
            closeIcon>
            <Modal.Header>Edit Series</Modal.Header>
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
      targets2: TargetSessions.find({}, { sort: { name: 1 } }).fetch(),
      report: TargetReports.find().fetch(),
  };

})(Target);
