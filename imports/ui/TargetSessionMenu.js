import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Item, Dropdown, Menu, Confirm, Modal, Table, Segment, Button, Progress } from 'semantic-ui-react'

import { TakeSeriesTemplates} from '../api/takeSeriesTemplates.js';
import { TargetSessions } from '../api/targetSessions.js';

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
  }
  handleAddModalOpen = () => this.setState({ addModalOpen: true })
  handleAddModalClose = () => this.setState({ addModalOpen: false })

// example of more than one state...
//  show = size => () => this.setState({ size, open: true })
  show = () => this.setState({ open: true })
  close = () => this.setState({ open: false })

  //{this.testMeteorMethod.bind(this)}
  connectTsxMeteorMethod() {

    // on the client
    Meteor.call("loadTestDataTargetSessions", function (error) {
      // identify the error
      if (error && error.error === "logged-out") {
        // show a nice error message
        Session.set("errorMessage", "Please log in to post a comment.");
      }
    });
  }

  loadTestDataMeteorMethod() {

    // on the client
    Meteor.call("loadTestDataTargetSessions", function (error) {
      // identify the error
      if (error && error.error === "logged-out") {
        // show a nice error message
        Session.set("errorMessage", "Please log in to post a comment.");
      }
    });
  }

  chkTestData() {
    var targets = this.props.targets;
    console.log('test');
    // on the client
    Meteor.call("loadTestDataAllTakeSeriesTemplates", function (error) {
      // identify the error
      if (error && error.error === "logged-out") {
        // show a nice error message
        Session.set("errorMessage", "Please log in to post a comment.");
      }
    });
  }

  testTakeImage() {
    // var a = this.props.targets;
    // var a1 = this.props.targets[0];
    // var a2 = this.props.targets[0].name;
    // var b = this.props.targets[0].takeSeries;
    // var b2 = this.props.targets[0].takeSeries.name;
    // var c = this.props.targets[0].takeSeries.series;
    var d = this.props.targets[0].takeSeries.series[0];
    var f = d.frame;
    var e = d.filter;
    var e1 = d.repeat;
    var e2 = d.taken;
    var cmd = tsxCmdTakeImage(e,d.exposure);

    var remainingImages = d.repeat - d.taken;

    if( (remainingImages < d.repeat) && (remainingImages > 0) ) {
      console.log('Launching take image for: ' + d.filter + ' at ' + d.exposure + ' seconds');
      // var res = this.takeImage(series.filter,series.exposure);
      console.log('Taken image: ' +series.taken);
      series.taken++;
      console.log('Taken image: ' +series.taken);
    }
    // return;
    // on the client
    Meteor.call("startImaging", this.props.targets[0], function (error) {
      // identify the error
      if (error && error.error === "logged-out") {
        // show a nice error message
        Session.set("errorMessage", "Please log in to post a comment.");
      }
    });
  }

  addEntry() {
    console.log('In the TargetSessionMenu addEntry');

    // get the id for the new object
    var newSession = TargetSessions.insert(
      {
        name: '',
        targetFindName: '',
        targetImage: '',
        description: '',
        enabledActive: false,
        series: {
        },
        ra: '',
        dec: '',
        angle: '',
        scale: '',
        coolingTemp: '',
        clsFliter: '',
        focusFliter: '',
        foccusSamples: '',
        focusBin: '',
        guideExposure: '',
        guideDelay: '',
        startTime: '',
        stopTime: '',
        priority: '',
        tempChg: '',
        minAlt: '',
        completed: false,
        createdAt: new Date(),
      }
    );

    this.setState({addModalOpen: true });
    this.setState({newTarget:
      TargetSessions.findOne({_id: newSession })
    });

  }

  render() {

    const { open } = this.state;

      return (
        <div>
          <Button.Group basic size='small'>
            <Button icon='linkify' onClick={this.loadTestDataMeteorMethod.bind(this)}/>
            <Button icon='settings' onClick={this.loadTestDataMeteorMethod.bind(this)}/>
            <Button icon='find' onClick={this.chkTestData.bind(this)}/>
            <Button icon='add' onClick={this.addEntry.bind(this)}/>
            <Button icon='upload' />
          </Button.Group>
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
          <Button.Group icon>
            <Button icon='play'  onClick={this.show.bind(this)}/>
            <Button icon='pause'  />
            <Button icon='stop'  />
          </Button.Group>
          <Item.Group divided>
          <Confirm
            header='Start an imaging session'
            open={this.state.open}
            content='Do you wish to continue and start an imaging session?'
            onCancel={this.close}
            onConfirm={this.testTakeImage.bind(this)}
          />
            {this.props.targets.map( (target)=>{
              return <Target key={target._id} target={target} />
            })}
        </Item.Group>
      </div>
    )
  }
}
export default withTracker(() => {
    return {
      targets: TargetSessions.find({}, { sort: { name: 1 } }).fetch(),
  };
})(TargetSessionMenu);
