import React, { Component } from 'react'
import ReactDOM from 'react-dom';
// import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';

import { Seriess } from '../api/seriess.js';
import { TargetSessions } from '../api/targetSessions.js';
import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';
import TakeSeriesTemplateEditor from './TakeSeriesTemplateEditor.js';

import { Form, Label, Tab, Segment, Button, Radio, Input, Table, Dropdown, Checkbox, } from 'semantic-ui-react'

// import {datetimepicker} from 'meteor/tsega:bootstrap3-datetimepicker'
import { DateTimePicker, DateTimePickerStore, } from 'meteor/alonoslav:react-datetimepicker-new';

const STARTTIME_ID = 'startTimeId';
const STOPTIME_ID = 'stopTimeId';

const setStartTime = (date) => {
  console.log('setStartTime');
  // set a new date
  startInstance.date=date;
};

const setStopTime = (date) => {
  console.log('setStopTime');
  // set a new date
  stopInstance.date(date);
};

const stopInstance = DateTimePickerStore.getInstanceById(STOPTIME_ID);
const startInstance = DateTimePickerStore.getInstanceById(STARTTIME_ID);




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
    clsFilter: '',
    focusFilter: {},
    foccusSamples: '',
    focusBin: '',
    guideExposure: '',
    guideDelay: '',
    minAlt: '',
    startTime: '',
    stopTime: '',
    coolingTemp: '',
    coolingTime: '',
    value: false,
    openModal: false,
    templates: [],
    checked: false,
    template_id: '',
    tempChg: '',
    filterDropDown:[],
    seriesDropDown:[],
  };

  handleOpen = () => this.setState({ modalOpen: true })
  handleClose = () => this.setState({ modalOpen: false })
  handleChange = (e, { name, value }) => this.setState({ [name]: value })

  nameChange = (e, { value }) => this.setState({ name: value.trim() });
  descriptionChange = (e, { value }) => this.setState({ description: value.trim() });
  coolingTempChange = (e, { value }) => this.setState({ coolingTemp: value });
  coolingTimeChange = (e, { value }) => this.setState({ coolingTime: value });
  targetFindNameChange = (e, { value }) => this.setState({ targetFindName: value.trim() });
  targetImageChange = (e, { value }) => this.setState({ targetImage: value.trim() });
  startTimeChange = (e, { value }) => this.setState({ startTime: value });
  stopTimeChange = (e, { value }) => this.setState({ stopTime: value });
  raChange = (e, { value }) => this.setState({ ra: value });
  decChange = (e, { value }) => this.setState({ dec: value });
  angleChange = (e, { value }) => this.setState({ angle: value });
  seriesTemplateChange = (e, { value }) => this.setState({ seriesTemplate: value});
  // seriesTemplateChange = (e, { value }) => this.setState({ seriesTemplate: {key:value.key, text:value.text, value:value.value} });
  priorityChange = (e, { value }) => this.setState({ priority: value });
  minAltChange = (e, { value }) => this.setState({ minAlt: value });
  clsFilterChange = (e, { value }) => this.setState({ clsFilter: value });
  focusFilterChange = (e, { value }) => this.setState({ focusFilter: value });
  // focusFilterChange = (e, { value }) => this.setState({ focusFilter: {key:value.key, text:value.text, value:value.value} });
  foccusSamplesChange = (e, { value }) => this.setState({ foccusSamples: value });
  focusBinChange = (e, { value }) => this.setState({ focusBin: value });
  guideExposureChange = (e, { value }) => this.setState({ guideExposure: value });
  guideDelayChange = (e, { value }) => this.setState({ guideDelay: value });
  tempChgChange = (e, { value }) => this.setState({ tempChg: value });

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
      clsFilter: this.props.target.clsFilter,
      focusFilter: this.props.target.focusFilter,
      filterDropDown: this.renderDropDownFilters(),
      foccusSamples: this.props.target.foccusSamples,
      focusBin: this.props.target.focusBin,
      guideExposure: this.props.target.guideExposure,
      guideDelay: this.props.target.guideDelay,
      tempChg: this.props.target.tempChg,
    });

    // set a new date
    if( this.props.target.stopTime != '') {
      stopInstance.date(this.props.target.stopTime);
    }
    if( this.props.target.startTime != '') {
    // set a new date
      startInstance.date(this.props.target.startTime);
    }

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
    var s1 = stopInstance.date;
    var s2 = startInstance.date;

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
        startTime: startInstance.date,
        stopTime: stopInstance.date,
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
    console.log('tsx_GetTargetRaDec: ' + this.state.targetFindName );
    Meteor.call("tsx_GetTargetRaDec", this.state.targetFindName , (error, result) => {
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
        var description = result.split('|')[3].trim();
        this.setState({ra: ra});
        this.setState({dec: dec});
        this.setState({description: description});
        // targetSession.ra = result.split('|')[1].trim();
        // targetSession.dec = result.split('|')[2].trim();
        // targetSession.description = result.split('|')[3].trim();
        // this.forceUpdate();
        // const text = ReactDOM.findDOMNode(this.refs.ra).value.trim();
        // console.log(text);

      }
    });
  }

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

  render() {
    // *******************************
    // TIME DATEPICKER OPTIONS
    const hideStartOnInit = (calendarInstance) => calendarInstance.hide();
    const hideStopOnInit = (calendarInstance) => calendarInstance.hide();
    const timeOptions = {
      inline: true,
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
                  placeholder='Name for session'
                  defaultValue={this.state.name}
                  onChange={this.nameChange}/>
                <Form.Field control={Input}
                  label='Description'
                  placeholder='Describe the session'
                  defaultValue={this.state.description}
                  onChange={this.descriptionChange}/>
                <Form.Field control={Dropdown}
                  label='Series'
                  options={takeSeries}
                  placeholder='Series to use for Imaging'
                  text={this.state.seriesTemplate}
                  onChange={this.seriesTemplateChange}/>
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
          <Form.Group widths='equal'>
            {/*
              https://github.com/vadym-vorobel/react-datetimepicker
              const instance = DateTimePickerStore.getInstanceById(DATEPICKER_ID);
              e.g.
              var startTime = DateTimePickerStore.getInstanceById(STARTTIME_ID);

              THIS STILL SEEMS THE BEST SOURCE:
              http://eonasdan.github.io/bootstrap-datetimepicker/


              */}
            <Label>Start Time</Label>
            <DateTimePicker
              id="STARTTIME_ID"
              onDateChanged={setStartTime}
              options={timeOptions}
              dateTimePickerMount={hideStartOnInit}
            />
            <Label>Stop Time</Label>
              <DateTimePicker
                id="STOPTIME_ID"
                onDateChanged={setStopTime}
                options={timeOptions}
                dateTimePickerMount={hideStopOnInit}
              />
          </Form.Group>
          <Form.Group widths='equal'>
            <Form.Input
              label='Priority'
              name='priority'
              placeholder='Priority'
              defaultValue={this.state.priority}
              onChange={this.handleChange}
            />
            <Form.Input
              label='Minimum Altitude:'
              name='minAlt'
              placeholder='Minimum Altitude'
              defaultValue={this.state.minAlt}
              onChange={this.handleChange}
            />
          </Form.Group>
      </Tab.Pane> },
//
// These are the focus settings of interest
//
      { menuItem: 'Focus', render: () =>
      <Tab.Pane>
            <h3 className="ui header">Focus</h3>
              <Form.Group widths='equal'>
                <Form.Input
                  label='Focusing Temp Delta'
                  name='tempChg'
                  placeholder='change diff.'
                  defaultValue={this.state.tempChg}
                  onChange={this.handleChange}
                />
                <Form.Field control={Dropdown}
                  label='Filter'
                  options={filters}
                  placeholder='Filter for focusing'
                  text={this.state.focusFilter}
                  onChange={this.focusFilterChange}/>
                {/* <Form.Select
                  label='Filter'
                  options={this.renderDropDownFilters()}
                  placeholder='Filter for focusing'
                  text={this.state.focusFilter.text}
                  onChange={this.focusFilterChange}/> */}
                {/* <Form.Select
                  label='Filter'
                  options={this.getTakeSeriesTemplates()}
                  placeholder='Filter for focusing'
                  text={this.state.seriesTemplate.text}
                  onChange={this.seriesTemplateChange}/> */}
              </Form.Group>
      </Tab.Pane> },
//
// THis is the imaging constraints... currently only the temp setting
//
      { menuItem: 'Imaging', render: () =>
      <Tab.Pane>
            <h3 className="ui header">Imaging Series</h3>
              <Form.Group widths='equal'>
                <Form.Input
                  label='Cooling temp'
                  name='coolTemp'
                  placeholder='Imaging temperature'
                  defaultValue={this.state.coolingTemp}
                  onChange={this.handleChange}
                />
                <Form.Input
                  label='Warm up/down over how many minutes'
                  name='coolTime'
                  placeholder='Number of minutes'
                  defaultValue={this.state.coolingTime}
                  onChange={this.handleChange}/>
              </Form.Group>
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
