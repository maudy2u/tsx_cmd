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
import { Session } from 'meteor/session'

// import {mount} from 'react-mounter';
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

import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js'
import { Seriess } from '../api/seriess.js'
import { TargetSessions } from '../api/targetSessions.js'

import {
  Filters,
  renderDropDownFilters,
  getFlatExposure,
} from '../api/filters.js';

import {
  calcTargetFilterExposureSessionTotal,
  calcTargetFilterExposureRunningTotal,
} from '../api/imagingSessionLogs.js'

const XRegExp = require('xregexp');
const XRegExpPosNum = XRegExp('^0$|(^([1-9]\\d*(\\.\\d+)?)$)|(^0?\\.\\d*[1-9]\\d*)$');
const XRegExpNonZeroPosInt = XRegExp('^([1-9]\\d*)$');
const XRegExpZeroOrPosInt = XRegExp('^(\\d|[1-9]\\d*)$');
const XRegExpZeroToNine = XRegExp('^\\d$');
const XRegExpNegToPosInt = XRegExp('^(\\+|-)?\\d+$');

const ERRORLABEL = <Label color="red" pointing/>

class TemplateClass extends Component {

  constructor() {
    super();
    this.state = {
     ip: 'localhost',
     port: 3040,
   };
 }

  // Initialize states
  componentDidMount() {
    // Typical usage (don't forget to compare props):
    this.updateDefaults(this.props);
  }

  componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
    if (this.props.target !== prevProps.target) {
      this.updateDefaults(this.props);
    }
  }

  updateDefaults(nextProps) {
      if( typeof nextProps == 'undefined'  ) {
        return;
      }

      if( typeof nextProps.tsxInfo !== 'undefined'  ) {

        this.setState({
          ip: nextProps.tsxInfo.find(function(element) {
            return element.name === 'ip';
          }).value,

          port: nextProps.tsxInfo.find(function(element) {
            return element.name === 'port';
          }).value,
        });
      }
  }

  render() {
    // get the ses

    return (
      <Table.Body>
      { this.props.reportData.map((obj)=> {
          return (
            <Table.Row style={{color: 'white'}} key={obj.key}>
              <Table.Cell width={2} content={obj.target } />
              <Table.Cell width={1} content={obj.filter } />
              <Table.Cell width={1} content={obj.exposure } />
              <Table.Cell width={1} content={ calcTargetFilterExposureSessionTotal(obj) } />
              <Table.Cell width={1} content={ calcTargetFilterExposureRunningTotal(obj) }/>
            </Table.Row>
          )}
      )}
      </Table.Body>
    )
  }
}

export default withTracker(() => {
    return {
      tsxInfo: TheSkyXInfos.find({}).fetch(),
  };
})(TemplateClass);
