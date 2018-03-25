import React, { Component } from 'react';
import { Dropdown, Menu, Table, Segment, Button, Progress } from 'semantic-ui-react'
import { TargetSessions } from '../api/targetSessions.js';

function totalImages (target) {
  var series = target.takeSeries.series.takeSeries;
  console.log('Number of series found: ' + series.takeSeries.length);
}

// ImageSession component - represents a single ImageSession
export default class TargetSession extends Component {

  calcTargetProgress() {
      var totalPlannedImages = 0;
      var totalTakenImages = 0;
      var target = this.props.targetSession.takeSeries.series;
      for (var i = 0; i < target.length; i++) {

        totalTakenImages += target[i].taken;
      }
      return totalTakenImages;
  };

  deleteTarget() {
      TargetSessions.remove(this.props.targetSession._id);
  }

  render() {
    // Get the data for the sessions
    // var test;
    // var imageSessionDescription = {this.props.imageSession.description};
    // var cImage = {this.props.imageSession.imagesTaken};
    // var tImage = {this.props.imageSession.imagesTotal};
    var cImage = 9;
    var tImage = 33;
    var iNum = (cImage/tImage*100).toFixed(0);
    // var name = this.props.targetSession.get('name');
    // var description = this.props.targetSession.get('description');
    iNum = this.calcTargetProgress();

    return (
      <Table.Row>
        <Table.Cell>{this.props.targetSession.name}</Table.Cell>
        <Table.Cell>{this.props.targetSession.description}</Table.Cell>
        <Table.Cell><Progress percent={iNum} progress /></Table.Cell>
        <Table.Cell>
          <Button.Group basic size='small'>
            <Button icon='delete' onClick={this.deleteTarget.bind(this)}/>
            <Button icon='edit' />
            <Button icon='upload' />
          </Button.Group>
        </Table.Cell>
      </Table.Row>
    );
  }
}
