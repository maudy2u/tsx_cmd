import React, { Component } from 'react'
import ReactDOM from 'react-dom';
// import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';

import { Seriess } from '../api/seriess.js';
import { TargetSessions } from '../api/targetSessions.js';
import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';
import TakeSeriesTemplateEditor from './TakeSeriesTemplateEditor.js';

import { Form, Label, Tab, Segment, Button, Radio, Input, Table, Dropdown, Checkbox, } from 'semantic-ui-react';

import Timekeeper from 'react-timekeeper';
import ReactSimpleRange from 'react-simple-range';

class TargetEditor extends Component {

  state = {
    enabledActive: false,   // whether the target is active or not
    name: '',               // name of the target
    targetImage: '',        // image file name of the target - future
    targetFindName: '',     // Name to look up in TheSkyX
    description: '',        // SOmething to say
    seriesTemplate: {},     // The take series to use
    ra: "",                 // Target RA
    dec: "",                // Target DEC
    angle: "",
    priority: 10,           // Priority: 1 is highest
    clsFilter: '',
    focusFilter: {},
    foccusSamples: '',
    focusBin: '',
    guideExposure: '',
    guideDelay: '',
    minAlt: 29.5,
    startTime: '20:00',
    stopTime: '06:00',
    coolingTemp: -19,
    coolingTime: 5,
    value: false,
    openModal: false,
    templates: [],
    checked: false,
    template_id: '',
    tempChg: 0.7,
    filterDropDown:[],
    seriesDropDown:[],
  };

  handleOpen = () => this.setState({ modalOpen: true });
  handleClose = () => this.setState({ modalOpen: false });
  handleChange = (e, { name, value }) => this.setState({ [name]: value });

  handleStartChange = ( value ) => this.setState({startTime: value.formatted24 });
  handleStopChange = ( value ) => this.setState({stopTime: value.formatted24 });
  handlePriorityChange = ( value ) => this.setState({priority: value.value });
  handleCoolingTempChange = ( value ) => this.setState({coolingTemp: value.value });
  handleCoolingTimeChange = ( value ) => this.setState({coolingTime: value.value });
  handleFocusTempChange = ( value ) => this.setState({tempChg: value.value });
  handleMinAltChange = ( value ) => this.setState({minAlt: value.value });

  onChangeChecked() {
    this.setState({enabledActive: !this.state.enabledActive});
  }

  componentWillMount() {
    // NEED TO UPDATE THE NAME GIVEN TO THE SERIES...
    // var series = this.props.target.series;
    // if( series != 'undefined') {
    //   var update = TakeSeriesTemplates.findOne({_id: series._id});
    //
    //   var item = update.series;
    //   for (var i = 0; i < item.length; i++) {
    //     var a = item[i];
    //     var image = Seriess.findOne({_id:item[i].id}); //.fetch();
    //     totalTakenImages += image.taken;
    //     totalPlannedImages += image.repeat;
    //   }
    //
    //   series.text = update.name;
    //   this.props.target.series = series;
    // }

    // // do not modify the state directly
    this.setState({
      enabledActive: this.props.target.enabledActive,
      name: this.props.target.name,
      description: this.props.target.description,
      coolingTemp: this.props.target.coolingTemp,
      targetFindName: this.props.target.targetFindName,
      targetImage: this.props.target.targetImage,
      seriesTemplate: this.props.target.series.text,
      seriesDropDown: this.getTakeSeriesTemplates(),
      ra: this.props.target.ra,
      dec: this.props.target.dec,
      angle: this.props.target.angle,
      value: false,
      openModal: false,
      priority: this.props.target.priority,
      minAlt: this.props.target.minAlt,
      startTime: this.props.target.startTime,
      stopTime: this.props.target.stopTime,
      clsFilter: this.props.target.clsFilter,
      focusFilter: this.props.target.focusFilter,
      filterDropDown: this.renderDropDownFilters(),
      foccusSamples: this.props.target.foccusSamples,
      focusBin: this.props.target.focusBin,
      guideExposure: this.props.target.guideExposure,
      guideDelay: this.props.target.guideDelay,
      tempChg: this.props.target.tempChg,
    });
  }

  saveEntry() {

    var d = new Date();
    var n = d.getHours();
    var n = d.getMinutes();

    // what is needed for the "dropdown values"
    // series needs an "ID", and so include text value
    var series = this.state.seriesTemplate; // name in the field

    // filter needs an index and text value...
    var seriesId; // get the matching key value
    for (var i = 0; i < this.state.seriesDropDown.length; i++) {
      if( series == this.state.seriesDropDown[i].value ) {
        seriesId = this.state.seriesDropDown[i].key;
      }
    }

    var filter = this.state.focusFilter;
    TargetSessions.update(this.props.target._id, {
      $set: {
        enabledActive: this.state.enabledActive,
        name: this.state.name,
        description: this.state.description,
        coolingTemp: this.state.coolingTemp,
        targetFindName: this.state.targetFindName,
        targetImage: this.state.targetImage,
        series: {
          _id: seriesId,
          text: this.state.seriesTemplate,
        },
        ra: this.state.ra,
        dec: this.state.dec,
        angle: this.state.angle,
        startTime: this.state.startTime,
        stopTime: this.state.stopTime,
        priority: this.state.priority,
        minAlt: this.state.minAlt,
        clsFilter: this.state.clsFilter,
        focusFilter: this.state.focusFilter,
        foccusSamples: this.state.foccusSamples,
        focusBin: this.state.focusBin,
        guideExposure: this.state.guideExposure,
        guideDelay: this.state.guideDelay,
       },
    });
  }

  renderDropDownFilters() {
    var filters = [
      { key: 'Static LUM', text: 'Static LUM', value: 'Static LUM'},
      { key: 'Static R', text: 'Static R', value: 'Static R' },
      { key: 'Static G', text: 'Static G', value: 'Static G' },
      { key: 'Static B', text: 'Static B', value: 'Static B' },
    ];
    return filters;
  }

  // Get all the current values from the TaeSeriesTemplate collections
  getTakeSeriesTemplates() {
    var options = [];
    const topPosts = TakeSeriesTemplates.find({}, { sort: { name: -1 } });

    var count =0;
    this.props.takeSeriesTemplates1.forEach((series) => {
      //      { key: 0, text: 'Static LUM', value: 0 },
      // options.push({key:series._id, text:series.name, value: { _id:series._id, text:series.name, value:series.name }});
      options.push({key:series._id, text:series.name, value: series.name });
      count++;
      console.log(`Found series._id: ${series._id}, name: ${series.name}`);
    });
    return options;
  }

  getTargetRaDec() {
    console.log('targetEditorFind: ' + this.state.targetFindName );
    Meteor.call("targetEditorFind", this.state.targetFindName , (error, result) => {
      // identify the error
      console.log('Error: ' + error);
      console.log('result: ' + result);
      for (var i = 0; i < result.split('|').length; i++) {
        var txt = result.split('|')[i].trim();
        console.log('Found: ' + txt);
      }
      if (error && error.error === "logged-out") {
        // show a nice error message
        Session.set("errorMessage", "Please log in to post a comment.");
      }
      else {
        // if success then TheSkyX has made this point the target...
        // now get the coordinates
        cmdSuccess = true;
        var ra = result.split('|')[1].trim();
        var dec = result.split('|')[2].trim();
        this.setState({ra: ra});
        this.setState({dec: dec});
      }
    });
  }


  // *******************************
  findTarget() {
    // on the client
    console.log('tsx_TargetFind');
    var found = false;
    Meteor.call("tsx_TargetFind", this.props.target, function (error, result) {
      // identify the error
      var success = result.split('|')[0].trim();
      console.log('Error: ' + error);
      console.log('result: ' + result);
      if (success != "Success") {
        // show a nice error message
        Session.set("errorMessage", "Please confirm TSX is active.\nerror.error");
      }
      else {
        // not sure... this is to find target to start imaging...
      }
    });

  }

  // *******************************
  render() {
    // *******************************
    // TIME DATEPICKER OPTIONS
    const hideTimeOnInit = (calendarInstance) => calendarInstance.hide();
    // const hideStartOnInit = (calendarInstance) => calendarInstance.hide();
    // const hideStopOnInit = (calendarInstance) => calendarInstance.hide();
    const timeOptions = {
      //inline: true,
      format: 'HH:mm',
      defaultDate: new Date(),
    };

    // *******************************
    // DROP DOWN CONSTANTS
    var filters = this.renderDropDownFilters();
    var takeSeries = this.getTakeSeriesTemplates();

    // *******************************
    // var for ra and DATEPICKER
    var targetRa = `${this.state.ra}`;
    var targetDec = `${this.state.dec}`;
    var targetAngle = `${this.state.angle}`;
    var targetDesc = `${this.state.description}`;

    // *******************************
    // this is not the render return... scroll down...
    const panes = [
      // *******************************
      // name for the Target session
      // *******************************
      { menuItem: 'Session', render: () =>
      <Tab.Pane>
        <Segment.Group>
          <Segment>
            <h3 className="ui header">Session</h3>
            {/* <Form> */}
              <Form.Group widths='equal'>
                <Form.Field control={Input}
                  label='Name'
                  name='name'
                  placeholder='Name for session'
                  value={this.state.name}
                  onChange={this.handleChange}/>
                <Form.Field control={Input}
                  label='Description'
                  name='description'
                  placeholder='Describe the session'
                  value={this.state.description}
                  onChange={this.handleChange}/>
                <Form.Field control={Dropdown}
                  label='Series'
                  name='seriesTemplate'
                  options={takeSeries}
                  placeholder='Series to use for Imaging'
                  text={this.state.seriesTemplate}
                  onChange={this.handleChange}/>
              </Form.Group>
            {/* </Form> */}
          </Segment>
        </Segment.Group>
      </Tab.Pane> },
      // *******************************
      // Details for the Target session
      // *******************************
      { menuItem: 'Details', render: () =>
      <Tab.Pane>
        <Segment>
          <h3 className="ui header">Details</h3>
          <Form.Group widths='equal'>
            <Form.Input
              label='Ra'
              name='ra'
              placeholder='RA'
              value={this.state.ra}
              onChange={this.handleChange}/>
            <Form.Input
              label='Dec'
              name='dec'
              placeholder='DEC'
              value={this.state.dec}
              onChange={this.handleChange}/>
            <Form.Input
              label='Angle'
              name='angle'
              placeholder='Angle'
              value={this.state.angle}
              onChange={this.handleChange}/>
          </Form.Group>
        </Segment>
        <Segment>
          <Form.Group widths='equal'>
            <Form.Input
              label='Target Name'
              name='targetFindName'
              placeholder='Name to search for'
              value={this.state.targetFindName}
              onChange={this.handleChange}/>
            <Button onClick={this.getTargetRaDec.bind(this)}>Find</Button>
            <Form.Input
              label='Image to load'
              name='targetImage'
              placeholder='Filename to load on server'
              value={this.state.targetImage}
              onChange={this.handleChange}
            />
            <Button onClick={this.findTarget.bind(this)}>Solve</Button>
        </Form.Group>
        </Segment>
      </Tab.Pane> },

      { menuItem: 'Constraints', render: () =>
      <Tab.Pane>
        <h3 className="ui header">Constraints</h3>
        <Segment>
          <h4 className="ui header">Priority: {this.state.priority}</h4>
          <ReactSimpleRange
            label
            step={1}
            min={1}
            max={19}
            value={this.state.priority}
            sliderSize={12}
            thumbSize={18}
            onChange={this.handlePriorityChange}
          />
        </Segment>
        <Segment>
          <h4 className="ui header">Minimum Altitude: {this.state.minAlt}</h4>
          <ReactSimpleRange
            label
            step={.5}
            min={0}
            max={90}
            value={this.state.minAlt}
            sliderSize={12}
            thumbSize={18}
            onChange={this.handleMinAltChange}
          />
        </Segment>
          <Segment>
            <h4 className="ui header">Start Time</h4>
            <Timekeeper
              time={this.state.startTime}
              onChange={this.handleStartChange}
            />
          </Segment>
          <Segment>
            <h4 className="ui header">Stop Time</h4>
            <Timekeeper
              time={this.state.stopTime}
              onChange={this.handleStartChange}
            />
          </Segment>
      </Tab.Pane> },
//
// These are the focus settings of interest
//
      { menuItem: 'Focus', render: () =>
      <Tab.Pane>
            <h3 className="ui header">Focus</h3>
              <Form.Group widths='equal'>
                <Form.Field control={Dropdown}
                  label='Filter'
                  options={filters}
                  placeholder='Filter for focusing'
                  text={this.state.focusFilter}
                  onChange={this.focusFilterChange}/>
              </Form.Group>
              <Segment>
                <h4 className="ui header">Focus Temperature Delta: {this.state.tempChg}</h4>
                <ReactSimpleRange
                  label
                  step={.1}
                  min={0}
                  max={2}
                  value={this.state.tempChg}
                  sliderSize={12}
                  thumbSize={18}
                  onChange={this.handleFocusTempChange}
                />
              </Segment>
      </Tab.Pane> },
//
// THis is the imaging constraints... currently only the temp setting
//
      { menuItem: 'Imaging', render: () =>
      <Tab.Pane>
        <h3 className="ui header">Imaging Series</h3>
        <Segment>
          <h4 className="ui header">Cooling temp: {this.state.coolingTemp}</h4>
          <ReactSimpleRange
            label
            step={1}
            min={-30}
            max={0}
            value={this.state.coolingTemp}
            sliderSize={12}
            thumbSize={18}
            onChange={this.handleCoolingTempChange}
          />
        </Segment>
        <Segment>
          <h4 className="ui header">Cooling Time (minutes): {this.state.coolingTime}</h4>
          <ReactSimpleRange
            label
            step={1}
            min={0}
            max={19}
            value={this.state.coolingTime}
            sliderSize={12}
            thumbSize={18}
            onChange={this.handleCoolingTimeChange}
          />
        </Segment>
      </Tab.Pane> },
    ]
// *******************************
// THIS IS THE ACTUAL RENDERING...
// *******************************
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
        <Form>
          <Tab menu={{ pointing: true }} renderActiveOnly={true} panes={panes} />
        </Form>
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
