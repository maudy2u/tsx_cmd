import React, { Component } from 'react'
import ReactDOM from 'react-dom';
import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';

import { TargetSessions } from '../api/targetSessions.js';

import { Form, Button, Radio, Input, Table, Dropdown, Checkbox, } from 'semantic-ui-react'

class TargetEditor extends Component {

  state = { value: " " };
  handleChange = (e, { value }) => this.setState({ value });

  saveEntry() {
    // const name = ReactDOM.findDOMNode(this.refs.tempName.inputRef).value; //.trim();
    // const description = ReactDOM.findDOMNode(this.refs.tempDesc.inputRef).value; //.trim();
    // const processSeries = this.state.value;
    //
    // TargetSessions.update(this.props.target._id, {
    //   $set: {
    //     name: name,
    //     description: description,
    //    },
    // });

  }


  addEntry() {
    // get the current map
    // var seriesMap = this.props.target.series;
    // console.log('current series size: ' + seriesMap.length);
    // // get the end of the array
    // var append = seriesMap.length+1;
    // console.log('Increased series size to: ' + append);
    //
    // // create a new map to add
    // var newSeries = new Map();
    // newSeries.set( "order", append);
    // newSeries.set("exposure", 1 );
    // newSeries.set("binning",  1 );
    // newSeries.set("frame", 'Light' );
    // newSeries.set("filter", 0 );
    // newSeries.set("repeat", 1 );
    // newSeries.set("taken", 0);
    // // add the new map to the end, with correct order
    // seriesMap.push(newSeries);
    // // update
    // TakeSeriesTemplates.update({_id: this.props.template._id}, {
    //   $push: { 'series': seriesMap },
    // });
  }

  renderDropDownFilters() {
    return [
      { key: 'l', text: 'Static LUM', value: 'LUM' },
      { key: 'r', text: 'Static R', value: 'R' },
      { key: 'g', text: 'Static B', value: 'G' },
      { key: 'b', text: 'Static G', value: 'B' },

    ];
  }

  componentWillMount() {
    // // do not modify the state directly
    // this.setState({value: this.props.target.processSeries});
  }

  render() {

    return (
      <div>
        <Button  icon='save' onClick={this.saveEntry.bind(this)} />
        <Checkbox
          label='Completed'
          toggle
          checked={this.state.value}
          onChange={this.handleChange}
        />
        <Form>
          <Form.Field>
            <Input
              label='Name:'
              ref='targetName'
              type='text'
              placeholder='Name for session'
              defaultValue={this.props.target.name}
            />
            <Input
              label='Description:'
              ref='targetDesc'
              type='text'
              placeholder='Describe the session'
              defaultValue={this.props.target.description}
            />
          </Form.Field>
          <Form.Field>
            <Input
              label='Target Name:'
              ref='targetName'
              type='text'
              placeholder='Name to search for'
              defaultValue=''
            />
            <Button  icon='find' />
            <Input
              label='Image to load:'
              ref='imageFile'
              type='text'
              placeholder='Filename to load on server'
              defaultValue=''
            />
            <Button  icon='find' />
            <Input
              label='Ra:'
              ref='ra'
              type='text'
              defaultValue=''
            />
            <Input
              label='Dec:'
              ref='dec'
              type='text'
              defaultValue=''
            />
            <Input
              label='Angle:'
              ref='angle'
              type='text'
              defaultValue=''
            />
            <Button  icon='find' />
          </Form.Field>
          <Form.Field>
            <Input
              label='Cooling temp:'
              ref='cool'
              type='text'
              placeholder='Name for session'
              defaultValue={this.props.target.name}
            />
            <Input
              label='Focusing Temp Delta:'
              ref='tempChg'
              type='text'
              placeholder='change diff.'
              defaultValue=''
            />
            <Dropdown
                floating
                className='filter'
                options={this.renderDropDownFilters()}
                placeholder='Focusing Filter'
              />
          </Form.Field>
          <Form.Field>
            <Input
              label='Start:'
              ref='start'
              type='text'
              placeholder='Start Time'
              defaultValue=''
            />
            <Input
              label='Stop:'
              ref='stop'
              type='text'
              placeholder='Stop time'
              defaultValue=''
            />
            <Input
              label='Priority:'
              ref='priority'
              type='text'
              placeholder='Priority'
              defaultValue=''
            />
            <Input
              label='Minimum Altitude:'
              ref='minAlt'
              type='text'
              placeholder='Minimum Altitude'
              defaultValue=''
            />
          </Form.Field>

        </Form>
      </div>
    )
  }
}
/*
name: testData[i].get("name"),
targetFindName: testData[i].get("targetFindName"),
targetImage: testData[i].get("targetImage"),
description: testData[i].get("description"),
enableActive: false,
takeSeries: {},
ra: testData[i].get("ra"),
dec: testData[i].get("dec"),
angle: testData[i].get("angle"),
scale: testData[i].get("scale"),
coolingTemp: testData[i].get("coolingTemp"),
clsFliter: testData[i].get("clsFliter"),
focusFliter: testData[i].get("focusFliter"),
foccusSamples: testData[i].get("foccusSamples"),
focusBin: testData[i].get("focusBin"),
guideExposure: testData[i].get("guideExposure"),
guideDelay: testData[i].get("guideDelay"),
startTime: testData[i].get("startTime"),
stopTime: testData[i].get("stopTime"),
priority: testData[i].get("priority"),
tempChg: testData[i].get("tempChg"),
minAlt: testData[i].get("minAlt"),
completed: testData[i].get("completed"),

*/

export default withTracker(() => {
    return {
      targets: TargetSessions.find({}, { sort: { name: 1 } }).fetch(),
  };
})(TargetEditor);

/*
<strong>onChange:</strong>
<pre>{JSON.stringify({ name, email }, null, 2)}</pre>
<strong>onSubmit:</strong>
<pre>{JSON.stringify({ submittedName, submittedEmail }, null, 2)}</pre>
*/
