import React, { Component } from 'react';
import { Dropdown, Menu, Segment, Button, Progress } from 'semantic-ui-react'
import { ImageSessions } from '../api/imageSessions.js';


// ImageSession component - represents a single ImageSession
export default class ImageSession extends Component {
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
        {this.props.imageSession.description}
        <Progress percent={iNum} progress />
      </li>
    );
  }
}
