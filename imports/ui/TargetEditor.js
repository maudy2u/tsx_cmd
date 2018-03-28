import React, { Component } from 'react'
import ReactDOM from 'react-dom';
import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';

import { TargetSessions } from '../api/targetSessions.js';
import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';

import { Form, Segment, Button, Radio, Input, Table, Dropdown, Checkbox, } from 'semantic-ui-react'

class TargetEditor extends Component {

  state = { value: false, openModal: false };
  handleChange = (e, { value }) => this.setState({ checked: value });
  handleOpen = () => this.setState({ modalOpen: true })
  handleClose = () => this.setState({ modalOpen: false })

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

  getTakeSeriesTemplates() {

  }

  componentWillMount() {
    // // do not modify the state directly
    this.setState({checked: this.props.target.enabledActive});
  }

  render() {

    return (
      <div>
        <Button  icon='save' onClick={this.saveEntry.bind(this)} />
        <Checkbox
          label='Enabled'
          toggle
          checked={this.state.checked}
          onChange={this.handleChange}
        />
        <h3 className="ui header">Target Details</h3>
        <Segment.Group>
          <Segment>
                <Input
                  label='Name'
                  ref='targetName'
                  type='text'
                  placeholder='Name for session'
                  defaultValue={this.props.target.name}
                />
                <Input
                  label='Description'
                  ref='targetDesc'
                  type='text'
                  placeholder='Describe the session'
                  defaultValue={this.props.target.description}
                />
                <Dropdown
                    floating
                    label='Filter'
                    className='filter'
                    options={this.getTakeSeriesTemplates()}
                    placeholder='Filter for focusing'
                  />
          </Segment>
          <Segment>
                <Input
                  label='Target Name'
                  ref='targetName'
                  placeholder='Name to search for'
                  defaultValue={this.props.target.targetFindName}
                  action={{ icon: 'find', content: 'Find' }}
                  actionPosition='right'
                />
                <Input
                  label='Image to load'
                  ref='imageFile'
                  action={{ icon: 'find', content: 'Find' }}
                  actionPosition='right'
                  placeholder='Filename to load on server'
                  defaultValue={this.props.target.targetImage}
                />
          </Segment>
          <Segment>
            <Form>
              <Form.Group widths='equal'>
                <Form.Field control={Input} label='Ra' ref='ra' placeholder='RA' defaultValue={this.props.target.ra}/>
                <Form.Field control={Input} label='Dec' ref='dec' placeholder='DEC' defaultValue={this.props.target.dec}/>
                <Form.Field control={Input} label='Angle' ref='angle' placeholder='Angle' defaultValue={this.props.target.angle}/>
              </Form.Group>
            </Form>
          </Segment>
        </Segment.Group>
        <h3 className="ui header">Focus</h3>
        <Segment.Group>
          <Segment>
              <Input
                label='Cooling temp'
                ref='cool'
                type='text'
                placeholder='Imaging temperature'
                defaultValue={this.props.target.coolingTemp}
              />
              <Input
                label='Focusing Temp Delta'
                ref='tempChg'
                type='text'
                placeholder='change diff.'
                defaultValue={this.props.target.tempChg}
              />
              <Dropdown
                  floating
                  label='Filter'
                  className='filter'
                  options={this.renderDropDownFilters()}
                  placeholder='Filter for focusing'
                />
          </Segment>
        </Segment.Group>
        <h3 className="ui header">Session Constraints</h3>
        <Segment.Group>
          <Segment>
                <Input
                  label='Start'
                  ref='start'
                  type='text'
                  placeholder='Start Time'
                  defaultValue={this.props.target.startTime}
                />
                <Input
                  label='Stop'
                  ref='stop'
                  type='text'
                  placeholder='Stop time'
                  defaultValue={this.props.target.stopTime}
                />
                <Input
                  label='Priority'
                  ref='priority'
                  type='text'
                  placeholder='Priority'
                  defaultValue={this.props.target.priority}
                />
                <Input
                  label='Minimum Altitude:'
                  ref='minAlt'
                  type='text'
                  placeholder='Minimum Altitude'
                  defaultValue={this.props.target.minAlt}
                />
          </Segment>
        </Segment.Group>
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
      takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),

  };
})(TargetEditor);

/*
<strong>onChange:</strong>
<pre>{JSON.stringify({ name, email }, null, 2)}</pre>
<strong>onSubmit:</strong>
<pre>{JSON.stringify({ submittedName, submittedEmail }, null, 2)}</pre>
*/
