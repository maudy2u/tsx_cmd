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
import ReactDOM from 'react-dom';
// import {mount} from 'react-mounter';

import { withTracker } from 'meteor/react-meteor-data';

import {
  updateTakeSeriesStateValue,
} from  '../api/serverStates.js';

import {
  TakeSeriesTemplates,
  updateTakeSeriesTemplate,
} from '../api/takeSeriesTemplates.js';

import { Seriess } from '../api/seriess.js';

import {
  // Tab,
  Grid,
  Label,
  // Segment,
  Button,
  // Progress,

  // Form,
  Checkbox,
  // Input,
  Dropdown,
  Radio,
  Table,
} from 'semantic-ui-react'

import {
  Form,
  // Checkbox,
  Input,
//   Dropdown,
//   Radio,
} from 'formsy-semantic-ui-react';
const ERRORLABEL = <Label color="red" pointing/>
const XRegExp = require('xregexp');
const XRegExpPosNum = XRegExp('^0$|(^([1-9]\\d*(\\.\\d+)?)$)|(^0?\\.\\d*[1-9]\\d*)$');
const XRegExpNonZeroPosInt = XRegExp('^([1-9]\\d*)$');
const XRegExpZeroOrPosInt = XRegExp('^(\\d|[1-9]\\d*)$');
const XRegExpZeroToNine = XRegExp('^\\d$');


import TakeSeriesEditor from './TakeSeriesEditor.js';

class TakeSeriesTemplateEditor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: this.props.template.name,
      description: this.props.template.description,
      processSeries: this.props.template.processSeries,
      repeatSeries: this.props.template.repeatSeries,
      defaultDithering: this.props.template.defaultDithering,
      seriesOrderFix: '',
    }
  };

  componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
    if (this.props.target !== prevProps.target) {
      this.setState({
        name: this.props.template.name,
        description: this.props.template.description,
        processSeries: this.props.template.processSeries,
        repeatSeries: this.props.template.repeatSeries,
        defaultDithering: this.props.template.defaultDithering,
      });
    }
  }

  processSeriesChange = (e, { value }) => {
    this.setState({ processSeries: value });
    updateTakeSeriesTemplate(
      this.props.template._id,
      'processSeries',
      value,
    );
  }

  handleChange = (e, { name, value }) => {
    updateTakeSeriesTemplate( this.props.template._id, name, value );
  };
  handleToggle = (e, { name, checked }) => {
//    var val = eval( 'this.state.' + name);
    this.setState({
      [name]: checked
    });
    updateTakeSeriesStateValue( this.props.template._id, name, checked );
  };

  addEntry() {
    // get the current map
    var tid = this.props.template._id;
    var order = this.props.template.series.length;

    const sid = Seriess.insert(
      {
        order: order,
        exposure: 1,
        binning: '',
        frame: 'Light',
        filter: '',
        repeat: 1,
        takeSeriesTemplate: tid,
      }
    );

    TakeSeriesTemplates.update({_id: tid}, {
      $push: { 'series': {id: sid} }
    });
    this.forceUpdate();
  }

  renderTakeSeries( container ) {
    // this.props.template.series.. this is a series ID
    // does not work:       this.props.template.series.map({sort: {order:1}}, (definedSeries)=>{
    // console.log(this.props.template.series);
    return (
      this.props.template.series.sort(
        function(a, b) {
          // console.log(a.id);
          // console.log(b.id);
          var aO = Seriess.findOne({_id: a.id});
          var bO = Seriess.findOne({_id: b.id});

          // this failed when DB was restored.
          if( typeof a0 === 'undefined'
            || typeof b0 === 'undefined') {
              return 0;
            }
          return aO.order- bO.order;
        }
      ).map((definedSeries)=>{
       return (
        <TakeSeriesEditor
          key={definedSeries.id}
          template={this.props.template}
          series_id={definedSeries}
        />
      )})
    )
  }

  render() {

    return (
      <div>
      <Checkbox
        label=' Repeat series until stopped '
        toggle
        name='repeatSeries'
        checked={this.state.repeatSeries}
        onChange={this.handleToggle.bind(this)}
        />
        <Form>
          <Form.Group widths='equal'>
          <Button  icon='add' onClick={this.addEntry.bind(this)} />
          <Form.Field>
            <Input
              name='name'
              label='Name:'
              type='text'
              placeholder='Name for the series'
              value={this.props.template.name}
              onChange={this.handleChange}
            />
          </Form.Field>
          <Form.Field>
            <Input
              name='description'
              label='Description:'
              type='text'
              placeholder='Describe the series'
              value={this.props.template.description}
              onChange={this.handleChange}
            />
          </Form.Field>
        </Form.Group>
          <Form.Group inline>
            <Form.Field control={Radio} label='Per series' value='per series' checked={this.props.template.processSeries === "per series"} onChange={this.processSeriesChange} />
            <Form.Field control={Radio} label='Across series' value='across series' checked={this.props.template.processSeries === "across series"} onChange={this.processSeriesChange} />
            <Form.Input
              name='defaultDithering'
              label='Images before dither: '
              type='text'
              placeholder='Zero disables'
              value={this.props.template.defaultDithering}
              onChange={this.handleChange}
              validations={{
                matchRegexp: XRegExpZeroOrPosInt, // https://github.com/slevithan/xregexp#unicode
              }}
              validationError="Must be a positive number, e.g 0, 5, 1800, 3600"
              errorLabel={ ERRORLABEL }
              />
          </Form.Group>
        </Form>
        <Table celled compact basic unstackable>
          <Table.Header style={{background: 'black'}}>
            <Table.Row>
              <Table.Cell content='Remove' />
              <Table.Cell content='Exposure' />
              <Table.Cell content='Filter' />
              <Table.Cell content='Bin' />
              <Table.Cell content='Quantity' />
              <Table.Cell content='Order' />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {this.renderTakeSeries(this.state.seriesOrderFix)}
          </Table.Body>
        </Table>
      </div>
    )
  }
}
export default withTracker(() => {
  //{}, { sort: { name: 1 } }
    return {
      seriess: Seriess.find({}, { sort: { order: 1 } }).fetch(),
      templates: TakeSeriesTemplates.find({} ).fetch(),
      // does not work...
//      templateTest: TakeSeriesTemplates.findOne({_id:this.props.key} ),
  };
})(TakeSeriesTemplateEditor);

/*
<strong>onChange:</strong>
<pre>{JSON.stringify({ name, email }, null, 2)}</pre>
<strong>onSubmit:</strong>
<pre>{JSON.stringify({ submittedName, submittedEmail }, null, 2)}</pre>
*/
