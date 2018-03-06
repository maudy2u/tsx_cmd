import React, { Component } from 'react';

// ImageSession component - represents a single ImageSession
export default class ImageSession extends Component {
  render() {
    return (
      <li>{this.props.imageSession.description}</li>
    );
  }
}
