import React, { Component } from 'react'
import ReactDOM from 'react-dom';

import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';
import { Button, Modal, Header, Icon, Table, Checkbox, Progress } from 'semantic-ui-react'

import { TargetSessions } from '../api/targetSessions.js';

import TargetEditor from './TargetEditor.js';

function totalImages (target) {
  var series = target.takeSeries.series.takeSeries;
  console.log('Number of series found: ' + series.takeSeries.length);
}

// export default
class TargetSession extends Component {
  state = { modalOpen: false, checked: false }
  handleOpen = () => this.setState({ modalOpen: true })
  handleClose = () => this.setState({ modalOpen: false })

  onChangeChecked() {
    this.setState({checked: !this.props.target.enabledActive});
    TargetSessions.update({_id: this.props.target._id}, {
      $set: { enabledActive: !this.props.target.enabledActive },
    })
    this.props.target.enabledActive = !this.props.target.enabledActive;
  }

  componentWillMount() {
    // do not modify the state directly
    this.setState({checked: this.props.target.enabledActive});
  }

  calcTargetProgress() {
      var totalPlannedImages = 0;
      var totalTakenImages = 0;
      var series = this.props.target.takeSeries.series;
      for (var i = 0; i < series.length; i++) {
        totalTakenImages += series[i].taken;
        totalPlannedImages += series[i].repeat;
      }

      return totalTakenImages/totalPlannedImages;
  };

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
        takeSeries: {
          name: orgTarget.takeSeries.name,
          description: orgTarget.takeSeries.description,
          processSeries: orgTarget.takeSeries.processSeries,
          createdAt: new Date(),
          series: [],
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

    var series = orgTarget.takeSeries.series;
    for (var i = 0; i < series.length; i++) {
      seriesMap = series[i];
      TargetSessions.update({_id: id}, {
        $push: { 'takeSeries.series': seriesMap },
      });
    }
  }

  render() {

    return (
      <Table.Row>
        <Table.Cell collapsing>
          <Checkbox
            toggle
            checked={this.state.checked}
            onChange={this.onChangeChecked.bind(this)}
        />
        </Table.Cell>
        <Table.Cell collapsing>{this.props.target.name}</Table.Cell>
        <Table.Cell collapsing>{this.props.target.description}</Table.Cell>
        <Table.Cell collapsing><Progress percent={this.calcTargetProgress()} progress /></Table.Cell>
        <Table.Cell collapsing>
          <Button.Group basic size='small'>
            <Button icon='edit' onClick={this.editEntry.bind(this)}/>
            <Button icon='copy' onClick={this.copyEntry.bind(this)}/>
            <Button icon='delete' onClick={this.deleteEntry.bind(this)}/>
          </Button.Group>
        </Table.Cell>
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
      </Table.Row>
    )
  }
}

export default withTracker(() => {
    return {
      targets: TargetSessions.find({}, { sort: { name: 1 } }).fetch(),
  };
})(TargetSession);
