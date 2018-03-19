import React, { Component } from 'react'
import { Form } from 'semantic-ui-react'

class EditorSeriesForm extends Component {
  // *******************************
  state = { exposure: '', binning: '', frame: '', filter: '', repeat: '' }

  // *******************************
  handleChange = (e, { name, value }) => this.setState({ [name]: value })


  // *******************************
  handleSubmit = () => {
    const { exposure, binning, frame, filter, repeat } = this.state
    this.setState({ submittedExposure: exposure, submittedBinning: binning, submittedFrame: frame, submittedFilter: filter, submittedRpeat: repeat })
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
    const { exposure, binning, frame, filter, repeat } = this.state

    return (
      <div>
        <Form>
          <Form.Button circular icon='save'ref="saveSeries" onClick={this.handleSubmit} />
          <Form.Group>
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
            </tbody>
          </table>
        </Form.Group>
        </Form>
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
export default EditorSeriesForm
