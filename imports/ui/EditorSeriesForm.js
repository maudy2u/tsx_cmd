import React, { Component } from 'react'
import { Form, Button, Radio } from 'semantic-ui-react'
import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';

export default class EditorSeriesForm extends Component {


  render() {
    const { exposure, binning, frame, filter, repeat } = this.state

    return (
      <div>
        <Button circular icon='add' onClick='' />
        <Button circular icon='delete' onClick='' />
        <Form>
          <Form.Field>
            <form className="textInputSeriesName" onSubmit="" >
              <input
                type="text"
                ref="seriesName"
                placeholder="Name for the series"
              />
            </form>
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
              return  <DefineSeries key={definedSeries._id} definedSeries={definedSeries} />
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
