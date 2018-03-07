import React, { Component } from 'react';
import { theSkyXInfos } from '../api/theSkyXInfos.js';

// ImageSession component - represents a single ImageSession
export default class TheSkyXInfo extends Component {
  render() {
    return (
      <li>{this.props.theSkyXInfo.description}</li>
    );
  }
}
