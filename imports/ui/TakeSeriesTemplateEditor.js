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
//   Checkbox,
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

  state = {
    name: '',
    description: '',
    processSeries: "",
    seriesContainer: [],
    repeatSeries: false,
    defaultDithering: 0,
    seriesOrderFix: '',
  };

  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value });
    updateTakeSeriesTemplate(
      this.props.template._id,
      name,
      value,
    );
  };
  processSeriesChange = (e, { value }) => {
    this.setState({ processSeries: value });
    updateTakeSeriesTemplate(
      this.props.template._id,
      'processSeries',
      value,
    );
  }

  handleChecked = (e, { name, checked }) => {
    this.setState({ [name]: checked });
    updateTakeSeriesTemplate(
      this.props.template._id,
      name,
      checked,
    );
  };

  componentWillMount() {
    // do not modify the state directly
    this.updateDefaults(this.props);
  }

  componentDidMount() {
    this.updateDefaults(this.props);
  }

  updateDefaults(nextProps) {
    if( typeof nextProps == 'undefined'  ) {
      return;
    }
    if( typeof nextProps.template != 'undefined'  ) {
      this.setState({
        name: nextProps.template.name,
        description: nextProps.template.description,
        processSeries: nextProps.template.processSeries,
        defaultDithering: nextProps.template.defaultDithering,
        seriesContainer: nextProps.template.series,
      });
      if( typeof nextProps.template.repeatSeries == 'undefined'
        || nextProps.template.repeatSeries == '' ) {
          this.setState({
            repeatSeries: false,
          });
      }
    }
  }

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

    var a = this.props.template.series;
    /*
    <Grid.Column>
    <b>Frame</b>
    </Grid.Column>

    <Button  icon='save' onClick={this.saveEntry.bind(this)} />
    */

    return (
      <div>
        <Form>
          <Form.Group widths='equal'>
          <Button  icon='add' onClick={this.addEntry.bind(this)} />
          <Form.Field>
            <Input
              name='name'
              label='Name:'
              type='text'
              placeholder='Name for the series'
              value={this.state.name}
              onChange={this.handleChange}
            />
          </Form.Field>
          <Form.Field>
            <Input
              name='description'
              label='Description:'
              type='text'
              placeholder='Describe the series'
              value={this.state.description}
              onChange={this.handleChange}
            />
          </Form.Field>
        </Form.Group>
          <Form.Group inline>
            <Form.Field control={Radio} label='Per series' value='per series' checked={this.state.processSeries === "per series"} onChange={this.processSeriesChange} />
            <Form.Field control={Radio} label='Across series' value='across series' checked={this.state.processSeries === "across series"} onChange={this.processSeriesChange} />
            <Form.Checkbox
              label=' Repeat series until stopped '
              toggle
              name='repeatSeries'
              checked={this.state.repeatSeries}
              onChange={this.handleChecked.bind(this)}
            />
            <Form.Field>
              <Form.Input
                name='defaultDithering'
                label='Images before dither: '
                type='text'
                placeholder='Zero disables'
                value={this.state.defaultDithering}
                onChange={this.handleChange}
                validations={{
                  matchRegexp: XRegExpZeroOrPosInt, // https://github.com/slevithan/xregexp#unicode
                }}
                validationError="Must be a positive number, e.g 0, 5, 1800, 3600"
                errorLabel={ ERRORLABEL }
              />
            </Form.Field>
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
