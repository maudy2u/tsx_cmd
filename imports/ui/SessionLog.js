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
//import ReactDOM from 'react-dom';
// import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';
import {
  Checkbox,
  Confirm,
  Input,
  Icon,
  Grid,
  Dropdown,
  Label,
  Table,
  Menu,
  Segment,
  Button,
  Progress,
  Modal,
  Form,
  Radio,
  Accordion,
  Divider,
  Header,
} from 'semantic-ui-react'

import {
  tsx_ServerStates,
  tsx_UpdateServerState,
  tsx_GetServerState,
  saveDefaultStateValue,
} from  '../api/serverStates.js';

import { TheSkyXInfos } from '../api/theSkyXInfos.js';

import {
  Filters,
  updateFlatExposure,
} from '../api/filters.js';

import {
  createImagingReportSessionDate,
  createImagingReportSessionDateTemplate,
  getSessionDates
} from '../api/imagingSessionLogs.js'

import TargetLog from './TargetLog.js';


// Import the UI
class SessionLog extends Component {

  constructor() {
    super();
    this.state = {
      activeIndex: 0,
      sessionDate: '',
      reportData: [],
    };
  }

  // used for Accordion
  handleClick = (e, titleProps) => {
   const { index } = titleProps
   const { activeIndex } = this.state
   const newIndex = activeIndex === index ? -1 : index

   this.setState({ activeIndex: newIndex })
 }

 handleChange = (e, { name, value }) => {
   this.setState({ [name]: value });
 }

  // used for the modal exposure settings for flats
  handleStateChange = (e, { name, value }) => {
    this.setState({ [name]: value.trim() });
    saveDefaultStateValue( name, value.trim() );
    forceUpdate();
  };

//  handleToggle = (e, { name, value }) => this.setState({
//    [name]: Boolean(!eval('this.state.'+name)) })

  handleToggleAndSave = (e, { name, value }) => {
    var val = eval( 'this.state.' + name);

    this.setState({
      [name]: !val
    });
    saveDefaultStateValue( name, !val );
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
      //   tool_flats_via: nextProps.tsxInfo.find(function(element) {
      //     return element.name == 'tool_flats_via';
      // }).value});
    }

  }

  render() {
/*

  1. Get the sessions available
  2. populate the session dates in the drop down
  3. Pick the date, pass to Log and print table

 */

    const { activeIndex } = this.state;
    var sessionDates = getSessionDates();

    var dropDownSessionDates = [];
    for( var sd=0; sd<sessionDates.length; sd ++ ) {
      dropDownSessionDates.push(
        { key: sessionDates[sd], text: sessionDates[sd], value: sessionDates[sd]}
      );
    }
    var reportData = createImagingReportSessionDateTemplate( this.state.sessionDate );

    return (
      <div>
      <Header>Session Log</Header>
      <Dropdown
        button
        search
        wrapSelection
        scrolling
        label='Session Dates'
        name='sessionDate'
        options={dropDownSessionDates}
        placeholder='Pick a date'
        text={this.state.sessionDate}
        onChange={this.handleChange}
      />
      <br/>
      <Accordion size='mini' styled>
          <Accordion.Title
            active={activeIndex === 0}
            content='Session Report'
            index={0}
            onClick={this.handleClick}
            />
          <Accordion.Content active={activeIndex === 0} >
            <Table celled compact basic unstackable>
              <Table.Header style={{background: 'black'}}>
                <Table.Row>
                  <Table.Cell content='Target' />
                  <Table.Cell content='Filter' />
                  <Table.Cell content='Exp.' />
                  <Table.Cell content='No.' />
                  <Table.Cell content='Total' />
                </Table.Row>
              </Table.Header>
                <TargetLog
                  reportData={reportData}
                  sessionDate={this.state.sessionDate}
                />
            </Table>
          </Accordion.Content>
      </Accordion>
      </div>
    )
  }
}
export default withTracker(() => {
  return {
  };
})(SessionLog);
