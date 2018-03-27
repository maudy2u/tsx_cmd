import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Dropdown, Menu, Table, Segment, Button, Progress } from 'semantic-ui-react'

import { TargetSessions } from '../api/targetSessions.js';
import Target  from './Target.js';

// ImageSession component - represents a single ImageSession
// export default
class TargetSessionMenu extends Component {

  //{this.testMeteorMethod.bind(this)}
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

  render() {

      return (
        <div>
          <Button.Group basic size='small'>
            <Button icon='settings' onClick={this.loadTestDataMeteorMethod.bind(this)}/>
            <Button icon='find' onClick={this.chkTestData.bind(this)}/>
            <Button icon='upload' />
          </Button.Group>
          <Button.Group labeled icon>
            <Button icon='play'  onClick={this.testTakeImage.bind(this)}/>
            <Button icon='pause'  />
            <Button icon='stop'  />
          </Button.Group>
        <Table celled selectable>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Enabled</Table.HeaderCell>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Description</Table.HeaderCell>
              <Table.HeaderCell>Progress</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {this.props.targets.map( (target)=>{
              return <Target key={target._id} target={target} />
            })}
          </Table.Body>
        </Table>
      </div>
    )
  }
}
export default withTracker(() => {
    return {
      targets: TargetSessions.find({}, { sort: { name: 1 } }).fetch(),
  };
})(TargetSessionMenu);
