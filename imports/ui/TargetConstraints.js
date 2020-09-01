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
  Label,
  Header,
  Icon,
  Table,
  Dropdown,
  Modal,
} from 'semantic-ui-react'

import {
  tsx_ServerStates,
  tsx_UpdateServerState,
  tsx_GetServerState,
  updateTargetSeriesStateValue,
} from  '../api/serverStates.js';

// Import the API Model
import {
  TheSkyXInfos
} from '../api/theSkyXInfos.js';

import TargetEditor from './TargetEditor.js';

import {
  TargetSessions,
} from '../api/targetSessions.js'

import {
  takeSeriesDropDown,
  getTakeSeriesName,
} from '../api/takeSeriesTemplates.js';

import {
  Form,
  Input,
} from 'formsy-semantic-ui-react';
const XRegExp = require('xregexp');
const XRegExpPositiveReal = XRegExp('^[0-9]\\.?[0-9]+|[1-9][0-9]\\.?[0-9]+$');
const XRegExpPosNum = XRegExp('^0$|(^([1-9]\\d*(\\.\\d+)?)$)|(^0?\\.\\d*[1-9]\\d*)$');
const XRegExpNonZeroPosInt = XRegExp('^([1-9]\\d*)$');
const XRegExpZeroOrPosInt = XRegExp('^(\\d|[1-9]\\d*)$');
const XRegExpZeroToNine = XRegExp('^\\d$');
const XRegExpZeroToTwenty = XRegExp('^([0-9]|[1-9][0-9]|20)$');
const XRegExp24hr = XRegExp('^([0-9]:[0-5][0-9]|[1-2][0-9]:[0-5][0-9])$');
const ERRORLABEL = <Label color="red" pointing/>

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
      obj.report.dirty = true;
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
        report: {
          dirty: obj.report.dirty,
        }
      }
    });
  }
  return obj;
}

class TargetConstraints extends Component {

  state = {
    modalOpenTargetEditor: false,
  }

  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value });
    updateTargetPlan(
      this.props.targetPlan._id,
      name,
      value,
    );
  };

  handleSeriesChange = (e, { name, value }) => {
    var seriesId =value;  // get the matching key value
    updateTargetSeriesStateValue( this.props.targetPlan._id, seriesId );
  };

  // Initialize states
  componentDidMount() {
    // // do not modify the state directly

    if( typeof this.props.targetPlan === 'undefined') {
      return;
    }
    this.updateDefaults(this.props);
  }

  componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
    if (this.props.target !== prevProps.target) {
      this.updateDefaults(this.props);
    }
  }

  updateDefaults(nextProps) {
    if( typeof nextProps === 'undefined'  ) {
      return;
    }
  }

  canClickTarget( state, active ) {
    if( state === 'Stop' && active === false ) {
      return this.editTarget.bind(this);
    }
  }

  handleOpenTargetEditor = () => this.setState({ modalOpenTargetEditor: true })
  handleCloseTargetEditor = () => this.setState({ modalOpenTargetEditor: false })

  editTarget() {
    // console.log('In the DefineTemplate editEntry');
    this.handleOpenTargetEditor();
    this.forceUpdate();
  }


  // this can be the entry point to put the "target link"
  getTargetDetails() {
    var TARGET_DESC = '';
    if( this.props.targetPlan.friendlyName !='' && typeof this.props.targetPlan.friendlyName != 'undefined' ) {
      TARGET_DESC = this.props.targetPlan.friendlyName
      +': ' +  this.props.targetPlan.description
      + ' ('+this.props.targetPlan.targetFindName+ ')';
    }
    else {
      TARGET_DESC = this.props.targetPlan.targetFindName +': ' + this.props.targetPlan.description;
    }

    if( typeof this.props.targetPlan.report !== 'undefined' && this.props.targetPlan.report.dirty === true) {
      return (
        <Label ribbon as='a' onClick={this.canClickTarget(this.props.scheduler_running.value, this.props.tool_active.value)}>{TARGET_DESC}</Label>
      )
    }
    else {
      return(
        <Button onClick={this.canClickTarget(this.props.scheduler_running.value, this.props.tool_active.value)}>{TARGET_DESC}</Button>
      )
    }

  }

  render() {
    var TAKESERIES = takeSeriesDropDown(this.props.seriesTemplates);
    var TAKESERIESNAME = getTakeSeriesName(this.props.targetPlan.series);
    var TARGET_NAME = this.props.targetPlan.getFriendlyName();
    var DISABLE = true;
    var IS_UPDATING = this.props.plan_is_updating;

    // then use as needed disabled={DISABLE} or disabled={NOT_DISABLE}
    if( (this.props.scheduler_running.value == 'Stop'  && this.props.tool_active.value == false)
    ){
      DISABLE = false;
    }
    if( IS_UPDATING ) {
      DISABLE = true;
    }

/*
<Modal
  open={this.state.modalOpenTargetEditor}
  onClose={this.handleCloseTargetEditor}
  basic
  size='small'
  closeIcon>
  <Modal.Header>Editing Target {TARGET_NAME}</Modal.Header>
  <Modal.Content>
    <Modal.Description>
      <TargetEditor
        key={this.props.targetPlan._id}
        target={this.props.targetPlan}
      />
    </Modal.Description>
  </Modal.Content>
</Modal>
*/

    return (
      <Table.Row>
        <Table.Cell width={3}>
          {this.getTargetDetails()}
          <Modal
            open={this.state.modalOpenTargetEditor}
            onClose={this.handleCloseTargetEditor}
            basic
            size='small'
            closeIcon>
            <Modal.Header>Editing Target {TARGET_NAME}</Modal.Header>
            <Modal.Content>
              <Modal.Description>
                <TargetEditor
                  key={this.props.targetPlan._id}
                  target={this.props.targetPlan}
                />
              </Modal.Description>
            </Modal.Content>
          </Modal>
        </Table.Cell>
        <Table.Cell width={1}>
          <Form.Field control={Dropdown}
            disabled={DISABLE}
            button
            search
            wrapSelection
            scrolling
            name='seriesTemplate'
            options={TAKESERIES}
            placeholder='ERROR'
            text={TAKESERIESNAME}
            onChange={this.handleSeriesChange}
            />
        </Table.Cell>
        <Table.Cell width={1}>
          {Number(this.props.targetPlan.report.maxAlt).toFixed(2)}
        </Table.Cell>
        <Table.Cell width={1}>
        <Form>
          <Form.Input
            disabled={DISABLE}
            fluid
            size='mini'
            name='minAlt'
            placeholder='45'
            value={this.props.targetPlan.minAlt}
            onChange={this.handleChange}
            validations={{
              matchRegexp: XRegExpPositiveReal, // https://github.com/slevithan/xregexp#unicode
            }}
            validationError="Must be real number -12.4, 45.0, 45"
            errorLabel={ ERRORLABEL }
          />
          </Form>
        </Table.Cell>
        <Table.Cell width={1}>
        <Form>
          <Form.Input
            disabled={IS_UPDATING}
            fluid
            size='mini'
            name='startTime'
            placeholder='0:00'
            value={this.props.targetPlan.startTime}
            onChange={this.handleChange}
            validations={{
              matchRegexp: XRegExp24hr, // https://github.com/slevithan/xregexp#unicode
            }}
            validationError="Must be like 0:00 or 10:00"
            errorLabel={ ERRORLABEL }
          />
          </Form>
        </Table.Cell>
        <Table.Cell width={1}>
        <Form>
          <Form.Input
            disabled={IS_UPDATING}
            fluid
            size='mini'
            name='stopTime'
            placeholder='0:00'
            value={this.props.targetPlan.stopTime}
            onChange={this.handleChange}
            validations={{
              matchRegexp: XRegExp24hr, // https://github.com/slevithan/xregexp#unicode
            }}
            validationError="Must be like 0:00 or 10:00"
            errorLabel={ ERRORLABEL }
          />
          </Form>
        </Table.Cell>
        <Table.Cell width={1}>
        <Form>
          <Form.Input
            disabled={IS_UPDATING}
            fluid
            size='mini'
            name='priority'
            placeholder='10'
            value={this.props.targetPlan.priority}
            onChange={this.handleChange}
            validations={{
              matchRegexp: XRegExpZeroToTwenty, // https://github.com/slevithan/xregexp#unicode
            }}
            validationError="Must be between 0-20"
            errorLabel={ ERRORLABEL }
          />
          </Form>
        </Table.Cell>
      </Table.Row>
    )
  }
}

export default withTracker(() => {
    return {
  };
})(TargetConstraints);
