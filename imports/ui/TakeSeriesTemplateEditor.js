import React, { Component } from 'react'
import ReactDOM from 'react-dom';
// import {mount} from 'react-mounter';

import { withTracker } from 'meteor/react-meteor-data';

import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';
import { Seriess } from '../api/seriess.js';

import { Form, Grid, Item, Button, Radio, Input, Table, } from 'semantic-ui-react'

import TakeSeriesEditor from './TakeSeriesEditor.js';

class TakeSeriesTemplateEditor extends Component {

  state = {
    name: '',
    description: '',
    seriesProcess: "",
    seriesContainer: [],
    repeatSeries: false,
    defaultDithering: 1,
  };

  nameChange = (e, { value }) => this.setState({ name: value });
  descriptionChange = (e, { value }) => this.setState({ description: value });
  seriesProcessChange = (e, { value }) => this.setState({ seriesProcess: value });
  updateSeriesContainer = (e, { value }) => this.setState({ seriesContainer: value });

  onChangeChecked() {
    this.setState({repeatSeries: !this.state.repeatSeries});
  }

  nameChange = (e, { value }) => this.setState({ name: value });

  componentWillMount() {
    // do not modify the state directly
    this.setState({name: this.props.template.name});
    this.setState({description: this.props.template.defaultDithering});
    this.setState({description: this.props.template.description});
    this.setState({seriesProcess: this.props.template.processSeries});
    this.setState({seriesContainer: this.props.template.series});
    this.setState({repeatSeries: this.props.template.repeatSeries});
  }

  saveEntry() {
    TakeSeriesTemplates.update(this.props.template._id, {
      $set: {
        name: this.state.name,
        description: this.state.description,
        processSeries: this.state.seriesProcess,
        repeatSeries: this.state.repeatSeries,
        defaultDithering: this.state.defaultDithering,
       },
    });
  }

  addEntry() {
    // get the current map
    var tid = this.props.template._id;
    var order = this.props.template.series.length;

    const sid = Seriess.insert(
      {
        order: order,
        exposure: 1,
        binning: 1,
        frame: '',
        filter: '',
        repeat: 1,
      }
    );

    TakeSeriesTemplates.update({_id: tid}, {
      $push: { 'series': {id: sid} }
    });
  }


  render() {

    var a = this.props.template.series;

    return (
      <div>
        <Button  icon='save' onClick={this.saveEntry.bind(this)} />
        <Button  icon='add' onClick={this.addEntry.bind(this)} />
        <Form>
          <Form.Group widths='equal'>
          <Form.Field>
            <Input
              label='Name:'
              type='text'
              placeholder='Name for the series'
              defaultValue={this.state.name}
              onChange={this.nameChange}
            />
          </Form.Field>
          <Form.Field>
            <Input
              label='Description:'
              type='text'
              placeholder='Describe the series'
              defaultValue={this.state.description}
              onChange={this.descriptionChange}
            />
          </Form.Field>
        </Form.Group>
        <h3 className="ui header">Images executes: </h3>
          <Form.Group inline>
            <Form.Field control={Radio} label='Per series' value='per series' checked={this.state.seriesProcess === "per series"} onChange={this.seriesProcessChange} />
            <Form.Field control={Radio} label='Across series' value='across series' checked={this.state.seriesProcess === "across series"} onChange={this.seriesProcessChange} />
            <Form.Checkbox
              label=' Repeat series until stopped '
              toggle
              name='repeatSeries'
              checked={this.state.repeatSeries}
              onChange={this.onChangeChecked}
            />
            {/* <Form.Checkbox onChange={this.seriesProcessChange} /> */}
            <Form.Input
              label='Dither after: '
              name='defaultDithering'
              placeholder='Images before dither'
              value={this.state.defaultDithering}
              onChange={this.handleChange}
            />
          </Form.Group>
        </Form>
        <Grid columns={6} centered divided='vertically'>
          <Grid.Row >
            <Grid.Column width={1}/>
            <Grid.Column>
            <b>Exposure</b>
            </Grid.Column>
            <Grid.Column>
            <b>Frame</b>
            </Grid.Column>
            <Grid.Column>
            <b>Filter</b>
            </Grid.Column>
            <Grid.Column>
            <b>Repeat</b>
            </Grid.Column>
            <Grid.Column>
            <b>Bin</b>
            </Grid.Column>
            <Grid.Column>
            <b>Order</b>
            </Grid.Column>
          </Grid.Row>
          {// this.props.template.series.. this is a series ID
            this.props.template.series.map( (definedSeries)=>{
             return  <TakeSeriesEditor key={definedSeries.id} template={this.props.template} series_id={definedSeries} />
          })}
        </Grid>
      </div>
    )
  }
}
export default withTracker(() => {
  //{}, { sort: { name: 1 } }
    return {
      seriess: Seriess.find({}, { sort: { order: 1 } }).fetch(),
      templates: TakeSeriesTemplates.find({} ).fetch(),
  };
})(TakeSeriesTemplateEditor);

/*
<strong>onChange:</strong>
<pre>{JSON.stringify({ name, email }, null, 2)}</pre>
<strong>onSubmit:</strong>
<pre>{JSON.stringify({ submittedName, submittedEmail }, null, 2)}</pre>
*/
