import React, { Component } from 'react'
import { Form } from 'semantic-ui-react'

class EditorSeriesForm extends Component {
  state = { exposure: '', binning: '', frame: '', filter: '', repeat: '' }

  handleChange = (e, { name, value }) => this.setState({ [name]: value })


//  handleSubmit = () => this.setState({ email: '', name: '' })
  handleSubmit = () => {
    const { exposure, binning, frame, filter, repeat } = this.state
    this.setState({ submittedExposure: exposure, submittedBinning: binning, submittedFrame: frame, submittedFilter: filter, submittedRpeat: repeat })
  }

  renderDropDownBinning() {
    // Get the binning from TheSkyX
    return [
      { name: 'Static 1x1', value: 0 },
      { name: 'Static 2x2', value: 1 },
      { name: 'Static 3x3', value: 2 },
    ];
  }

  renderDropDownFilters() {
    // Get the filters from TheSkyX
    return [
      { name: 'Static Lum', value: 0 },
      { name: 'Static R', value: 1 },
      { name: 'Static G', value: 2 },
    ];
  }


  // *******************************
  // This is used to populate drop down frame lists
  renderDropDownFrames() {
    return [
      { type: 'Light', value: 0 },
      { type: 'Dark', value: 1 },
      { type: 'Flat', value: 2 },
      { type: 'Bias', value: 2 },
    ];
  }

  render() {
    const { name, email, submittedName, submittedEmail } = this.state

    return (
      <div>
        <Form onSubmit={this.handleSubmit}>
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
                  <Form.Input placeholder='Exposure' name='exposure' value={exposure} onChange={this.handleChange} />
                </td>
                <td>
                  <Form.Input placeholder='Binning' name='binning' value={binning} onChange={this.handleChange} />
                </td>
                <td>
                  <Form.Field control={Dropdown} placeholder='Frame' fluid selection options={this.renderDropDownFrames()} />
                </td>
                <td>
                  <Form.Field control={Dropdown} placeholder='Filter' fluid selection options={this.renderDropDownFilters()} />
                </td>
                <td>
                  <Form.Input placeholder='Repeat' name='repeat' value={repeat} onChange={this.handleChange} />
                </td>
              </tr>
            </tbody>
          </table>
          <Form.Button content='Add' />
        </Form.Group>
        </Form>
        <strong>onChange:</strong>
        <pre>{JSON.stringify({ name, email }, null, 2)}</pre>
        <strong>onSubmit:</strong>
        <pre>{JSON.stringify({ submittedName, submittedEmail }, null, 2)}</pre>
      </div>
    )
  }
}

export default EditorSeriesForm
