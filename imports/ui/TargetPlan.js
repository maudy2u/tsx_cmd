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

import React, { Component } from 'react'
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

import {
  tsx_ServerStates,
  tsx_UpdateServerState,
  tsx_GetServerState,
} from  '../api/serverStates.js';

// Import the API Model
import {
  TheSkyXInfos
} from '../api/theSkyXInfos.js';

import {
  TargetSessions,
} from '../api/targetSessions.js'

function updateTargetPlan( fid, name, value ) {
  var obj = TargetSessions.findOne({_id:fid});
  if( typeof obj != 'undefined') {
    if( name == 'startTime') {
      obj.startTime = value;
    }
    else if( name == 'stopTime') {
      obj.stopTime = value;
    }
    else if( name == 'description') {
      obj.description = value;
    }
    else if( name == 'priority') {
      obj.priority = value;
    }
    else if( name == 'minAlt') {
      obj.minAlt = value;
    }
    else if( name == 'Comment') {
      tsxLog( ' targetPlan: comment not implemented yet')
    }

    TargetSessions.update({_id: obj._id}, {
      $set: {
        description: obj.description,
        startTime: obj.startTime,
        stopTime: obj.stopTime,
        priority: obj.priority,
        minAlt: obj.minAlt,
      }
    });
  }
}

class TargetPlan extends Component {

  state = {
    name: '',
    description: '',
    startTime: '',
    stopTime: '',
    priority: 0,
    minAlt: 45,
    Comment: '',
  }

  // Initialize states
  componentWillMount() {
    // // do not modify the state directly

    if( typeof this.props.targetPlan == 'undefined') {
      return;
    }
    this.setState({
      name: this.props.targetPlan.targetFindName,
      description: this.props.targetPlan.description,
      startTime: this.props.targetPlan.startTime,
      stopTime: this.props.targetPlan.stopTime,
      priority: this.props.targetPlan.priority,
      minAlt: this.props.targetPlan.minAlt,
    });
  }

  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value });
    updateTargetPlan(
      this.props.targetPlan._id,
      name,
      value,
    );
  };

  componentDidMount() {
    this.updateDefaults(this.props);
  }

  updateDefaults(nextProps) {
    if( typeof nextProps == 'undefined'  ) {
      return;
    }
    if( typeof nextProps.tsxInfo != 'undefined'  ) {
      // this.setState({
      //   flatbox_enabled: nextProps.tsxInfo.flatbox_enabled
      // });
    }
    if( typeof nextProps.targetPlan != 'undefined'  ) {
      this.setState({
        name: nextProps.targetPlan.targetFindName
      });
      this.setState({
        description: nextProps.targetPlan.description
      });
      this.setState({
        startTime: nextProps.targetPlan.startTime
      });
      this.setState({
        stopTime: nextProps.targetPlan.stopTime
      });
      this.setState({
        priority: nextProps.targetPlan.priority
      });
      this.setState({
        minAlt: nextProps.targetPlan.minAlt
      });
    }
  }

  render() {

    return (
      <Table.Row>
        <Table.Cell>
          {this.props.targetPlan.name +': ' + this.props.targetPlan.description}
        </Table.Cell>
        <Table.Cell>
          <Input
            fluid
            size='mini'
            name='startTime'
            placeholder='0:00'
            value={this.props.targetPlan.startTime}
            onChange={this.handleChange}
          />
        </Table.Cell>
        <Table.Cell>
          <Input
            fluid
            size='mini'
            name='stopTime'
            placeholder='0:00'
            value={this.props.targetPlan.stopTime}
            onChange={this.handleChange}
          />
        </Table.Cell>
        <Table.Cell>
          <Input
            fluid
            size='mini'
            name='priority'
            placeholder='10'
            value={this.props.targetPlan.priority}
            onChange={this.handleChange}
          />
        </Table.Cell>
        <Table.Cell>
          <Input
            fluid
            size='mini'
            name='minAlt'
            placeholder='45'
            value={this.props.targetPlan.minAlt}
            onChange={this.handleChange}
          />
        </Table.Cell>
        <Table.Cell>
          <Input
            fluid
            size='mini'
            name='comment'
            placeholder='...'
            value='...'
            onChange={this.handleChange}
          />
        </Table.Cell>
      </Table.Row>
    )
  }
}

export default withTracker(() => {
    return {
  };
})(TargetPlan);
