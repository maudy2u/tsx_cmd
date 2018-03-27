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
  handleChecked = (e, { value }) => this.setState({ checked: value });

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


  render() {

    return (
      <Table.Row>
        <Table.Cell>
          <Checkbox
            toggle
            checked={this.state.checked}
            onChange={this.handleChange}
        />
        </Table.Cell>
        <Table.Cell>{this.props.target.name}</Table.Cell>
        <Table.Cell>{this.props.target.description}</Table.Cell>
        <Table.Cell><Progress percent={this.calcTargetProgress()} progress /></Table.Cell>
        <Table.Cell>
          <Button.Group basic size='small'>
            <Button icon='edit' onClick={this.editEntry.bind(this)}/>
            <Button icon='copy' />
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
        </Table.Cell>
      </Table.Row>
    )
  }
}

export default withTracker(() => {
    return {
      targets: TargetSessions.find({}, { sort: { name: 1 } }).fetch(),
  };
})(TargetSession);
