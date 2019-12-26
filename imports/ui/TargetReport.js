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
import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js'
import { Seriess } from '../api/seriess.js'
import { TargetSessions } from '../api/targetSessions.js'

import {
  Filters,
  renderDropDownFilters,
  getFlatExposure,
} from '../api/filters.js';

import {
  sessionDate,
} from '../api/time_utils.js'

import {
  getSessionTargetFilterExposureTotal,
  getTargetFilterExposureRunningTotal,
  getTargetReportTemplate,
} from '../api/sessionReports.js'

//const sDate = sessionDate(new Date());

class TargetReport extends Component {

  constructor() {
    super();
    this.state = {
      target: '',
      sessionDate: sessionDate(new Date()),
      report: '',
    };
  }

  // Initialize states
  componentWillMount() {
    // // do not modify the state directly

    if( typeof this.props.enabledTargetSessions == 'undefined') {
      return;
    }
    this.setState({
      target: this.props.enabledTargetSessions.target,
    });
  }

  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value });
    updateCalibrationFrame(
      this.props.calibration._id,
      name,
      value,
    );
  };
  handleToggle = (e, { name }) => {
    var val = eval( 'this.state.' + name);
    this.setState({
      [name]: !val
    });
    updateCalibrationFrame(
      this.props.calibration._id,
      name,
      !val,
    );
  };

  componentWillMount() {
    this.updateDefaults(this.props);
  }

  updateDefaults(nextProps) {
    if( typeof nextProps == 'undefined'  ) {
      return;
    }
    if( typeof nextProps.tsxInfo != 'undefined'  ) {
      this.setState({
        flatbox_enabled: nextProps.tsxInfo.flatbox_enabled
      });
    }
    if( typeof nextProps.enabledTargetSessions != 'undefined'  ) {
      this.setState({
        target: nextProps.enabledTargetSessions.target
      });
      // this.setState({
      //   report: getTargetReportTemplate(this.state.sessionDate, nextProps.enabledTargetSessions.target),
      // })

    }
  }

  render() {
    const reportData = getTargetReportTemplate(this.state.sessionDate, this.props.target);

    return (
      <Table.Body>
      { reportData.map((obj)=> {
        var session = getSessionTargetFilterExposureTotal(obj);
        var sData = '';
        if( obj.repeating ) {
          sData = session + '*';
        }
        else {
          sData = session + '/' + obj.quantity;
        }

        if( session > 0)
          return (
            <Table.Row style={{color: 'white'}} key={obj.id}>
              <Table.Cell width={2} content={this.props.target.targetFindName} />
              <Table.Cell width={1} content={obj.filter} />
              <Table.Cell width={1} content={obj.exposure} />
              <Table.Cell width={1} content={sData} />
              <Table.Cell width={1} content={getTargetFilterExposureRunningTotal(obj)}/>
            </Table.Row>
          )}
      )}
      </Table.Body>
    )
  }
}

export default withTracker(() => {
    return {
  };
})(TargetReport);
