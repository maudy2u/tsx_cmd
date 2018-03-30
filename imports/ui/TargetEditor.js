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
    enabledActive: false,
    name: '',
    targetImage: '',
    targetFindName: '',
    description: '',
    seriesTemplate: {},
    ra: "",
    dec: "",
    angle: "",
    priority: '',
    clsFliter: '',
    focusFliter: '',
    foccusSamples: '',
    focusBin: '',
    guideExposure: '',
    guideDelay: '',
    minAlt: '',
    startTime: '',
    stopTime: '',
    coolingTemp: '',
    value: false,
    openModal: false,
    templates: [],
    checked: false,
    template_id: '',
    tempChg: '',
  };

  handleOpen = () => this.setState({ modalOpen: true })
  handleClose = () => this.setState({ modalOpen: false })

  nameChange = (e, { value }) => this.setState({ name: value.trim() });
  descriptionChange = (e, { value }) => this.setState({ description: value.trim() });
  coolingTempChange = (e, { value }) => this.setState({ coolingTemp: value });
  targetFindNameChange = (e, { value }) => this.setState({ targetFindName: value.trim() });
  targetImageChange = (e, { value }) => this.setState({ targetImage: value.trim() });
  startTimeChange = (e, { value }) => this.setState({ startTime: value });
  stopTimeChange = (e, { value }) => this.setState({ stopTime: value });
  raChange = (e, { value }) => this.setState({ ra: value });
  decChange = (e, { value }) => this.setState({ ra: value });
  angleChange = (e, { value }) => this.setState({ ra: value });
  seriesTemplateChange = (e, { value }) => this.setState({ seriesTemplate: value });
  priorityChange = (e, { value }) => this.setState({ priority: value });
  minAltChange = (e, { value }) => this.setState({ minAlt: value });
  clsFliterChange = (e, { value }) => this.setState({ clsFliter: value });
  focusFliterChange = (e, { value }) => this.setState({ focusFliter: value });
  foccusSamplesChange = (e, { value }) => this.setState({ foccusSamples: value });
  focusBinChange = (e, { value }) => this.setState({ focusBin: value });
  guideExposureChange = (e, { value }) => this.setState({ guideExposure: value });
  guideDelayChange = (e, { value }) => this.setState({ guideDelay: value });
  tempChgChange = (e, { value }) => this.setState({ tempChg: value });

  onChangeChecked() {
    this.setState({enabledActive: !this.state.enabledActive});
  }

  componentWillMount() {
    // // do not modify the state directly
    this.setState({
      enabledActive: this.props.target.enabledActive,
      name: this.props.target.name,
      description: this.props.target.description,
      coolingTemp: this.props.target.coolingTemp,
      targetFindName: this.props.target.targetFindName,
      targetImage: this.props.target.targetImage,
      seriesTemplate: this.props.target.series,
      ra: this.props.target.ra,
      dec: this.props.target.dec,
      angle: this.props.target.angle,
      value: false,
      openModal: false,
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
      tempChg: this.props.target.tempChg,
    });
  }

  saveEntry() {
    TargetSessions.update(this.props.target._id, {
      $set: {
        enabledActive: this.state.enabledActive,
        name: this.state.name,
        description: this.state.description,
        coolingTemp: this.state.coolingTemp,
        targetFindName: this.state.targetFindName,
        targetImage: this.state.targetImage,
        series: this.state.seriesTemplate,
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
    const topPosts = TakeSeriesTemplates.find({}, { sort: { name: -1 } });

    var count =0;
    topPosts.forEach((series) => {
      //      { key: 0, text: 'Static LUM', value: 0 },
      options.push({key:series._id, text:series.name, value: count});
      count++;
      console.log(`Found series._id: ${series._id}, name: ${series.text}`);
    });
    return options;
  }

  render() {

    // *******************************
    // this is not the render return... scroll down...
    const panes = [
      { menuItem: 'Target', render: () =>
      <Tab.Pane>
        <Segment.Group>
          <Segment>
            <h3 className="ui header">Target Details</h3>
            <Form>
              <Form.Group widths='equal'>
                <Form.Field control={Input}
                  label='Ra'
                  placeholder='RA'
                  defaultValue={this.state.ra}
                  onChange={this.raChange}/>
                <Form.Field control={Input}
                  label='Dec'
                  placeholder='DEC'
                  defaultValue={this.state.dec}
                  onChange={this.decChange}/>
                <Form.Field control={Input}
                  label='Angle'
                  placeholder='Angle'
                  defaultValue={this.state.angle}
                  onChange={this.angleChange}/>
              </Form.Group>
            </Form>
        </Segment>
        <Segment>
          <Input
            label='Target Name'
            placeholder='Name to search for'
            defaultValue={this.state.targetFindName}
            action={{ icon: 'find', content: 'Find' }}
            onChange={this.targetFindNameChange}
          />
        </Segment>
        <Segment>
          <Input
            label='Image to load'
            action={{ icon: 'find', content: 'Find' }}
            placeholder='Filename to load on server'
            defaultValue={this.state.targetImage}
            onChange={this.targetImageChange}
          />
        </Segment>
      </Segment.Group>
    </Tab.Pane> },

      { menuItem: 'Session', render: () =>
      <Tab.Pane>
        <Segment.Group>
          <Segment>
            <h3 className="ui header">Session Constraints</h3>
            <Dropdown
                floating
                label='Series'
                options={this.getTakeSeriesTemplates()}
                placeholder='Series to use for Imaging'
                text={this.state.seriesTemplate.text}
                onChange={this.seriesTemplateChange}
              />
          </Segment>
          <Segment>
            <Input
              label='Start'
              type='text'
              placeholder='Start Time'
              defaultValue={this.state.startTime}
              onChange={this.startTimeChange}
            />
          </Segment>
          <Segment>
            <Input
              label='Stop'
              type='text'
              placeholder='Stop time'
              defaultValue={this.state.stopTime}
              onChange={this.stopTimeChange}
            />
          </Segment>
          <Segment>
            <Input
              label='Priority'
              type='text'
              placeholder='Priority'
              defaultValue={this.state.priority}
              onChange={this.priorityChange}
            />
          </Segment>
          <Segment>
            <Input
              label='Minimum Altitude:'
              type='text'
              placeholder='Minimum Altitude'
              defaultValue={this.state.minAlt}
              onChange={this.minAltChange}
            />
          </Segment>
        </Segment.Group>

      </Tab.Pane> },

      { menuItem: 'Focus', render: () =>
      <Tab.Pane>
          <Segment>
            <h3 className="ui header">Focus</h3>
              <Input
                label='Focusing Temp Delta'
                type='text'
                placeholder='change diff.'
                defaultValue={this.props.target.tempChg}
                onChange={this.tempChgChange}
              />
          </Segment>
          <Segment>
            <Dropdown
                floating
                label='Filter'
                options={this.renderDropDownFilters()}
                placeholder='Filter for focusing'
                selection={this.state.focusFilter}
                onChange={this.focusFilterChange}
              />
          </Segment>
      </Tab.Pane> },

      { menuItem: 'Imaging', render: () =>
      <Tab.Pane>
          <Segment>
            <h3 className="ui header">Imaging Series</h3>
            <Input
              label='Cooling temp'
              placeholder='Imaging temperature'
              defaultValue={this.state.coolingTemp}
              onChange={this.coolingTempChange}
            />
          </Segment>
      </Tab.Pane> },
    ]

    return (
      <div>
        <Button  icon='save' onClick={this.saveEntry.bind(this)} />
        <Checkbox
          label='Enabled'
          className='enabledActive'
          toggle
          checked={this.state.enabledActive}
          onChange={this.onChangeChecked.bind(this)}
        />
        <Segment.Group>
          <Segment>
            <h3 className="ui header">Target Session</h3>
            <Form>
              <Form.Group widths='equal'>
                <Form.Field control={Input}
                  label='Name'
                  className='name'
                  placeholder='Name for session'
                  defaultValue={this.state.name}
                  onChange={this.nameChange}/>
                <Form.Field control={Input}
                  className='description'
                  label='Description'
                  placeholder='Describe the session'
                  defaultValue={this.state.description}
                  onChange={this.descriptionChange}/>
              </Form.Group>
            </Form>
          </Segment>
        </Segment.Group>
      <Tab menu={{ pointing: true }} renderActiveOnly={true} panes={panes} />
    </div>
    )
  }
}

export default withTracker(() => {
    return {
      targets1: TargetSessions.find({}, { sort: { name: 1 } }).fetch(),
      takeSeriesTemplates1: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
  };
})(TargetEditor);
