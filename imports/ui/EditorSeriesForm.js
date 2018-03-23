import React, { Component } from 'react'
import { Form, Button, Radio } from 'semantic-ui-react'
import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';

export default class EditorSeriesForm extends Component {
  // *******************************
  state = { exposure: '', binning: '', frame: '', filter: '', repeat: '' }

  // *******************************
  handleChange = (e, { name, value }) => this.setState({ [name]: value })


  // *******************************
  handleSubmit = () => {
    const { exposure, binning, frame, filter, repeat } = this.state
    this.setState({ submittedExposure: exposure, submittedBinning: binning, submittedFrame: frame, submittedFilter: filter, submittedRpeat: repeat })
  }

  toggleChecked() {
    // Set the checked property to the opposite of its current value
    TakeSeriesTemplates.update(this.props.takeSeriesTemplates._id, {
      $set: { checked: !this.props.takeSeriesTemplates.checked },
    });
  }

  deleteCheckedSeries() {
  }

  // *******************************
  addSeries() {
//    TakeSeriesTemplates.update(this.props.takeSeriesTemplates._id, {
//    }

    this.props.template.processSeries.push({
      order: 0,
      checked: false,
      series: [
        { order: 'Order', value: 0 },
        { exposure: 'Exposure', value: 1 },
        { binning: 'Binning', value: 1 },
        { frame: 'Frame', value: 'Light' },
        { filter: 'LUM', value: 0 },
        { repeat: 'Repeat', value: 1 },
      ],
    });
  }


  // *******************************
  // Get the binning from TheSkyX
  renderDropDownBinning() {
    return [
      { name: 'Static 1x1', value: 0 },
      { name: 'Static 2x2', value: 1 },
      { name: 'Static 3x3', value: 2 },
    ];
  }

  handleSeriesState = (e, { value }) => this.setTemplateProcessing({ value });
  setTemplateProcessing(x) {
     console.log('Received: ' + x.value);
     TakeSeriesTemplates.update(this.props.template._id, {
       $set: { processSeries: !this.props.template.processSeries },
     });

     this.props.template.processSeries = x.value;
     console.log('Found series: ' + this.props.template.processSeries);
  }

  render() {
    const { exposure, binning, frame, filter, repeat } = this.state

    return (
      <div>
        <Button circular icon='add' onClick={this.addSeries.bind(this)} />
        <Button circular icon='delete' onClick={this.deleteCheckedSeries.bind(this)} />
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
