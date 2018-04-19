import React, { Component } from 'react'
import ReactDOM from 'react-dom';
// import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';

import { Item, Label, Button, Modal, Header, Icon, Table, Checkbox, Progress } from 'semantic-ui-react'

import { TargetSessions } from '../api/targetSessions.js';
import { TakeSeriesTemplates} from '../api/takeSeriesTemplates.js';
import { Seriess } from '../api/seriess.js';

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

    this.getCurrentCoordinates();

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

  getCurrentCoordinates() {
    var done = false;

    Meteor.call( 'targetFind', this.props.target.targetFindName , function(error, result) {
      // identify the error
      console.log('Error: ' + error);
      console.log('result: ' + result);
      for (var i = 0; i < result.split('|').length; i++) {
        var txt = result.split('|')[i].trim();
        console.log('Found: ' + txt);
      }
      if (error && error.error === "logged-out") {
        // show a nice error message
        Session.set("errorMessage", "Please log in to post a comment.");
      }
      else {
        // if success then TheSkyX has made this point the target...
        // now get the coordinates
        cmdSuccess = true;
        var altitude = result.split('|')[3].trim();
        this.setState({altitude: altitude});
        var ra = result.split('|')[1].trim();
        var dec = result.split('|')[2].trim();
        this.setState({ra: ra});
        this.setState({dec: dec});
        var azimuth = result.split('|')[4].trim();
        if (azimuth < 179)
        //
        // Simplify the azimuth value to simple east/west
        //
        {
          this.setState({azimuth: "East"});
        } else {
          this.setState({azimuth: "West"});
        }
      }
    }.bind(this));

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
        description: orgTarget.description,
        enabledActive: false,
        series: {
          _id: orgTarget.series._id,
          value: orgTarget.series.text,
        },
        progress: [
//            {_id: seriesId, taken:0},
        ],
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

  render() {
// Use the image for a stretched image in the Future
//       <Item.Image size='tiny' src='' />

    return (
    <Item>
      <Item.Content>
        <Item.Header as='a'>
          <Checkbox
            label='  '
            toggle
            checked={this.props.target.enabledActive}
            onChange={this.onChangeChecked.bind(this)}
          />
          {this.props.target.name}
        </Item.Header>
        <Item.Meta>
          {this.props.target.description}
        </Item.Meta>
        <Item.Description>
          <Label>Priority: <Label.Detail>{this.props.target.priority}</Label.Detail></Label>
          <Label>Start time: <Label.Detail>{this.props.target.startTime}</Label.Detail></Label>
          <Label>Stop time: <Label.Detail>{this.props.target.stopTime}</Label.Detail></Label>
          <Label>Altitude: <Label.Detail>{this.state.altitude}</Label.Detail></Label>
          <Label>Direction: <Label.Detail>{this.state.azimuth}</Label.Detail></Label>
          <Progress value={this.props.target.totalImagesTaken()} total={this.props.target.totalImagesPlanned()} progress='ratio'>Images Taken</Progress>
        </Item.Description>
        <Item.Extra>
          <Button.Group basic size='small'>
            <Button icon='edit' onClick={this.editEntry.bind(this)}/>
            <Button icon='copy' onClick={this.copyEntry.bind(this)}/>
            <Button icon='delete' onClick={this.deleteEntry.bind(this)}/>
            <Button icon='retweet' onClick={this.eraseProgress.bind(this)}/>
          </Button.Group>
          <Button icon='play' onClick={this.startImaging.bind(this)}/>
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
  };

})(Target);
