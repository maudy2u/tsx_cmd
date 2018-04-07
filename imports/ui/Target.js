import React, { Component } from 'react'
import ReactDOM from 'react-dom';
// import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';

import { Item, Button, Modal, Header, Icon, Table, Checkbox, Progress } from 'semantic-ui-react'

import { calcTargetProgress } from '../api/sessionTools.js';

import { TargetSessions } from '../api/targetSessions.js';
import { TakeSeriesTemplates} from '../api/takeSeriesTemplates.js';
import { Seriess } from '../api/seriess.js';

import TargetEditor from './TargetEditor.js';

function totalImages (target) {
  var series = target.takeSeries.series.takeSeries;
  console.log('Number of series found: ' + series.takeSeries.length);
}

// export default
class TargetSession extends Component {
  state = {
    modalOpen: false,
    checked: false ,
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

  deleteEntry() {
      TargetSessions.remove(this.props.target._id);
  }

  editEntry() {
    console.log('In the DefineTemplate editEntry');
    this.handleOpen();
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
          text: orgTarget.series.text,
        },
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
        minAlt: orgTarget.minAlt,
        completed: orgTarget.completed,
        createdAt: orgTarget.createdAt,
      }
    )
  }

  render() {
// Use the image for a stretched image in the Future
//       <Item.Image size='tiny' src='' />

    return (
    <Item>
      <Item.Content>
        <Item.Header as='a'>
          {this.props.target.name}
        </Item.Header>
        <Item.Meta>
          <Checkbox
            toggle
            checked={this.props.target.enabledActive}
            onChange={this.onChangeChecked.bind(this)}
          />
          {this.props.target.description}
        </Item.Meta>
        <Item.Description>
          <Progress percent={calcTargetProgress(this.props.target._id)} progress />
        </Item.Description>
        <Item.Extra>
          <Button.Group basic size='small'>
            <Button icon='edit' onClick={this.editEntry.bind(this)}/>
            <Button icon='copy' onClick={this.copyEntry.bind(this)}/>
            <Button icon='delete' onClick={this.deleteEntry.bind(this)}/>
          </Button.Group>
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
})(TargetSession);
