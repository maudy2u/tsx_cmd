import React, { Component } from 'react'
import ReactDOM from 'react-dom';
// import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';

import { Seriess } from '../api/seriess.js';
import { Filters } from '../api/filters.js';
import { TargetSessions } from '../api/targetSessions.js';
import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';
import TakeSeriesTemplateEditor from './TakeSeriesTemplateEditor.js';

import { Form, Label, Tab, Segment, Button, Radio, Input, Table, Dropdown, Checkbox, } from 'semantic-ui-react';

import ReactSimpleRange from 'react-simple-range';
// import { DateTime } from 'react-datetime-bootstrap';
import Timekeeper from 'react-timekeeper';

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
    focusFilter: 'Filter',
    foccusSamples: '',
    focusBin: '',
    guideExposure: '',
    guideDelay: '',
    minAlt: 29.5,
    currentAlt:0,
    startTime: '20:00',
    stopTime: '6:00',
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
    testDate: '',
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
  onStopTimeChange = (value) => this.setState({testDate: value});
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
      coolingTemp: Number(this.props.target.coolingTemp),
      targetFindName: this.props.target.targetFindName,
      targetImage: this.props.target.targetImage,

      seriesTemplate: this.props.target.series.value,
      // series: {
      //   _id: orgTarget.series._id,
      //   value: orgTarget.series.text,
      // },

      seriesDropDown: this.getTakeSeriesTemplates(),
      ra: this.props.target.ra,
      dec: this.props.target.dec,
      angle: this.props.target.angle,
      value: false,
      openModal: false,
      priority: Number(this.props.target.priority),
      minAlt: Number(this.props.target.minAlt),
      currentAlt: Number(this.props.target.currentAlt),
      startTime: this.props.target.startTime,
      stopTime: this.props.target.stopTime,
      clsFilter: this.props.target.clsFilter,
      focusFilter: this.props.target.focusFilter,
      foccusSamples: this.props.target.foccusSamples,
      focusBin: this.props.target.focusBin,
      guideExposure: this.props.target.guideExposure,
      guideDelay: this.props.target.guideDelay,
      tempChg: Number(this.props.target.tempChg),
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
          value: this.state.seriesTemplate,
        },
        ra: this.state.ra,
        dec: this.state.dec,
        angle: this.state.angle,
        startTime: this.state.startTime,
        stopTime: this.state.stopTime,
        priority: this.state.priority,
        minAlt: this.state.minAlt,
        currentAlt: this.state.currentAlt,
        clsFilter: this.state.clsFilter,
        focusFilter: this.state.focusFilter,
        foccusSamples: this.state.foccusSamples,
        focusBin: this.state.focusBin,
        guideExposure: this.state.guideExposure,
        guideDelay: this.state.guideDelay,
       },
    });
  }

  getDropDownFilters() {

    var filterArray = [];
    for (var i = 0; i < this.props.filters.length; i++) {
      filterArray.push({
        key: this.props.filters[i]._id,
        text: this.props.filters[i].name,
        value: this.props.filters[i].name });
    }
    return filterArray;
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
    this.setState({ra: ''});
    this.setState({dec: ''});

    console.log('targetFind: ' + this.state.targetFindName );
    Meteor.call(
      'targetFind',
      this.state.targetFindName ,
      function ( error, result ) {

//    Meteor.call("targetFind", this.state.targetFindName , function(error, result) {
      // identify the error
      console.log('Error: ' + error);
      console.log('result: ' + result);
      // if success then TheSkyX has made this point the target...
      // now get the coordinates
      cmdSuccess = true;
      this.setState({ra: result.ra});
      this.setState({dec: result.dec});
    }.bind(this));
  }


  // *******************************
  findTarget() {
    // on the client

  }

  getImageLinkAngle() {
    console.log('defed functionality');
    return 0;
  }

  // *******************************
  render() {
    // *******************************

    const timeOptions = {
      //inline: true,
      format: 'YYYY-MM-DD HH:mm',
      sideBySide: true,
      // icons: time,
      // minDate: new Date(),
    };

    // *******************************
    // DROP DOWN CONSTANTS
    var takeSeries = this.getTakeSeriesTemplates();
    var filters = this.getDropDownFilters();
    var targetPriority = `${this.state.priority}`;

    // *******************************
    // var for ra and DATEPICKER
    var minimumAlt = `${this.state.minAlt}`;
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
            {/* <Form>
              */}
              <Form.Group widths='equal'>
                <Form.Input
                    label='Target Name'
                    name='targetFindName'
                    placeholder='Catalogue name, or RA/DEC Values, e.g.: 11h 33m 48s, 55d 57m 18s'
                    value={this.state.targetFindName}
                    onChange={this.handleChange}/>
                <Form.Field control={Input}
                  label='Description'
                  name='description'
                  placeholder='Describe the session'
                  value={this.state.description}
                  onChange={this.handleChange}/>
              </Form.Group>
              <Form.Group>
                <Button onClick={this.getTargetRaDec.bind(this)}>Find</Button>
                <Label>RA <Label.Detail>{Number(this.state.ra).toFixed(4)}</Label.Detail></Label>
                <Label>DEC <Label.Detail>{Number(this.state.dec).toFixed(4)}</Label.Detail></Label>
                {/* <Label>Atl <Label.Detail>{Number(this.state.targetALT).toFixed(4)}</Label.Detail></Label>
                <Label>Az <Label.Detail>{this.state.targetAZ}</Label.Detail></Label>
                <Label>Angle <Label.Detail>{Number(this.state.targetAngle).toFixed(4)}</Label.Detail></Label>
                <Label>HA <Label.Detail>{Number(this.state.targetHA).toFixed(4)}</Label.Detail></Label>
                <Label>Transit <Label.Detail>{Number(this.state.targetTransit).toFixed(4)}</Label.Detail></Label> */}
              </Form.Group>
              <Form.Group>
                <Form.Field control={Dropdown}
                  label='Series'
                  name='seriesTemplate'
                  options={takeSeries}
                  placeholder='Series to use for Imaging'
                  text={this.state.seriesTemplate}
                  onChange={this.handleChange}/>
              </Form.Group>
              {/* <Form.Group> */}
              {/* <Form.Group widths='equal'>
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
              </Form.Group> */}
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
              label='Angle'
              name='angle'
              placeholder='Angle'
              value={this.state.angle}
              onChange={this.handleChange}/>
              <Button onClick={this.getImageLinkAngle.bind(this)}>FromImageLink</Button>
          </Form.Group>
        </Segment>
        <Segment>
          <Form.Group widths='equal'>
          </Form.Group>
          <Form.Group widths='equal'>
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
        {/* <Segment>
          <h4 className="ui header">Stop Time</h4>
          <DateTime
            value={this.state.testDate}
            pickerOptions={timeOptions}
            onChange={this.onStopTimeChange}
          />
        </Segment> */}
        <Segment>
          <h4 className="ui header">Priority: {targetPriority}</h4>
          <ReactSimpleRange
            label
            step={1}
            min={1}
            max={19}
            value={targetPriority}
            sliderSize={12}
            thumbSize={18}
            onChange={this.handlePriorityChange}
          />
        </Segment>
        <Segment>
          <h4 className="ui header">Minimum Altitude: {minimumAlt}</h4>
          <ReactSimpleRange
            label
            step={.5}
            min={0}
            max={90}
            value={minimumAlt}
            sliderSize={12}
            thumbSize={18}
            onChange={this.handleMinAltChange}
          />
        </Segment>
        {/*
          Still working on the different TIME formats...
          Need to find another bootstrap3 version of the date picker
            */}
          <Segment>
            <h4 className="ui header">Start Time</h4>
            <Timekeeper
              time={this.state.startTime}
              onChange={this.handleStartChange}
            />
          </Segment>
          <Segment>
            <h4 className="ui header">Stop Time</h4>
            {/* <DateTime />pickerOptions={{format:"LL"}} value="2017-04-20"/> */}
            <Timekeeper
              time={this.state.stopTime}
              onChange={this.handleStopChange}
            />
          </Segment>
      </Tab.Pane> },
//
// These are the focus settings of interest
//
      { menuItem: 'Focus', render: () =>
      <Tab.Pane>
        <Form.Group widths='equal'>
          <Form.Field control={Dropdown}
            fluid
            label='ClosedLoopSlew Filter'
            name='clsFilter'
            options={filters}
            placeholder='Filter for Close Loop Slew'
            text={this.state.clsFilter}
            onChange={this.handleChange}
          />
        </Form.Group>
            <h3 className="ui header">Focus</h3>
              <Form.Group widths='equal'>
                <Form.Field control={Dropdown}
                  fluid
                  label='Focus Filter'
                  name='focusFilter'
                  options={filters}
                  placeholder='Filter for focusing'
                  text={this.state.focusFilter}
                  onChange={this.handleChange}
                />
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
      filters: Filters.find({}, { sort: { slot: 1 } }).fetch(),
      targets1: TargetSessions.find({}, { sort: { name: 1 } }).fetch(),
      takeSeriesTemplates1: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
  };
})(TargetEditor);
