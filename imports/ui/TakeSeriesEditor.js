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
// import ReactDOM from 'react-dom';
// import {mount} from 'react-mounter';

import { withTracker } from 'meteor/react-meteor-data';

import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';
import { Seriess } from '../api/seriess.js';
import { Filters } from '../api/filters.js';

// import { Form, Grid, Input, Table, Button, Dropdown, } from 'semantic-ui-react'
import {
  // Tab,
  Table,

  Label,
  // Segment,
  Button,
  // Progress,
} from 'semantic-ui-react'

import {
  Form,
  // Checkbox,
  Input,
  Dropdown,
  Radio,
} from 'formsy-semantic-ui-react';

import {
  renderDropDownImagingBinnings,
  getBin,
} from '../api/binnings.js'

import {
  renderDropDownFilters,
} from '../api/filters.js'

const ERRORLABEL = <Label color="red" pointing/>
const XRegExp = require('xregexp');
const XRegExpPosNum = XRegExp('^0$|(^([1-9]\\d*(\\.\\d+)?)$)|(^0?\\.\\d*[1-9]\\d*)$');
const XRegExpNonZeroPosInt = XRegExp('^([1-9]\\d*)$');
const XRegExpZeroOrPosInt = XRegExp('^(\\d|[1-9]\\d*)$');
const XRegExpZeroToNine = XRegExp('^\\d$');


var frames = [
  'Light',
  'Flat',
  'Dark',
  'Bias',
];

class TakeSeriesEditor extends Component {

// Setup states
  state = {
    id: '',
    order: 0,
    exposure: 0,
    frame: 'Light',
    filter: 'Filter',
    repeat: 0,
    binning: '',
    takeSeriesTemplate: '',
    dithering: 0,
  };

  // // change states
  handleChange = (e, { name, value }) => {

    this.setState({ [name]: value });

    var sid = this.props.series_id.id;
    Meteor.call( 'updateSeriesIdWith', sid, name, value , function(error, result) {

    // Meteor.call(
    //   'updateSeriesIdWith',
    //   sid ,
    //   name,
    //   value,
    //   function(error, result)  {
        // identify the error
        if (error && error.error === "logged-out") {
          // show a nice error message
          Session.set("errorMessage", "Please log edit.");
        }
    });//.bind(this));
  };

  // Initialize states
  componentWillMount() {
    var definedSeries = Seriess.findOne({_id:this.props.series_id.id});
    // // do not modify the state directly
    if( typeof definedSeries == 'undefined') {
      return;
    }
    this.setState({
      id: this.props.series_id,
      order: definedSeries.order,
      exposure: definedSeries.exposure,
      frame: definedSeries.frame,
      filter: definedSeries.filter,
      repeat: definedSeries.repeat,
      binning: definedSeries.binning,
      takeSeriesTemplate: definedSeries.takeSeriesTemplate,
      dithering: definedSeries.dithering,
    });
  }


  deleteEntry() {

    // Get remove form Seriess
    var removeID = this.props.series_id.id;
    var removedSeries = Seriess.findOne({_id:removeID})
    if( typeof removedSeries == 'undefined') {
      return;
    }

    // Recreate the series with ID removed
    // then delete the entry
    var takeSeries = this.props.template;
    var seriesDb = takeSeries.series;
    var newSeries = [];
    for (var i = 0; i < seriesDb.length; i++) {
      if( seriesDb[i].id != removeID ) {
        var tmp = Seriess.findOne({_id:seriesDb[i].id});
        if( typeof tmp == 'undefined') {
          continue;
        }
        // redo order
        if( tmp.order > removedSeries.order ) {
          tmp.order = tmp.order-1;
          Seriess.update( {_id:tmp._id},{
            $set:{ order: tmp.order}
          });
        }
        newSeries.push({id:tmp._id});
      }
    }

    Seriess.remove({_id:removeID});

    // now reset the series Map
    TakeSeriesTemplates.update(
      {_id: this.props.template._id}, {
      $set: {
        series: newSeries,
      }
    });
  }

  reOrderSeries(increment) {
    var seriesID = this.props.series_id;
    var seriesInit = Seriess.findOne({_id: seriesID.id});
    var initOrder = seriesInit.order; // current order position
    var newOrder = initOrder + increment; // negative goes up to zero
    var seriesIds = this.props.template.series;
    for (var i = 0; i < seriesIds.length; i++) {
      var curSeries = Seriess.findOne({_id: seriesIds[i].id});
      if( curSeries._id != seriesInit._id ) {
        if( curSeries.order == newOrder ) {
          Seriess.update( {_id:curSeries._id}, {
            $set: {
              order: initOrder,
            }
          });
          // TakeSeriesTemplate.update({_id})
          Seriess.update( {_id:seriesID.id}, {
            $set: {
              order: newOrder,
            }
          });
        }
      }
    }
  }

  moveUpEntry() {
    this.reOrderSeries(-1);
    this.forceUpdate();
  }

  // same as above
  moveDownEntry() {
    this.reOrderSeries(1);
    this.forceUpdate();
  }

  render() {
    /*
    */
    return (
      <Table.Row verticalAlign={'middle'}>
        <Table.Cell width={1}>
          <Button size='mini' icon='delete'  onClick={this.deleteEntry.bind(this)}/>
        </Table.Cell>
        <Table.Cell width={1}  verticalAlign={'middle'}>
          <Form>
            <Form.Input
              fluid
              placeholder='Exposure'
              name='exposure'
              value={this.state.exposure}
              onChange={this.handleChange}
              validations={{
                matchRegexp: XRegExpPosNum, // https://github.com/slevithan/xregexp#unicode
              }}
              validationError="Must be a positive number, e.g 1, .7, 1.1"
              errorLabel={ ERRORLABEL }
              />
          </Form>
        </Table.Cell>
        <Table.Cell width={2} verticalAlign={'middle'}>
          <Form>
          <Form.Dropdown
              button
              search
              wrapSelection
              scrolling
              name='filter'
              options={renderDropDownFilters()}
              placeholder='Filter'
              text={this.state.filter}
              onChange={this.handleChange}
            />
            </Form>
        </Table.Cell>
        <Table.Cell width={2} verticalAlign={'middle'}>
          <Form>
          <Form.Dropdown
              button
              search
              wrapSelection
              scrolling
              name='binning'
              options={renderDropDownImagingBinnings()}
              placeholder=''
              text={this.state.binning}
              onChange={this.handleChange}
            />
            </Form>
        </Table.Cell>
        <Table.Cell width={1}  verticalAlign={'middle'}>
          <Form>
          <Form.Input
            fluid
            placeholder='Repeat'
            name='repeat'
            value={this.state.repeat}
            onChange={this.handleChange}
            validations={{
              matchRegexp: XRegExpZeroOrPosInt, // https://github.com/slevithan/xregexp#unicode
            }}
            validationError="Must be a positive number, e.g 0, 5, 1800, 3600"
            errorLabel={ ERRORLABEL }
          />
          </Form>
        </Table.Cell>
        <Table.Cell width={2}>
          <Button.Group>
            <Button size='mini' icon='arrow up'  onClick={this.moveUpEntry.bind(this)}/>
            <Button size='mini' icon='arrow down'  onClick={this.moveDownEntry.bind(this)}/>
          </Button.Group>
        </Table.Cell>
      </Table.Row>
    )
  }

}
export default withTracker(() => {
    return {
      // tsxInfo: TheSkyXInfos.find().fetch(),
      // seriess: Seriess.find({}, { sort: { order: 1 } }).fetch(),
      filters: Filters.find({}, { sort: { slot: 1 } }).fetch(),
      // takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
      // targetSessions: TargetSessions.find({}, { sort: { name: 1 } }).fetch(),
  };
})(TakeSeriesEditor);
