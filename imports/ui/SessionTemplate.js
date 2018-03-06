import React, { Component } from 'react';

// SessionTemplate component - represents a single session template
export default class SessionTemplate extends Component {
  render() {
    return (
      <li>{this.props.sessionTemplate.name}</li>
    );
  }
}
