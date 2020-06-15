/*
tsx cmd - A web page to send commands to TheSkyX server
    Copyright (C) 2018  Stephen Townsend

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Meteor } from 'meteor/meteor';
import React, { Component } from 'react'
import ReactDOM from 'react-dom';
// import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';

import { Filters } from '../api/filters.js';
import { TargetReports } from '../api/targetReports.js';
import { TargetSessions } from '../api/targetSessions.js';
import {
  TakeSeriesTemplates,
  getTakeSeriesTemplates,
  getTakeSeriesName,
  takeSeriesDropDown,
} from '../api/takeSeriesTemplates.js';
import {
  SkySafariFiles,
  getSkySetsDropDown,
  getSkySafariSkySetName,
} from '../api/skySafariFiles.js';
import { TheSkyXInfos } from '../api/theSkyXInfos.js';

import TakeSeriesTemplateEditor from './TakeSeriesTemplateEditor.js';

import {
  Tab,
  Label,
  Segment,
  Button,
  Progress,
  Statistic,
  Confirm,
} from 'semantic-ui-react'

import {
  Form,
  Checkbox,
  Input,
  Dropdown,
  Radio,
} from 'formsy-semantic-ui-react';
const ERRORLABEL = <Label color="red" pointing/>
const XRegExp = require('xregexp');
const XRegExpPosNum = XRegExp('^0$|(^([1-9]\\d*(\\.\\d+)?)$)|(^0?\\.\\d*[1-9]\\d*)$');
const XRegExpNonZeroPosInt = XRegExp('^([1-9]\\d*)$');
const XRegExpZeroOrPosInt = XRegExp('^(\\d|[1-9]\\d*)$');
const XRegExpZeroToNine = XRegExp('^\\d$');

import {
  renderDropDownFilters,
} from '../api/filters.js'

import ReactSimpleRange from 'react-simple-range';
// import { DateTime } from 'react-datetime-bootstrap';
import Timekeeper from 'react-timekeeper';

import IndividualFile from './FileIndividualFile.js';
const debug = require('debug')('demo:file');
import PropTypes from 'prop-types';

import {
  updateTargetStateValue,
  updateTargetSeriesStateValue,
} from  '../api/serverStates.js';

class TargetEditor extends Component {

  constructor(props) {
    super(props);

    this.state = {
      value: false,
      openGetCoords: false,
      openModal: false,
      templates: [],
      checked: false,
      filterDropDown:[],
      uploading: [],
      progress: 0,
      inProgress: false,
      seriesDropDown: getTakeSeriesTemplates(this.props.seriesTemplates),

      name: this.props.target.name,
      targetFindName: this.props.target.targetFindName,
      targetImage: this.props.target.targetImage,
      description: this.props.target.description,
      friendlyName: this.props.target.friendlyName,
      setSkysetFile_id: this.props.target.setSkysetFile_id,
      enabledActive: this.props.target.enabledActive,

      series: {
        _id: this.props.target.series._id,
        value: this.props.target.series.text,
      },
      progress: [
  //            {_id: seriesId, taken:0},
      ],
      series_id:this.props.target.series_id,
      ra: this.props.target.ra,
      dec: this.props.target.dec,
      angle: this.props.target.angle,
      rotator_position: this.props.target.rotator_position,
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
      report: this.props.target.report,
    };

    this.uploadIt = this.uploadIt.bind(this);
  }

  propTypes: {
    fileName: PropTypes.string.isRequired,
    fileSize: PropTypes.number.isRequired,
    fileUrl: PropTypes.string,
    fileId: PropTypes.string.isRequired
  }

  uploadIt(e) {
    e.preventDefault();

    let self = this;

    if (e.currentTarget.files && e.currentTarget.files[0]) {
     // We upload only one file, in case
     // there was multiple sFiles selected
     var file = e.currentTarget.files[0];

     if (file) {
       let uploadInstance = SkySafariFiles.insert({
         file: file,
         meta: {
           locator: self.props.fileLocator,
           // userId: Meteor.userId() // Optional, used to check on server for file tampering
         },
         streams: 'dynamic',
         chunkSize: 'dynamic',
         allowWebWorkers: true // If you see issues with uploads, change this to false
       }, false)

       self.setState({
         uploading: uploadInstance, // Keep track of this instance to use below
         inProgress: true // Show the progress bar now
       });

       // These are the event functions, don't need most of them, it shows where we are in the process
       uploadInstance.on('start', function () {
       })
       uploadInstance.on('end', function (error, fileObj) {
         alert('File "' + fileObj.name + '" successfully uploaded');
         // self.forceUpdate();
       });

       uploadInstance.on('uploaded', function (error, fileObj) {

         // Remove the filename from the upload box
         // this line cause an exception... why...
         //self.refs['sFileinput'].value = '';

         // Reset our state for the next file
         self.setState({
           uploading: [],
           progress: 0,
           inProgress: false,
         });
         self.getSkySafariSkySet( self.props.target._id, fileObj._id )
       })

       uploadInstance.on('error', function (error, fileObj) {
         console.log('Error during upload: ' + error)
       });

       uploadInstance.on('progress', function (progress, fileObj) {
         // Update our progress bar
         self.setState({
           progress: progress
         });
       });

       uploadInstance.start(); // Must manually start the upload
     }
    }
  }

  showUploads() {
   if (this.state.uploading.length > 0) {
     return
     <div>
       {this.state.uploading.file.name}
       <div className="progress progress-bar-default">
         <div style={{width: this.state.progress + '%'}} aria-valuemax="100"
            aria-valuemin="0"
            aria-valuenow={this.state.progress || 0} role="progressbar"
            className="progress-bar">
           <span className="sr-only">{this.state.progress}% Complete (success)</span>
           <span>{this.state.progress}%</span>
         </div>
       </div>
     </div>
   }
   else{
     return
     <div>
      {getSkySafariSkySetName(this.props.target.skysafariFile_id)}
     </div>
   }
  }

  displayFiles() {
    if (this.props.sFiles && this.props.sDocsReadyYet) {

      let fileCursors = this.props.sFiles;

      // Run through each file that the user has stored
      // (make sure the subscription only sends sFiles owned by this user)
      let display = fileCursors.map((aFile, key) => {

        let link = SkySafariFiles.findOne({_id: aFile._id}).link('version');  // 'version' is needed in the case the file is renamed.

        // get the TSXIP, and replace the "host with this value"
          var url = new URL(link);
          url.hostname = this.props.ip.value;
          url.port = this.props.port.value;
          link = url.href //'http://example.com:8080/one/two'

        // Send out components that show details of each file
        return <div key={'file' + key}>
          <IndividualFile
            fileName={aFile.name}
            fileUrl={link}
            fileId={aFile._id}
            fileSize={aFile.size}
          />
        </div>
      })
      return display;
    }
    else {
      return <div>Loading file list</div>;
    }
  }


  showGetCoords = () => this.setState({ openGetCoords: true });

  handleCancelGetCoords = () => {
    this.setState({ openGetCoords: false });
  };
  handleConfirmGetCoords = () => {
    this.getTSXRaDec();
  };

  handleOpen = () => this.setState({ modalOpen: true });
  handleClose = () => this.setState({ modalOpen: false });
  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value.trim() });
    updateTargetStateValue( this.props.target._id, name, value );
  };

  handleSkySetChange = (e, { name, value, key }) => {
    this.setState({ [name]: value.trim() });
  };

  //handleChange = (e, { name, value }) => this.setState({ [name]: value });

  handleToggle = (e, { name, value }) => {
    var val = eval( 'this.state.' + name);
    this.setState({
      [name]: !val
    });
    updateTargetStateValue( this.props.target._id, name, value );
  };

  handleSeriesChange = (e, { name, value }) => {
    var seriesId =value;  // get the matching key value
    updateTargetSeriesStateValue( this.props.target._id, seriesId );
  };

  handleStartChange = (value) => {
    this.setState({startTime: value.formatted24 })
    // what is needed for the "dropdown values"
    // series needs an "ID", and so include text value

    updateTargetStateValue( this.props.target._id, 'startTime', value.formatted24 );
  };

  handleStopChange = (value) => {
    this.setState({stopTime: value.formatted24 })
    // what is needed for the "dropdown values"
    // series needs an "ID", and so include text value

    updateTargetStateValue( this.props.target._id, 'stopTime', value.formatted24 );
  };
  handlePriorityChange = (value) => {
    this.setState({priority: value.value })
    // what is needed for the "dropdown values"
    // series needs an "ID", and so include text value

    updateTargetStateValue( this.props.target._id, 'priority', value.value );
  };
  handleCoolingTempChange = (value) => {
    this.setState({coolingTemp: value.value })
    // what is needed for the "dropdown values"
    // series needs an "ID", and so include text value

    updateTargetStateValue( this.props.target._id, 'coolingTemp', value.value );
  };
  // handleFocusTempChange = ( value ) => this.setState({tempChg: value.value });
  handleMinAltChange = (value) => {
    this.setState({minAlt: value.value })
    // what is needed for the "dropdown values"
    // series needs an "ID", and so include text value

    updateTargetStateValue( this.props.target._id, 'minAlt', value.value );
  };

  onChangeChecked() {
    this.setState({enabledActive: value.value })
    // what is needed for the "dropdown values"
    // series needs an "ID", and so include text value

    updateTargetStateValue( this.props.target._id, 'enabledActive', !this.state.enabledActive );
  }

  componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
    if (this.props.target !== prevProps.target) {
      this.setState({
        name: this.props.target.name,
        targetFindName: this.props.target.targetFindName,
        targetImage: this.props.target.targetImage,
        description: this.props.target.description,
        friendlyName: this.props.target.friendlyName,
        setSkysetFile_id: this.props.target.setSkysetFile_id,
        enabledActive: this.props.target.enabledActive,
        series: {
          _id: this.props.target.series._id,
          value: this.props.target.series.text,
        },
        series_id:this.props.target.series_id,
        progress: [
    //            {_id: seriesId, taken:0},
        ],

        ra: this.props.target.ra,
        dec: this.props.target.dec,
        angle: this.props.target.angle,
        rotator_position: this.props.target.rotator_position,
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
        report: this.props.target.report,
      })
    }
  }

  reloadSkyset() {
    this.getSkySafariSkySet( this.props.target._id, this.state.setSkysetFile_id );
  }
  removeSkySet() {
    this.setState({ setSkysetFile_id: '' });
    updateTargetStateValue( this.props.target._id, 'setSkysetFile_id', '' );
  }

  downloadSkySet() {
    let link = SkySafariFiles.findOne({_id: this.state.skysafariFile_id}); //.link('version');  // 'version' is needed in the case the file is renamed.
    link = link.path('version');
    // get the TSXIP, and replace the "host with this value"
    let tsxip = TheSkyXInfos.findOne({name: 'ip'});
    if( typeof tsxip != 'undefined' || tsxip != '') {
      var url = new URL(link);
      url.hostname = tsxip.value;
      link = url.href //'http://example.com:8080/one/two'
    }
    return (
      <a href={link} className="btn btn-outline btn-primary btn-sm"
         target="_blank">Download</a>
    )
  }

  getTargetRaDec() {
    this.setState({ra: ''});
    this.setState({dec: ''});
    this.setState({alt: ''});

    Meteor.call(
      'targetFind',
      this.props.target._id ,
      function ( error, result ) {

      this.setState({ra: result.RA});
      this.setState({dec: result.DEC});
      this.setState({alt: result.ALT});
    }.bind(this));
  }

  getTSXRaDec() {
    this.setState({ra: ''});
    this.setState({dec: ''});
    this.setState({alt: ''});

    Meteor.call(
      'getTSXFrameCentre',
      this.props.target._id ,
      function ( error, result ) {
        this.setState({ openGetCoords: false });

    }.bind(this));
  }

  getSkySafariSkySet( tid, sid ) {
    Meteor.call( 'AssignSkySafariToTarget', tid, sid, function ( error, skyset ) {
      console.log( ' *** skyset: ' +skyset.ra + ', ' + skyset.dec + ', ' + skyset.pa );

    }.bind(this));
  }

  skysetButtons() {
/*
<Button icon='reload' onClick={this.getTargetReport.bind(this)}/>
<Button icon='download' onClick={this.clsTarget.bind(this)}/>
<Button icon='delete' onClick={this.deleteEntry.bind(this)}/>
<input type="file" id="sFileinput" disabled={this.state.inProgress} ref="sFileinput"
  onChange={this.uploadIt}/>
*/
    return(
      <Button.Group basic size='mini' floated='right'>
        <Button icon='repeat' onClick={this.reloadSkyset.bind(this)}/>
        <Button icon='download' onClick={this.downloadSkySet.bind(this)}/>
        <Button icon='delete' onClick={this.removeSkySet.bind(this)}/>
      </Button.Group>
    )
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
    let FILTERS = '';
    try {
      FILTERS = renderDropDownFilters();
    }
    catch ( e ) {
      FILTERS = [];
    }
    var TARGETPRIORITY = `${this.state.priority}`;
//    var TAKESERIES = getTakeSeriesTemplates(this.props.seriesTemplates);
    var TAKESERIES = takeSeriesDropDown();
    var TAKESERIESNAME = getTakeSeriesName(this.state.series);
    // *******************************
    // var for ra and DATEPICKER
    var MINIMUMALT = `${this.state.minAlt}`;
    var targetRa = `${this.state.ra}`;
    var targetDec = `${this.state.dec}`;
    var targetAngle = `${this.state.angle}`;
    var targetDesc = `${this.state.description}`;
    var friendlyName = `${this.state.friendlyName}`;
    var setSkysetFile_id = `${this.props.target.setSkysetFile_id}`;
    var targetFindName = `${this.state.targetFindName}`;
    var focFilter= `${this.state.focusFilter}`;
    var focTemp= `${this.state.tempChg}`;
    var focExp = `${this.state.focusExposure}`;


    var SKYSETS = getSkySetsDropDown();
    var SKYSET_NAME = getSkySafariSkySetName(setSkysetFile_id);
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
              <Form.Group>
                <Form.Input
                    label='Target Name'
                    name='targetFindName'
                    placeholder='TheSkyX Find: e.g.: M31 or, 11h 33m 48s, 55d 57m 18s'
                    value={this.state.targetFindName}
                    onChange={this.handleChange}/>
                <Form.Input
                    label='Friendly Name, for :t and filename'
                    name='friendlyName'
                    placeholder='Used for filename if needed, e.g. Not Sky Chart Centre'
                    value={this.state.friendlyName}
                    onChange={this.handleChange}/>
              </Form.Group>
              <small>     e.g. M31 or, 11h 33m 48s, 55d 57m 18s</small>
              <Form.Group>
              </Form.Group>
              <Form.Group inline>
                <Form.Field control={Input}
                  label='Description'
                  name='description'
                  placeholder='Describe the session'
                  value={this.state.description}
                  onChange={this.handleChange}/>
                  <div>
                <Button onClick={this.getTargetRaDec.bind(this)}>Find Target</Button>
                <Button onClick={this.showGetCoords}>Get Chart Centre</Button>
                <Confirm
                  open={this.state.openGetCoords}
                  header='Get TheSkyX Chart Centre'
                  content='If you wish to replace TARGET NAME, with the current TheSkyX Chart Centre, click "Yes - Replace".'
                  cancelButton='Cancel'
                  confirmButton="Yes - Replace"
                  onCancel={this.handleCancelGetCoords}
                  onConfirm={this.handleConfirmGetCoords}
                />
                  </div>
              </Form.Group>
              <Form.Group >
                {/*<br/>*/}
                <Statistic size='mini'>
                  <Statistic.Label>RA</Statistic.Label>
                  <Statistic.Value>{Number(this.props.target.ra).toFixed(4)}</Statistic.Value>
                </Statistic>
                <Statistic size='mini'>
                  <Statistic.Label>DEC</Statistic.Label>
                  <Statistic.Value>{Number(this.props.target.dec).toFixed(4)}</Statistic.Value>
                </Statistic>
                <Statistic size='mini'>
                  <Statistic.Label>Alt</Statistic.Label>
                  <Statistic.Value>{Number(this.state.alt).toFixed(4)}</Statistic.Value>
                </Statistic>
              </Form.Group>
                {/*
                  <Form.Group>
                  </Form.Group>

                <Label>Az <Label.Detail>{this.state.targetAZ}</Label.Detail></Label>
                <Label>Angle <Label.Detail>{Number(this.state.targetAngle).toFixed(4)}</Label.Detail></Label>
                <Label>HA <Label.Detail>{Number(this.state.targetHA).toFixed(4)}</Label.Detail></Label>
                <Label>Transit <Label.Detail>{Number(this.state.targetTransit).toFixed(4)}</Label.Detail></Label>

                search
                wrapSelection
                scrolling


                */}
              <Form.Group>
                <Form.Dropdown
                  selectOnNavigation={false}
                  button
                  search
                  wrapSelection
                  scrolling
                  label='SkySafari SkySets'
                  name='setSkysetFile_id'
                  options={SKYSETS}
                  placeholder='No SkySafari Files'
                  text={getSkySafariSkySetName(this.state.setSkysetFile_id)}
                  onChange={this.handleSkySetChange}
                  />
                {this.skysetButtons()}
              </Form.Group>
              <Form.Group>
                <input type="file" id="sFileinput" disabled={this.state.inProgress} ref="sFileinput"
                  onChange={this.uploadIt}/>
                {this.showUploads()}
              </Form.Group>
              <Form.Group>
                <Form.Field control={Dropdown}
                  button
                  search
                  wrapSelection
                  scrolling
                  label='Series'
                  name='seriesTemplate'
                  options={TAKESERIES}
                  placeholder='Series to use for Imaging'
                  text={TAKESERIESNAME}
                  onChange={this.handleSeriesChange}/>
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
          <Segment>
            <Form.Group>
              <Form.Input
                  label='OPTIONAL: Position Angle, north through east (per ImageLink)'
                  name='angle'
                  placeholder='Position angle per ImageLink (e.g. 0 for PEC capture)'
                  value={this.state.angle}
                  validations="isNumeric"
                  validationErrors={{ isNumeric: 'Must be a number' }}
                  errorLabel={ ERRORLABEL }
                  onChange={this.handleChange}/>
            </Form.Group>
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

        <Segment>
          <h4 className="ui header" style={{color: "#5FB343"}}>Priority: {TARGETPRIORITY}</h4>
          <ReactSimpleRange
            label
            step={1}
            min={1}
            max={19}
            value={Number(TARGETPRIORITY)}
            sliderSize={12}
            thumbSize={18}
            onChange={this.handlePriorityChange}
          />
        </Segment>
        <Segment>
          <h4 className="ui header" style={{color: "#5FB343"}}>Minimum Altitude: {MINIMUMALT}</h4>
          <ReactSimpleRange
            label
            step={.5}
            min={0}
            max={90}
            value={Number(MINIMUMALT)}
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
            button
            search
            wrapSelection
            scrolling
            label='ClosedLoopSlew Filter'
            name='clsFilter'
            options={FILTERS}
            placeholder='Filter for Close Loop Slew'
            text={this.state.clsFilter}
            onChange={this.handleChange}
          />
        </Form.Group>
            <h3 className="ui header">Focus</h3>
              <Form.Group widths='equal'>
                <Form.Field control={Dropdown}
                  button
                  search
                  wrapSelection
                  scrolling
                  search
                  label='Focus Filter'
                  name='focusFilter'
                  options={FILTERS}
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
                  validations={{
                    matchRegexp: XRegExpPosNum, // https://github.com/slevithan/xregexp#unicode
                  }}
                  validationError="Must be a positive number, e.g 1, .7, 1.1"
                  errorLabel={ ERRORLABEL }
                />
                <Form.Input
                  label='Use a focusing target '
                  name='focusTarget'
                  placeholder='e.g. HIP 66004'
                  value={this.state.focusTarget}
                  onChange={this.handleChange}
                />
              </Form.Group>
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
      <Segment secondary>
        <Form>
          <Tab menu={{ pointing: true }} renderActiveOnly={true} panes={panes} />
        </Form>
        {
          /*this.displayFiles()*/
        }
    </Segment>
    )
  }
}

export default withTracker(() => {
  const sFilesHandle = Meteor.subscribe('files.skysafari.all');
  const sDocsReadyYet = sFilesHandle.ready();
  const sFiles = SkySafariFiles.find({}, {sort: {name: 1}}).fetch();
  var ip = TheSkyXInfos.findOne({name: 'tsx_ip'});
  var port = TheSkyXInfos.findOne({name: 'tsx_port'});
  return {
      sDocsReadyYet,
      sFiles,
      ip,
      port,
      filters: Filters.find({}, { sort: { slot: 1 } }).fetch(),
//      targets1: TargetSessions.find({}, { sort: { name: 1 } }).fetch(),
      seriesTemplates: TakeSeriesTemplates.find({ isCalibrationFrames: false }, { sort: { name: 1 } }).fetch(),
  };
})(TargetEditor);
