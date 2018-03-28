import React, { Component } from 'react'
import ReactDOM from 'react-dom';
import {mount} from 'react-mounter';

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


  addEntry() {
    // get the current map
    var seriesMap = this.props.template.series;
    console.log('current series size: ' + seriesMap.length);
    // get the end of the array
    var append = seriesMap.length+1;
    console.log('Increased series size to: ' + append);

    // create a new map to add
    var newSeries = new Map();
    newSeries.set( "order", append);
    newSeries.set("exposure", 1 );
    newSeries.set("binning",  1 );
    newSeries.set("frame", 'Light' );
    newSeries.set("filter", 0 );
    newSeries.set("repeat", 1 );
    newSeries.set("taken", 0);
    // add the new map to the end, with correct order
    seriesMap.push(newSeries);
    // update
    TakeSeriesTemplates.update({_id: this.props.template._id}, {
      $push: { 'series': seriesMap },
    });
  }


  componentWillMount() {
    // do not modify the state directly
    this.setState({value: this.props.template.processSeries});
  }

  render() {

    return (
      <div>
        <Button  icon='save' onClick={this.saveEntry.bind(this)} />
        <Button  icon='add' onClick={this.addEntry.bind(this)} />
        <Form>
          <Form.Group widths='equal'>
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
        </Form.Group>

          <Form.Group inline>
            <h3 className="ui header">Repeat executes: <b>{this.state.value}</b></h3>
          <Form.Field control={Radio} label='Per series' value='per series' checked={this.state.value === "per series"} onChange={this.handleChange} />
          <Form.Field control={Radio} label='Across series' value='across series' checked={this.state.value === "across series"} onChange={this.handleChange} />
          <Form.Field control={Radio} label='Repeat series' value='repeat' checked={this.state.value === "repeat"} onChange={this.handleChange} />
        </Form.Group>
        </Form>
        <Table celled padded selectable>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell width={1}>Exposure</Table.HeaderCell>
                <Table.HeaderCell width={1}>Frame</Table.HeaderCell>
                <Table.HeaderCell width={1}>Filter</Table.HeaderCell>
                <Table.HeaderCell width={1}>Repeat</Table.HeaderCell>
                <Table.HeaderCell width={1}>Binning</Table.HeaderCell>
                <Table.HeaderCell width={1}></Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {this.props.template.series.map( (definedSeries)=>{
                 return  <TakeSeriesEditor key={definedSeries.order} template={this.props.template} definedSeries={definedSeries} />
              })}
            </Table.Body>
          </Table>
      </div>
    )
  }
}
export default withTracker(() => {
  //{}, { sort: { name: 1 } }
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
