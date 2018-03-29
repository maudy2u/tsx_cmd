import React, { Component } from 'react'
import ReactDOM from 'react-dom';
import {mount} from 'react-mounter';

import { withTracker } from 'meteor/react-meteor-data';

import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';

import { Form, Grid, Item, Button, Radio, Input, Table, } from 'semantic-ui-react'

import TakeSeriesEditor from './TakeSeriesEditor.js';

class TakeSeriesTemplateEditor extends Component {

  state = { name: '',
    description: '',
    seriesProcess: "", seriesContainer: [],
  };

  nameChange = (e, { value }) => this.setState({ name: value });
  descriptionChange = (e, { value }) => this.setState({ description: value });
  seriesProcessChange = (e, { value }) => this.setState({ seriesProcess: value });
  updateSeriesContainer = (e, { value }) => this.setState({ seriesContainer: value });

  componentWillMount() {
    // do not modify the state directly
    this.setState({name: this.props.template.name});
    this.setState({description: this.props.template.description});
    this.setState({seriesProcess: this.props.template.processSeries});
    this.setState({seriesContainer: this.props.template.series});
  }

  saveEntry() {
    if( this.props.targetEditor == false ) {
      const name = ReactDOM.findDOMNode(this.refs.tempName.inputRef).value; //.trim();
      const description = ReactDOM.findDOMNode(this.refs.tempDesc.inputRef).value; //.trim();
      const processSeries = this.state.seriesProcess;

      TakeSeriesTemplates.update(this.props.template._id, {
        $set: {
          name: name,
          description: description,
          processSeries: processSeries,
         },
      });
    }
  }

  addEntry() {
    if( this.props.targetEditor == false ) {

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
  }


  saveTemplateEditor() {
    if( this.props.enableSaving == true ) {
      return (
        <Button  icon='save' onClick={this.saveEntry.bind(this)} />
      )
    }
  }

  render() {

    return (
      <div>
        {this.saveTemplateEditor()}
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
            <Form.Field control={Radio} label='Repeat series' value='repeat' checked={this.state.seriesProcess === "repeat"} onChange={this.seriesProcessChange} />
          </Form.Group>
        </Form>
        <Grid columns={6} centered divided='vertically'>
          <Grid.Row >
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
            <b>Tools</b>
            </Grid.Column>
          </Grid.Row>
          {this.props.template.series.map( (definedSeries)=>{
             return  <TakeSeriesEditor key={definedSeries.order} template={this.props.template} definedSeries={definedSeries} />
          })}
        </Grid>
        {/* <Table divided>
          <Table.Body>
            {this.props.template.series.map( (definedSeries)=>{
               return  <TakeSeriesEditor key={definedSeries.order} template={this.props.template} definedSeries={definedSeries} />
            })}
          </Table.Body>
        </Table> */}
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
