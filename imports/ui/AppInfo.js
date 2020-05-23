/*
tsx cmd - A web page to send commands to TheSkyX server
    Copyright (C) 2018  Stephen Townsend

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { withTracker } from 'meteor/react-meteor-data';
import {
  Button,
  Checkbox,
  Dropdown,
  Label,
  Input,
  Header,
  Icon,
  Table,
} from 'semantic-ui-react'

class AppInfo extends Component {

  constructor() {
    super();
    this.state = {
     ip: 'localhost',
     port: 3040,
     version: 'tbd',
     date: 'unknown',
   };
 }

  // Initialize states
  componentDidMount() {
    // Typical usage (don't forget to compare props):
    this.updateDefaults(this.props);
  }

  componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
    if (this.props !== prevProps) {
      this.updateDefaults(this.props);
    }
  }

  updateDefaults(nextProps) {
      if( typeof nextProps == 'undefined'  ) {
        return;
      }

      // GOT TO BE A BETTER WAY THAN THIS CHECK!!!
      if( typeof nextProps.ip !== 'undefined'  ) {
        this.setState({
          ip: nextProps.ip.value,
          port: nextProps.port.value,
          version: nextProps.version.value,
          date: nextProps.date.value,
        });
      }
  }

  render() {
    // get the ses
    var IP = this.state.ip;
    var PORT = this.state.port;
    var VERSION = this.state.version;
    var DATE = this.state.date;

    return (
      <center>
        <Label>tsx_cmd - Imaging with TheSkyX</Label>
        <Label>version <Label.Detail>{VERSION}</Label.Detail></Label>
        <Label>date <Label.Detail>{DATE}</Label.Detail></Label>
        <Label>TSX ip:
          <Label.Detail>
            {IP}
          </Label.Detail>
        </Label>
        <Label>
          TSX port:
          <Label.Detail>
            {PORT}
          </Label.Detail>
        </Label>
        <br/>&nbsp;&nbsp;
      </center>
    )
  }
}

export default withTracker(() => {
    return {
  };
})(AppInfo);
