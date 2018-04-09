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

/*
*******************************
#todo Need to work on the loading of the defaults properly
*/
        // coolingTemp: TheSkyXInfos.findOne({name: 'defaultCoolTemp'}),
        clsFliter: '',
        focusFliter: '',
        foccusSamples: '',
        focusBin: '',
        guideExposure: '',
        guideDelay: '',
        priority: '',
        enableMeridianFlip: TheSkyXInfos.findOne({name: 'defaultMeridianFlip'}),
        startTime: '',
        stopTime: '',
        // startTime: TheSkyXInfos.findOne({name: 'defaultStartTime'}),
        // stopTime: TheSkyXInfos.findOne({name: 'defaultSopTime'}),
        tempChg: '',
        minAlt: '',
        // tempChg: TheSkyXInfos.findOne({name: 'defaultFocusTempDiff'}),
        // minAlt: TheSkyXInfos.findOne({name: 'defaultMinAlt'}),
        currentAlt: 0, // set to zero for now.
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
          <Segment>
            <Button.Group basic size='small'>
              <Button icon='linkify' onClick={this.loadTestDataMeteorMethod.bind(this)}/>
              <Button icon='settings' onClick={this.loadTestDataMeteorMethod.bind(this)}/>
              <Button icon='find' onClick={this.chkTestData.bind(this)}/>
              <Button icon='add' onClick={this.addEntry.bind(this)}/>
            </Button.Group>
          </Segment>
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
          <Item.Group divided>
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
