import React, { Component } from 'react'
import ReactDOM from 'react-dom';
import { withTracker } from 'meteor/react-meteor-data';

import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';

import { Form, Button, Radio, Input, Table, } from 'semantic-ui-react'

import TakeSeriesEditor from './TakeSeriesEditor.js';

class TakeSeriesTemplateEditor extends Component {

  state = { value: " " };
  handleChange = (e, { value }) => this.setState({ value });

  saveEntry() {
    const name = ReactDOM.findDOMNode(this.refs.tempName.inputRef).value; //.trim();
    const description = ReactDOM.findDOMNode(this.refs.tempDesc.inputRef).value; //.trim();
    const processSeries = this.state.value;

    TakeSeriesTemplates.update(this.props.template._id, {
      $set: {
        name: name,
        description: description,
        processSeries: processSeries,
       },
    });

  }

  ComponentWillMount() {
    // do not modify the state directly
    this.setState({value: this.props.template.processSeries});
  }

  render() {

    return (
      <div>
        <Button  icon='save' onClick={this.saveEntry.bind(this)} />
        <Button  icon='add'  />
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
              defaultValue={this.props.template.description}
            />
          </Form.Field>
          <Form.Field>
            Repeat executes: <b>{this.state.value}</b>
          </Form.Field>
          <Form.Field>
            <Radio
              label='Per series'
              name='seriesRadioGroup'
              value='per series'
              checked={this.state.value === "per series"}
              onChange={this.handleChange}
            />
          </Form.Field>
          <Form.Field>
            <Radio
              label='Across series'
              name='seriesRadioGroup'
              value='across series'
              checked={this.state.value === "across series"}
              onChange={this.handleChange}
            />
          </Form.Field>
          <Form.Field>
            <Radio
              label='Repeat series'
              name='seriesRadioGroup'
              value='repeat'
              checked={this.state.value === "repeat"}
              onChange={this.handleChange}
            />
          </Form.Field>
        </Form>
        <Table fixed celled selectable>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell width={1}>Exposure</Table.HeaderCell>
                <Table.HeaderCell width={3}>Frame</Table.HeaderCell>
                <Table.HeaderCell width={3}>Filter</Table.HeaderCell>
                <Table.HeaderCell width={1}>Repeat</Table.HeaderCell>
                <Table.HeaderCell width={1}>Binning</Table.HeaderCell>
                <Table.HeaderCell width={1}></Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {this.props.template.series.map( (definedSeries)=>{
                 return  <TakeSeriesEditor key={definedSeries._id} definedSeries={definedSeries} />
              })}
            </Table.Body>
          </Table>
      </div>
    )
  }
}
export default withTracker(() => {
    return {
      takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
  };
})(TakeSeriesTemplateEditor);

/*
<strong>onChange:</strong>
<pre>{JSON.stringify({ name, email }, null, 2)}</pre>
<strong>onSubmit:</strong>
<pre>{JSON.stringify({ submittedName, submittedEmail }, null, 2)}</pre>
*/
