import React, { Component } from 'react'
import ReactDOM from 'react-dom';
import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';

import { TargetSessions } from '../api/targetSessions.js';
import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';
import TakeSeriesTemplateEditor from './TakeSeriesTemplateEditor.js';

import { Form, Tab, Segment, Button, Radio, Input, Table, Dropdown, Checkbox, } from 'semantic-ui-react'

class TargetEditor extends Component {

  state = {
    clsFliter: '',
    focusFliter: '',
    foccusSamples: '',
    focusBin: '',
    guideExposure: '',
    guideDelay: '',
    targetSeries: {}, priority: '', minAlt: '', startTime: '', stopTime: '',
    targetImage: '', targetFindName: '', coolingTemp: '', description: '',
    name: '', value: false, openModal: false, ra: "", dec: "", angle: "",
    templates: [], template_id: '' };

  handleChange = (e, { value }) => this.setState({ checked: value });
  handleOpen = () => this.setState({ modalOpen: true })
  handleClose = () => this.setState({ modalOpen: false })

  nameChange = (e, { value }) => this.setState({ name: value });
  descriptionChange = (e, { value }) => this.setState({ description: value });
  coolingTemp = (e, { value }) => this.setState({ coolingTemp: value });
  targetFindName = (e, { value }) => this.setState({ targetFindName: value });
  targetImage = (e, { value }) => this.setState({ targetImage: value });
  startTime = (e, { value }) => this.setState({ startTime: value });
  stopTime = (e, { value }) => this.setState({ stopTime: value });
  raChange = (e, { value }) => this.setState({ ra: value });
  decChange = (e, { value }) => this.setState({ ra: value });
  angleChange = (e, { value }) => this.setState({ ra: value });
  templateChange = (e, { value }) => this.setState({ template_id: value });
  priority = (e, { value }) => this.setState({ priority: value });
  minAlt = (e, { value }) => this.setState({ minAlt: value });
  clsFliter = (e, { value }) => this.setState({ clsFliter: value });
  focusFliter = (e, { value }) => this.setState({ focusFliter: value });
  foccusSamples = (e, { value }) => this.setState({ foccusSamples: value });
  focusBin = (e, { value }) => this.setState({ focusBin: value });
  guideExposure = (e, { value }) => this.setState({ guideExposure: value });
  guideDelay = (e, { value }) => this.setState({ guideDelay: value });

  saveEntry() {
    // const name = ReactDOM.findDOMNode(this.refs.tempName.inputRef).value; //.trim();
    // const description = ReactDOM.findDOMNode(this.refs.tempDesc.inputRef).value; //.trim();
    // const processSeries = this.state.value;
    //
    TargetSessions.update(this.props.target._id, {
      $set: {
        checked: this.state.enabledActive,
        name: this.state.name,
        description: this.state.description,
        coolingTemp: this.state.coolingTemp,
        targetFindName: this.state.targetFindName,
        targetImage: this.state.targetImage,
//        targetSeries: this.stateSeries,
        ra: this.state.ra,
        dec: this.state.dec,
        angle: this.state.angle,
        startTime: this.state.startTime,
        stopTime: this.state.stopTime,
        priority: this.state.priority,
        minAlt: this.state.minAlt,
        clsFliter: this.state.clsFliter,
        focusFliter: this.state.focusFliter,
        foccusSamples: this.state.foccusSamples,
        focusBin: this.state.focusBin,
        guideExposure: this.state.guideExposure,
        guideDelay: this.state.guideDelay,
       },
    });

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
    var options = [];
    this.props.takeSeriesTemplates.map( (takeSeriesTemplate)=>{
      options.push({id: takeSeriesTemplate._id, text: takeSeriesTemplate.name} );
    });
    return options;
  }

  componentWillMount() {
    // // do not modify the state directly
    this.setState({
      checked: this.props.target.enabledActive,
      name: this.props.target.name,
      description: this.props.target.description,
      coolingTemp: this.props.target.coolingTemp,
      targetFindName: this.props.target.targetFindName,
      targetImage: this.props.target.targetImage,
      targetSeries: this.props.targetSeries,
      ra: this.props.target.ra,
      dec: this.props.target.dec,
      angle: this.props.target.angle,
      value: false,
      openModal: false,
      templates: this.getTakeSeriesTemplates(),
      startTime: this.props.target.startTime,
      stopTime: this.props.target.stopTime,
      priority: this.props.target.priority,
      minAlt: this.props.target.minAlt,
      clsFliter: this.props.target.clsFliter,
      focusFliter: this.props.target.focusFliter,
      foccusSamples: this.props.target.foccusSamples,
      focusBin: this.props.target.focusBin,
      guideExposure: this.props.target.guideExposure,
      guideDelay: this.props.target.guideDelay,
    });
  }

  render() {

    const panes = [
      { menuItem: 'Target', render: () =>
      <Tab.Pane>
        <Segment.Group>
          <Segment>
            <h3 className="ui header">Target Details</h3>
                <Input
                  label='Target Name'
                  ref='targetName'
                  placeholder='Name to search for'
                  defaultValue={this.state.targetFindName}
                  action={{ icon: 'find', content: 'Find' }}
                  actionPosition='right'
                />
                <Input
                  label='Image to load'
                  ref='imageFile'
                  action={{ icon: 'find', content: 'Find' }}
                  actionPosition='right'
                  placeholder='Filename to load on server'
                  defaultValue={this.state.targetImage}
                />
          </Segment>
          <Segment>
            <Form>
              <Form.Group widths='equal'>
                <Form.Field control={Input} label='Ra' placeholder='RA' defaultValue={this.state.ra} onChange={this.raChange}/>
                <Form.Field control={Input} label='Dec' placeholder='DEC' defaultValue={this.state.dec} onChange={this.decChange}/>
                <Form.Field control={Input} label='Angle' placeholder='Angle' defaultValue={this.state.angle} onChange={this.angleChange}/>
              </Form.Group>
            </Form>
          </Segment>
        </Segment.Group>
      </Tab.Pane> },
      { menuItem: 'Series', render: () => <Tab.Pane>
        <TakeSeriesTemplateEditor key={this.props.target._id} template={this.props.target.takeSeries} enableSaving={false}/>
      </Tab.Pane> },
      { menuItem: 'Focus', render: () => <Tab.Pane>
        <Segment.Group>
          <Segment>
            <h3 className="ui header">Focus</h3>
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
      </Tab.Pane> },
      { menuItem: 'Imaging', render: () => <Tab.Pane>
        <Segment.Group>
          <Segment>
        <h3 className="ui header">Imaging Series</h3>
        <Input
          label='Cooling temp'
          ref='cool'
          type='text'
          placeholder='Imaging temperature'
          defaultValue={this.state.coolingTemp}
        />
          <Dropdown
              floating
              label='Filter'
              className='filter'
              options={this.getTakeSeriesTemplates()}
              placeholder='Series to use for Imaging'
              text={this.state.targetSeries}
            />
          </Segment>
        </Segment.Group>
      </Tab.Pane> },
      { menuItem: 'Constraints', render: () => <Tab.Pane>
        <Segment.Group>
          <Segment>
            <h3 className="ui header">Session Constraints</h3>
                <Input
                  label='Start'
                  ref='start'
                  type='text'
                  placeholder='Start Time'
                  defaultValue={this.state.startTime}
                />
                <Input
                  label='Stop'
                  ref='stop'
                  type='text'
                  placeholder='Stop time'
                  defaultValue={this.state.stopTime}
                />
                <Input
                  label='Priority'
                  ref='priority'
                  type='text'
                  placeholder='Priority'
                  defaultValue={this.state.priority}
                />
                <Input
                  label='Minimum Altitude:'
                  ref='minAlt'
                  type='text'
                  placeholder='Minimum Altitude'
                  defaultValue={this.state.minAlt}
                />
          </Segment>
        </Segment.Group>
      </Tab.Pane> },
    ]

    return (
      <div>
        <Button  icon='save' onClick={this.saveEntry.bind(this)} />
        <Checkbox
          label='Enabled'
          toggle
          checked={this.state.checked}
          onChange={this.handleChange}
        />
        <Segment.Group>
          <Segment>
            <h3 className="ui header">Target Session</h3>
                <Input
                  label='Name'
                  ref='targetName'
                  type='text'
                  placeholder='Name for session'
                  defaultValue={this.state.name}
                />
                <Input
                  label='Description'
                  ref='targetDesc'
                  type='text'
                  placeholder='Describe the session'
                  defaultValue={this.props.target.description}
                />
              </Segment>
              </Segment.Group>
              <Tab menu={{ pointing: true }} panes={panes} />
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
