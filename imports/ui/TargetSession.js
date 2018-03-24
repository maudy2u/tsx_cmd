import React, { Component } from 'react';
import { Dropdown, Menu, Segment, Button, Progress } from 'semantic-ui-react'
import { TargetSessions } from '../api/targetSessions.js';

function totalImages (target) {
  var series = target.takeSeries.series.takeSeries;
  console.log('Number of series found: ' + series.takeSeries.length);
}

// ImageSession component - represents a single ImageSession
export default class TargetSession extends Component {
  render() {
    // Get the data for the sessions
    // var test;
    // var imageSessionDescription = {this.props.imageSession.description};
    // var cImage = {this.props.imageSession.imagesTaken};
    // var tImage = {this.props.imageSession.imagesTotal};
    var cImage = 9;
    var tImage = 33;
    var iNum = (cImage/tImage*100).toFixed(0);
    var name = this.props.targetSession.get('name');
    var description = this.props.targetSession.get('description');

    return (
      <li>
        {name} : {description}
        <Progress percent={iNum} progress />
      </li>
    );
  }
}
