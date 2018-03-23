import React, { Component } from 'react';
import { Dropdown, Menu, Segment, Button, Progress } from 'semantic-ui-react'
import { TargetSessions } from '../api/targetSessions.js';


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

    return (
      <li>
        {this.props.targetSession.description}
        <Progress percent={iNum} progress />
      </li>
    );
  }
}
