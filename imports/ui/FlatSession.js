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
import { withTracker } from 'meteor/react-meteor-data';
import { Item, Dropdown, Menu, Confirm, Modal, Table, Segment, Button, Progress } from 'semantic-ui-react'

import { TakeSeriesTemplates} from '../api/takeSeriesTemplates.js';
import { TargetSessions } from '../api/targetSessions.js';
import { TheSkyXInfos } from '../api/theSkyXInfos.js';

import TargetEditor from './TargetEditor.js';
import Target  from './Target.js';

// ImageSession component - represents a single ImageSession
// export default
class FlatSession extends Component {

  state = {
    open: false ,
    addModalOpen: false,
    newTarget: {
      _id:'',
    },
    targetList: '',
  }

  handleAddModalOpen = () => this.setState({ addModalOpen: true })
  handleAddModalClose = () => this.setState({ addModalOpen: false })

// example of more than one state...
//  show = size => () => this.setState({ size, open: true })
  show = () => this.setState({ open: true })
  close = () => this.setState({ open: false })

  render() {

    const { open } = this.state;

      return (
        <div>
         <Form>
          <Segment.Group>
            <Segment>
              <Button icon='save' onClick={this.saveDefaults.bind(this)} />
              {/* <Button icon='save' onClick={this.saveTSXServerConnection.bind(this)}> Save Connection </Button>
              {this.renderTSXConnetion()} */}
            </Segment>
            <Segment>
              <h3 className="ui header">Defaults</h3>
              <Form.Group>
                <Form.Field control={Dropdown}
                  fluid
                  label='Default Filter'
                  name='defaultFilter'
                  options={filters}
                  placeholder='Used CLS and Focusing'
                  text={this.state.defaultFilter}
                  onChange={this.handleChange}
                />
              </Form.Group>
            </Segment>
            <Segment>
              <Form.Group>
                <Form.Input
                  label='Twilight Alittude for Sun '
                  name='defaultMinSunAlt'
                  placeholder='Enter negative degrees below horizon'
                  value={this.state.defaultMinSunAlt}
                  onChange={this.handleChange}
                />
              </Form.Group>
            </Segment>
          </Segment.Group>
        </Form>
      </div>
    )
  }
}
export default withTracker(() => {
    return {
      // targets: TargetSessions.find({}, { sort: { enabledActive: -1, targetFindName: 1, } }).fetch(),
  };
})(FlatSession);
