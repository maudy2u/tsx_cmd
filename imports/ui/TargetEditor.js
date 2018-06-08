import React, { Component } from 'react'
import ReactDOM from 'react-dom';
// import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';

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
    name: '',               // name of the target
    targetImage: '',        // image file name of the target - future
    targetFindName: '',     // Name to look up in TheSkyX
    description: '',        // SOmething to say
    enabledActive: false,   // whether the target is active or not
    series: {},     // The take series to use
    progress: [],
    report_id: '',
    ra: "",                 // Target RA
    dec: "",                // Target DEC
    angle: "",
    scale: '',
    coolingTemp: -19,
    coolingTime: 5,
    clsFilter: '',
    focusFilter: '',
    foccusSamples: '',
    focusBin: '',
    focusTarget: '',
    focusExposure: 1,
    guideExposure: '',
    guideDelay: '',
    startTime: '20:00',
    stopTime: '6:00',
    priority: 10,           // Priority: 1 is highest
    tempChg: 0.7,
    currentAlt:0,
    minAlt: 29.5,
    report: '',

    seriesTemplate: {},
    value: false,
    openModal: false,
    templates: [],
    checked: false,
    template_id: '',
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
  // handleFocusTempChange = ( value ) => this.setState({tempChg: value.value });
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

      seriesTemplate: this.props.target.series.value,
      seriesDropDown: this.getTakeSeriesTemplates(),
      value: false,
      openModal: false,


      name: this.props.target.name,
      targetFindName: this.props.target.targetFindName,
      targetImage: this.props.target.targetImage,
      description: this.props.target.description,
      enabledActive: this.props.target.enabledActive,
      series: {
        _id: this.props.target.series._id,
        value: this.props.target.series.text,
      },
      progress: [
//            {_id: seriesId, taken:0},
      ],

      // series: {
      //   _id: orgTarget.series._id,
      //   value: orgTarget.series.text,
      // },

      report_d: this.props.target.report_id,
      ra: this.props.target.ra,
      dec: this.props.target.dec,
      angle: this.props.target.angle,
      scale: this.props.target.scale,
      coolingTemp: Number(this.props.target.coolingTemp),
      clsFilter: this.props.target.clsFilter,
      focusFilter: this.props.target.focusFilter,
      foccusSamples: this.props.target.foccusSamples,
      focusBin: this.props.target.focusBin,
      focusTarget: this.props.target.focusTarget,
      focusExposure: this.props.target.focusExposure,
      guideExposure: Number(this.props.target.guideExposure),
      guideDelay: Number(this.props.target.guideDelay),
      startTime: this.props.target.startTime,
      stopTime: this.props.target.stopTime,
      priority: Number(this.props.target.priority),
      tempChg: this.props.target.tempChg,
      currentAlt: Number(this.props.target.currentAlt),
      minAlt: Number(this.props.target.minAlt),
      report: '',

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
        name: this.state.name,
        targetFindName: this.state.targetFindName,
        targetImage: this.state.targetImage,
        description: this.state.description,
        enabledActive: this.state.enabledActive,
        series: {
          _id: seriesId,
          value: this.state.seriesTemplate,
        },
        //progress: [], // not part of editor
        // report_d: this.state.report_id,
        ra: this.state.ra,
        dec: this.state.dec,
        angle: this.state.angle,
        scale: this.state.scale,
        coolingTemp: this.state.coolingTemp,
        clsFilter: this.state.clsFilter,
        focusFilter: this.state.focusFilter,
        foccusSamples: this.state.foccusSamples,
        focusBin: this.state.focusBin,
        focusTarget: this.state.focusTarget,
        focusExposure: this.state.focusExposure,
        guideExposure: this.state.guideExposure,
        guideDelay: this.state.guideDelay,
        startTime: this.state.startTime,
        stopTime: this.state.stopTime,
        priority: this.state.priority,
        tempChg: this.state.tempChg,
        currentAlt: this.state.currentAlt,
        minAlt: this.state.minAlt,
        report: '',

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

    console.log('targetFind: ' + this.props.target.targetFindName );
    Meteor.call(
      'targetFind',
      this.props.target ,
      function ( error, result ) {

//    Meteor.call("targetFind", this.state.targetFindName , function(error, result) {
      // identify the error
      console.log('Error: ' + error);
      console.log('result: ' + result);
      // if success then TheSkyX has made this point the target...
      // now get the coordinates
      cmdSuccess = true;
      this.setState({ra: result.RA});
      this.setState({dec: result.DEC});
    }.bind(this));
  }


  // *******************************
  findTarget() {
    // on the client
    console.log('deferred functionality');

  }

  getImageLinkAngle() {
    console.log('deferred functionality');
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

    var focFilter= `${this.state.focusFilter}`;
    var focTemp= `${this.state.tempChg}`;
    var focExp = `${this.state.focusExposure}`

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
      // { menuItem: 'Details', render: () =>
      // <Tab.Pane>
      //   <Segment>
      //     <h3 className="ui header">Details</h3>
      //     <Form.Group widths='equal'>
      //       <Form.Input
      //         label='Angle'
      //         name='angle'
      //         placeholder='Angle'
      //         value={this.state.angle}
      //         onChange={this.handleChange}/>
      //         <Button icon='upload' onClick={this.getImageLinkAngle.bind(this)}/>
      //         <Button onClick={this.getImageLinkAngle.bind(this)}>FromImageLink</Button>
      //     </Form.Group>
      //   </Segment>
      //   <Segment>
      //     <Form.Group widths='equal'>
      //     </Form.Group>
      //     <Form.Group widths='equal'>
      //       <Form.Input
      //         label='Image to load'
      //         name='targetImage'
      //         placeholder='Filename to load on server'
      //         value={this.state.targetImage}
      //         onChange={this.handleChange}
      //       />
      //       <Button onClick={this.findTarget.bind(this)}>Solve</Button>
      //   </Form.Group>
      //   </Segment>
      // </Tab.Pane> },

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
                  text={focFilter}
                  onChange={this.handleChange}
                />
                <Form.Input
                  label='Focusing Initial Exposure '
                  name='focusExposure'
                  placeholder='e.g. 0.7'
                  value={this.state.focusExposure}
                  onChange={this.handleChange}
                />
                <Form.Input
                  label='Use a focusing target '
                  name='focusTarget'
                  placeholder='e.g. HIP 66004'
                  value={this.state.focusTarget}
                  onChange={this.handleChange}
                />
              </Form.Group>
              <Segment>
                <h4 className="ui header">Focus Temperature Delta: {this.state.tempChg}</h4>
                <Form.Input
                  label='Delta in temp to focus'
                  name='tempChg'
                  placeholder='e.g. 0.7'
                  value={this.state.tempChg}
                  onChange={this.handleChange}
                />

              </Segment>
      </Tab.Pane> },
//
// THis is the imaging constraints... currently only the temp setting
//
      // { menuItem: 'Imaging', render: () =>
      // <Tab.Pane>
      //   <h3 className="ui header">Imaging Series</h3>
      //   <Segment>
      //     <h4 className="ui header">Cooling temp: {this.state.coolingTemp}</h4>
      //     <ReactSimpleRange
      //       label
      //       step={1}
      //       min={-30}
      //       max={0}
      //       value={this.state.coolingTemp}
      //       sliderSize={12}
      //       thumbSize={18}
      //       onChange={this.handleCoolingTempChange}
      //     />
      //   </Segment>
      //   <Segment>
      //     <h4 className="ui header">Cooling Time (minutes): {this.state.coolingTime}</h4>
      //     <ReactSimpleRange
      //       label
      //       step={1}
      //       min={0}
      //       max={19}
      //       value={this.state.coolingTime}
      //       sliderSize={12}
      //       thumbSize={18}
      //       onChange={this.handleCoolingTimeChange}
      //     />
      //   </Segment>
      // </Tab.Pane> },
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
