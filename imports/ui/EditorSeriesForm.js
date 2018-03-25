import React, { Component } from 'react'
import ReactDOM from 'react-dom';

import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';

import { Form, Button, Radio, Input, } from 'semantic-ui-react'

import DefineSeries from './DefineSeries.js';

export default class EditorSeriesForm extends Component {

  saveEntry() {
    const name = ReactDOM.findDOMNode(this.refs.tempName.inputRef).value; //.trim();

    TakeSeriesTemplates.update(this.props.template._id, {
      $set: { name: name },
    });

  }

  render() {

    return (
      <div>
        <Button  icon='save' onClick={this.saveEntry.bind(this)} />
        <Button  icon='add'  />
        <Button  icon='delete'  />
        <Form>
          <Form.Field>
            <Input
              label='Name:'
              ref='tempName'
              type='text'
              placeholder='Name for the series'
              defaultValue={this.props.template.name}
            />
          </Form.Field>
          <Form.Field>
            <Input
              label='Description:'
              ref='tempDesc'
              type='text'
              placeholder='Describe the series'
              value={this.props.template.description}
            />
          </Form.Field>
          <Form.Field>
            Repeat executes: <b>{this.props.template.processSeries}</b>
          </Form.Field>
          <Form.Field>
            <Radio
              label='Per series'
              name='seriesRadioGroup'
              value='per series'
              checked={this.props.template.processSeries === "per series"}
              // onChange={this.handleSeriesState}
            />
          </Form.Field>
          <Form.Field>
            <Radio
              label='Across series'
              name='seriesRadioGroup'
              value='across series'
              checked={this.props.template.processSeries === "across series"}
              // onChange={this.handleSeriesState}
            />
          </Form.Field>
          <Form.Field>
            <Radio
              label='Repeat series'
              name='seriesRadioGroup'
              value='repeat'
              checked={this.props.template.processSeries === "repeat"}
              // onChange={this.handleSeriesState}
            />
          </Form.Field>
        </Form>
        <table className="ui selectable celled table">
          <thead>
            <tr>
              <th>#</th>
              <th>Exposure</th>
              <th>Binning</th>
              <th>Frame</th>
              <th>Filter</th>
              <th>Repeat</th>
            </tr>
          </thead>
          <tbody>
            {this.props.template.series.map( (definedSeries)=>{
              // return  <DefineSeries key={definedSeries._id} definedSeries={definedSeries} />
            })}
          </tbody>
        </table>
      </div>
    )
  }
}
/*
<strong>onChange:</strong>
<pre>{JSON.stringify({ name, email }, null, 2)}</pre>
<strong>onSubmit:</strong>
<pre>{JSON.stringify({ submittedName, submittedEmail }, null, 2)}</pre>
*/
