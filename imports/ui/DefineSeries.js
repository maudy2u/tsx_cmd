import React, { Component } from 'react'
import { Form } from 'semantic-ui-react'
import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';

export default class DefineSeries extends Component {
  // *******************************
  // Get the filters from TheSkyX
  renderDropDownFilters() {
    return [
      { key: 'l', text: 'Static LUM', value: 'LUM' },
      { key: 'r', text: 'Static R', value: 'R' },
      { key: 'g', text: 'Static B', value: 'G' },
      { key: 'b', text: 'Static G', value: 'B' },

    ];
  }

  // *******************************
  // This is used to populate drop down frame lists
  renderDropDownFrames() {
    return [
      { key: 'l', text: 'Light', value: 'light' },
      { key: 'f', text: 'Flat', value: 'flat' },
      { key: 'd', text: 'Dark', value: 'dark' },
      { key: 'b', text: 'Bias', value: 'bias' },
    ];
  }

  render() {
    return (
      <tr>
        <td></td>
        <td>
          <Form.Input ref="exposure" placeholder='Exposure' name='exposure' value={exposure} onChange={this.handleChange} />
        </td>
        <td>
          <Form.Input ref="binning" placeholder='Binning' name='binning' value={binning} onChange={this.handleChange} />
        </td>
        <td>
          <Form.Select fluid ref="frame" label='Frame' options={this.renderDropDownFrames()} placeholder='Light' />
        </td>
        <td>
          <Form.Select fluid ref="filter" label='Filter' options={this.renderDropDownFilters()} placeholder='Filter' />
        </td>
        <td>
          <Form.Input ref="repeat" placeholder='Repeat' name='repeat' value={repeat} onChange={this.handleChange} />
        </td>
      </tr>
    )
  }

}
