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

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Session } from 'meteor/session'

// import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';

import {
  Label,
  Segment,
  Button,
  Progress,
  Accordion,
  Checkbox,
  Icon,

  Menu,
  Sidebar,
} from 'semantic-ui-react'

import {
  Form,
  Input,
  Dropdown,
  Radio,
} from 'formsy-semantic-ui-react';

// Import the API Model
import { Filters } from '../api/filters.js';
import { TheSkyXInfos } from '../api/theSkyXInfos.js';

// Import the UI
import Monitor from './Monitor.js';
import TargetSessionMenu from './TargetSessionMenu.js';
// import Filter from './Filter.js';
import Series from './Series.js';
import TakeSeriesTemplateMenu from './TakeSeriesTemplateMenu.js';
//import TheSkyXInfo from './TheSkyXInfo.js';

import {
  tsx_ServerStates,
  tsx_UpdateServerState,
  saveDefaultStateValue,
} from  '../api/serverStates.js';

import {
  renderDropDownFilters,
} from '../api/filters.js'

import {
  renderDropDownImagingBinnings,
  renderDropDownGuiderBinnings,
} from '../api/binnings.js'

import ReactSimpleRange from 'react-simple-range';
import Timekeeper from 'react-timekeeper';

const XRegExp = require('xregexp');
const XRegExpPosNum = XRegExp('^0$|(^([1-9]\\d*(\\.\\d+)?)$)|(^0?\\.\\d*[1-9]\\d*)$');
const XRegExpNonZeroPosInt = XRegExp('^([1-9]\\d*)$');
const XRegExpZeroOrPosInt = XRegExp('^(\\d|[1-9]\\d*)$');
const XRegExpZeroToNine = XRegExp('^\\d$');
const XRegExpNegToPosInt = XRegExp('^(\\+|-)?\\d+$');

const ERRORLABEL = <Label color="red" pointing/>

const eSetup = 0;
const eDither = 1;
const eGuider = 2;
const eFocuser =3;
const eCamera =4;
const eRotator = 5;
const eFilterWheel = 6;
const eDefaultConstrainsts =7;
const eStartStop = 8;
const eClouds = 9;
const eFlatbox = 10;
const eWeatherReports = 11;

// App component - represents the whole app
class DefaultSettings extends Component {

   constructor() {
     super();
     this.state = {
      defaultMinSunAlt: -15,
      defaultMinAlt: 30,
      defaultFocusTempDiff: 0.7,
      defaultMeridianFlip: true,
      defaultSoftPark: false,
      defaultStartTime: '20:00',
      defaultStopTime: '6:00',
      defaultPriority: 9,
      defaultSleepTime: 5,
      defaultDithering: 1,
      defaultFilter: '',
      currentStage: '',
      isTwilightEnabled: true,
      isFocus3Enabled: false,
      focus3Samples: 5,
      isFocus3Binned: false,
      focusRequiresCLS: true,

      focus3samples: 5,
      defaultGuideExposure: 7,
      defaultFocusExposure: 1,
      minDitherFactor: 3,
      maxDitherFactor: 7,
      isDitheringEnabled: false,
      imagingPixelSize: 3.8,
      imagingPixelMaximum: 65504,
      imagingFocalLength: 2800,
      defaultUseImagingCooler_enabled: false,
      defaultCoolTemp: '',
      imagingBinning: '1',
      guiderPixelSize: 3.8,
      guidingPixelErrorTolerance: 0.9,
      guider_camera_delay: 1.0,
      defaultGuiderBin: '1',

      defaultCLSEnabled: true,
      fovPositionAngleTolerance: 0.5,
      defaultFOVExposure: 4,
      defaultCLSRetries: 1,
      defaultCLSRepeat: 3600,
      calibrationFrameSize: 100,

      flatbox_device:'',
      flatbox_ip: '',
      flatbox_enabled: false,
      flatbox_camera_delay: 1,
      flatbox_lamp_on: false,
      flatbox_lamp_level: 0,
      flatbox_monitor_max_pixel: false,
      flatbox_imagingPixelMaximumOccurance: 1,

      ip: '',
      port: '',

      metroBlueReportWidget: 'boulder_united-states-of-america_5574991',
      clearSkyReportWidget: 'BldrCOkey.html?1',

      activeIndex: -1,

      //settingsIndex: 'TheSkyX Connection',
      sideBarSettingsVisible: true,

      isNoVNCEnabled: false,
      noVNCPWD: '',
      noVNCPort: '6080',
    };
  }

  // handleSettingsItemClick = (e, { name }) => {
  //   this.props.settingsIndex = name;
  // }

  handleClick = (e, titleProps) => {
     const { index } = titleProps
     const { activeIndex } = this.state
     const newIndex = activeIndex === index ? -1 : index

     this.setState({ activeIndex: newIndex })
  }

  // requires the ".bind(this)", on the callers
  handleToggle = (e, { name, value }) => {

    var val = eval( 'this.state.' + name);

    this.setState({
      [name]: !val
    });
    saveDefaultStateValue( name, value );
  };

  handleToggleAndSave = (e, { name, value }) => {
    var val = eval( 'this.state.' + name);

    this.setState({
      [name]: !val
    });
    saveDefaultStateValue( name, !val );
  };

  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value.trim() });
    saveDefaultStateValue( name, value );
  };

  handleStartChange = ( value ) => {
    console.log( ' Found start: ' + value.formatted24);
    this.setState({defaultStartTime: value.formatted24 });
    console.log( ' Saved start: ' + this.state.defaultStartTime );
    saveDefaultStateValue( 'defaultStartTime', value.formatted24 );
  }

  handleStopChange = ( value ) => {
    this.setState({defaultStopTime: value.formatted24 });
    saveDefaultStateValue( 'defaultStopTime', value.formatted24 );
  }

  handlePriorityChange = ( value ) => {
    this.setState({defaultPriority: value.value });
    saveDefaultStateValue( 'defaultPriority', value.value );
  }
  handleMenuItemClick = (e, { name }) => this.setState({ activeItem: name });
  saveServerFailedOpen = () => this.setState({ saveServerFailed: true });
  saveServerFailedClose = () => this.setState({ saveServerFailed: false });

  componentDidMount() {
    // Typical usage (don't forget to compare props):
    this.updateDefaults(this.props);
  }

  componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
    if (this.props.target !== prevProps.target) {
      this.updateDefaults(this.props);
    }
  }

  updateDefaults(nextProps) {
      if( typeof nextProps == 'undefined'  ) {
        return;
      }

      if( typeof nextProps.tsxInfo != 'undefined'  ) {

        // false === 'undefined' issues
        var val = nextProps.tsxInfo.find(function(element) {
          return element.name == 'flatbox_enabled';
        }).value;

        if( val == '' || typeof val == 'undefined') {
          val = false;
        }
        this.setState({
          flatbox_enabled: val,
        });

        val = nextProps.tsxInfo.find(function(element) {
          return element.name == 'focusRequiresCLS';
        }).value;

        if( typeof val === 'undefined' || val === '' ) {
          val = false;
        }

        this.setState({
          focusRequiresCLS: val,
        });

        this.setState({
          ip: nextProps.tsxInfo.find(function(element) {
            return element.name == 'ip';
          }).value,

          port: nextProps.tsxInfo.find(function(element) {
            return element.name == 'port';
          }).value,

          guider_camera_delay: nextProps.tsxInfo.find(function(element) {
            return element.name == 'guider_camera_delay';
          }).value,
          defaultCoolTemp: nextProps.tsxInfo.find(function(element) {
            return element.name == 'defaultCoolTemp';
          }).value,
          defaultUseImagingCooler_enabled: nextProps.tsxInfo.find(function(element) {
            return element.name == 'defaultUseImagingCooler_enabled';
          }).value,


          defaultImageAutoSavePattern: nextProps.tsxInfo.find(function(element) {
            return element.name == 'defaultImageAutoSavePattern';
          }).value,

          imagingBinning: nextProps.tsxInfo.find(function(element) {
            return element.name == 'imagingBinning';
          }).value,
          defaultGuiderBin: nextProps.tsxInfo.find(function(element) {
            return element.name == 'defaultGuiderBin';
          }).value,
          defaultMinSunAlt: nextProps.tsxInfo.find(function(element) {
            return element.name == 'defaultMinSunAlt';
          }).value,
          defaultFocusTempDiff: nextProps.tsxInfo.find(function(element) {
            return element.name == 'defaultFocusTempDiff';
          }).value,
          defaultMeridianFlip: Boolean(nextProps.tsxInfo.find(function(element) {
            return element.name == 'defaultMeridianFlip';
          }).value),
          defaultStartTime: nextProps.tsxInfo.find(function(element) {
            return element.name == 'defaultStartTime';
          }).value,
          defaultStopTime: nextProps.tsxInfo.find(function(element) {
            return element.name == 'defaultStopTime';
          }).value,
          defaultPriority: nextProps.tsxInfo.find(function(element) {
            return element.name == 'defaultPriority';
          }).value,
          currentStage: nextProps.tsxInfo.find(function(element) {
            return element.name == 'currentStage';
          }).value,
          defaultSoftPark: Boolean(nextProps.tsxInfo.find(function(element) {
            return element.name == 'defaultSoftPark';
          }).value),
          defaultMinAlt: nextProps.tsxInfo.find(function(element) {
            return element.name == 'defaultMinAlt';
          }).value,
          defaultSleepTime: nextProps.tsxInfo.find(function(element) {
            return element.name == 'defaultSleepTime';
          }).value,
          isTwilightEnabled: nextProps.tsxInfo.find(function(element) {
            return element.name == 'isTwilightEnabled';
          }).value,
          isFocus3Enabled: nextProps.tsxInfo.find(function(element) {
            return element.name == 'isFocus3Enabled';
          }).value,
          focus3Samples: nextProps.tsxInfo.find(function(element) {
            return element.name == 'focus3Samples';
          }).value,

          isFocus3Binned: nextProps.tsxInfo.find(function(element) {
            return element.name == 'isFocus3Binned';
          }).value,
          defaultGuideExposure: nextProps.tsxInfo.find(function(element) {
            return element.name == 'defaultGuideExposure';
          }).value,
          defaultDithering: nextProps.tsxInfo.find(function(element) {
            return element.name == 'defaultDithering';
          }).value,
          isDitheringEnabled: nextProps.tsxInfo.find(function(element) {
            return element.name == 'isDitheringEnabled';
          }).value,
          minDitherFactor: nextProps.tsxInfo.find(function(element) {
            return element.name == 'minDitherFactor';
          }).value,
          maxDitherFactor: nextProps.tsxInfo.find(function(element) {
            return element.name == 'maxDitherFactor';
          }).value,
          imagingPixelSize: nextProps.tsxInfo.find(function(element) {
            return element.name == 'imagingPixelSize';
          }).value,
          imagingPixelMaximum: nextProps.tsxInfo.find(function(element) {
            return element.name == 'imagingPixelMaximum';
          }).value,
          imagingFocalLength: nextProps.tsxInfo.find(function(element) {
            return element.name == 'imagingFocalLength';
          }).value,
          guiderPixelSize: nextProps.tsxInfo.find(function(element) {
            return element.name == 'guiderPixelSize';
          }).value,
          guidingPixelErrorTolerance: nextProps.tsxInfo.find(function(element) {
            return element.name == 'guidingPixelErrorTolerance';
          }).value,
          defaultFocusExposure: nextProps.tsxInfo.find(function(element) {
            return element.name == 'defaultFocusExposure';
          }).value,
          defaultCLSEnabled: nextProps.tsxInfo.find(function(element) {
            return element.name == 'defaultCLSEnabled';
          }).value,
          defaultFilter: nextProps.tsxInfo.find(function(element) {
            return element.name == 'defaultFilter';
          }).value,
          fovPositionAngleTolerance: nextProps.tsxInfo.find(function(element) {
            return element.name == 'fovPositionAngleTolerance';
          }).value,
          defaultFOVExposure: nextProps.tsxInfo.find(function(element) {
            return element.name == 'defaultFOVExposure';
          }).value,
          defaultCLSRetries: nextProps.tsxInfo.find(function(element) {
            return element.name == 'defaultCLSRetries';
          }).value,
          defaultCLSRepeat: nextProps.tsxInfo.find(function(element) {
            return element.name == 'defaultCLSRepeat';
          }).value,
          calibrationFrameSize: nextProps.tsxInfo.find(function(element) {
            return element.name == 'calibrationFrameSize';
          }).value,
          metroBlueReportWidget: nextProps.tsxInfo.find(function(element) {
            return element.name == 'metroBlueReportWidget';
          }).value,
          clearSkyReportWidget: nextProps.tsxInfo.find(function(element) {
            return element.name == 'clearSkyReportWidget';
          }).value,

          isNoVNCEnabled: nextProps.tsxInfo.find(function(element) {
            return element.name == 'isNoVNCEnabled';
          }).value,
          noVNCPWD: nextProps.tsxInfo.find(function(element) {
            return element.name == 'noVNCPWD';
          }).value,
          noVNCPort: nextProps.tsxInfo.find(function(element) {
            return element.name == 'noVNCPort';
          }).value,

          flatbox_ip: nextProps.tsxInfo.find(function(element) {
            return element.name == 'flatbox_ip';
          }).value,
          flatbox_device: nextProps.tsxInfo.find(function(element) {
            return element.name == 'flatbox_device';
          }).value,
          flatbox_camera_delay: nextProps.tsxInfo.find(function(element) {
            return element.name == 'flatbox_camera_delay';
          }).value,
          flatbox_lamp_on: nextProps.tsxInfo.find(function(element) {
            return element.name == 'flatbox_lamp_on';
          }).value,
          flatbox_monitor_max_pixel: nextProps.tsxInfo.find(function(element) {
            return element.name == 'flatbox_monitor_max_pixel';
          }).value,
          flatbox_imagingPixelMaximumOccurance: nextProps.tsxInfo.find(function(element) {
            return element.name == 'flatbox_imagingPixelMaximumOccurance';
          }).value,

          flatbox_lamp_level: nextProps.flatbox_lamp_level.value,

        });
      }
  }

  appButtons( state, active ) {
    // detective
    var DISABLE = true;
    var NOT_DISABLE = false;
    // then use as needed disabled={DISABLE} or disabled={NOT_DISABLE}
    if( state == 'Stop'  && active == false ){
      DISABLE = false;
      NOT_DISABLE = true;
    }
    return (
      <Button
        onClick={this.connectToTSX.bind(this)}
        style={{ backgroundColor: 'green', color: 'black'  }}
      >Refresh</Button>
    )
  }

  connectToTSX() {

    // these are all working methods
    // on the client
    Meteor.call("connectToTSX", function (error, result) {
      // identify the error
      if (error && error.reason === "Internal server error") {
        // show a nice error message
      }
      else {
      }
    }.bind(this));
  }

  renderServers() {
    if( this.props.settingsIndex !== 'TheSkyX Connection' ) {
      return;
    }

    const { activeIndex } = this.state;
    var mount = TheSkyXInfos.findOne().mount();
    var camera = TheSkyXInfos.findOne().camera();
    var guider = TheSkyXInfos.findOne().guider();
    var rotator = TheSkyXInfos.findOne().rotator();
    var efw = TheSkyXInfos.findOne().efw();
    var focuser = TheSkyXInfos.findOne().focuser();
    var CAMERA_BINS= TheSkyXInfos.findOne().cameraBins().value;

    var GUIDER_BINS = TheSkyXInfos.findOne().guiderBins().value;
    var NUM_FILTERS = TheSkyXInfos.findOne().numFilters().value;

    var RUNNING = '';
    var ACTIVE = false;
    try {
      RUNNING = this.props.scheduler_running.value;
      ACTIVE = this.props.tool_active.value;
    } catch (e) {
      RUNNING = '';
      ACTIVE=false;
    }
    var IMAGE_BINNINGS = renderDropDownImagingBinnings();

//    style={{color: '#68c349'}}
//      <Segment.Group compact>

    return (
      <Segment.Group compact>
      <Segment>
        <Form>
            <Form.Input
              label='TheSkyX Server IP Address'
              name='ip'
              placeholder='Enter TheSkyX IP address'
              value={this.state.ip}
              onChange={this.handleChange}
            />
            <Form.Input
              label='The SkyX Server Port'
              name='port'
              placeholder='Enter TheSkyX port'
              value={this.state.port}
              onChange={this.handleChange}
            />
        </Form>
      </Segment>
        &nbsp;<br/>
        <center>{this.appButtons(RUNNING, ACTIVE)}</center>
        <Segment><Label>Mount<Label.Detail>
          {mount.manufacturer + ' | ' + mount.model}
        </Label.Detail></Label></Segment>
        <Segment><Label>Camera<Label.Detail>
          {camera.manufacturer + ' | ' + camera.model}
          </Label.Detail></Label>
          <Label>Camera Bins<Label.Detail>
          {CAMERA_BINS}
          </Label.Detail></Label>
        </Segment>
        <Segment><Label>Autoguider<Label.Detail>
          {guider.manufacturer + ' | ' + guider.model}
          </Label.Detail></Label>
          <Label>Autoguider Bins<Label.Detail>
          {GUIDER_BINS}
          </Label.Detail></Label>
        </Segment>
        <Segment><Label>Filter Wheel<Label.Detail>
          {efw.manufacturer + ' | ' + efw.model}
          </Label.Detail></Label>
          <Label>Number of Filters<Label.Detail>
          {NUM_FILTERS}
          </Label.Detail></Label>
        </Segment>
        <Segment><Label>Focuser<Label.Detail>
          {focuser.manufacturer + ' | ' + focuser.model}
        </Label.Detail></Label></Segment>
        <Segment><Label>Rotator<Label.Detail>
          {rotator.manufacturer + ' | ' + rotator.model}
        </Label.Detail></Label></Segment>
      <Segment>
        <Form>
          <Form.Field control={Dropdown}
            fluid
            label='Default Image Binning'
            name='imagingBinning'
            options={IMAGE_BINNINGS}
            wrapSelection
            scrolling
            placeholder='Bin imaging camera'
            text={this.state.imagingBinning}
            onChange={this.handleChange}
          />
          <Form.Input
            label='Focal Length: '
            name='imagingFocalLength'
            placeholder='i.e. focal length in mm of OTA'
            value={this.state.imagingFocalLength}
            onChange={this.handleChange}
            validations={{
              matchRegexp: XRegExpNonZeroPosInt, // https://github.com/slevithan/xregexp#unicode
            }}
            validationError="Must be a positive number, e.g 1, 5, 1800, 3600"
            errorLabel={ ERRORLABEL }
          />
          <Form.Input
            disabled={true}
            label='Default AUTOSAVE Pattern: '
            name='defaultImageAutoSavePattern'
            placeholder='Same definition entered in TheSkyX, e.g. :t_:b'
            value={this.state.defaultImageAutoSavePattern}
            onChange={this.handleChange}
          />
        </Form>
      </Segment>
      </Segment.Group>
    )
  }

  renderFlatBox() {
    if( this.props.settingsIndex !== 'Artesky Flatbox' ) {
      return;
    }

    var DISABLED = true;
    try {
      if(
        this.state.flatbox_enabled // must be enabled...
        && this.props.scheduler_running.value === 'Stop' // if stopped can enable
        && this.props.tool_active.value === false // if no tool can enable
      ){
        DISABLED = false;
      }
    } catch (e) {
      console.log( e )
      DISABLED = true;
    }
//    style={{color: '#68c349'}}

    return (
      <Segment.Group compact>
        <Segment tertiary>
          <Checkbox
            label='Enable Artseky Flatbox'
            name='flatbox_enabled'
            toggle
            checked={this.state.flatbox_enabled}
            onClick={this.handleToggleAndSave.bind(this)}
            style={{ labelColor: 'black'  }}
          />
          &nbsp;
          <Button
            disabled={DISABLED}
            onClick={this.testArteskyConnection.bind(this)}
            style={{ backgroundColor: 'green', color: 'black'  }}
          >TEST CONNECTION</Button>
        </Segment>
        <Segment>
          <Form>
            <Form.Input
              disabled={DISABLED}
              label='Artseky Flatbox Server IP'
              name='flatbox_ip'
              placeholder='Enter artesky_srv IP address, e.g. 127.0.0.1'
              value={this.state.flatbox_ip}
              onChange={this.handleChange}
            />
            <Form.Input
              disabled={true}
              label='Artseky Flatbox Device Port'
              name='flatbox_device'
              placeholder='Assumes /dev/ttyACM0'
              value={this.state.flatbox_device}
              onChange={this.handleChange}
            />
            <Form.Input
              disabled={DISABLED}
              label='Calibration image delay '
              name='flatbox_camera_delay'
              placeholder='Seconds to wait e.g. 1.3'
              value={this.state.flatbox_camera_delay}
              onChange={this.handleChange}
            />
            &nbsp; <br/>
          </Form>
        </Segment>
        <Segment>
          <Checkbox
            label='Turn on lamp'
            name='flatbox_lamp_on'
            disabled={DISABLED}
            toggle
            checked={this.state.flatbox_lamp_on}
            onClick={this.handleArteskyLampToggle.bind(this)}
            style={{ labelColor: 'black'  }}
          />
          &nbsp;
          &nbsp;
          <Button
            disabled={DISABLED}
            onClick={this.statusArtesky.bind(this)}
            style={{ backgroundColor: 'green', color: 'black'  }}
          >STATUS</Button>
          &nbsp; <br/>
          &nbsp; <br/>
          <Checkbox
            label='Monitor MaximumPixel, to reduce level'
            name='flatbox_monitor_max_pixel'
            disabled={DISABLED}
            toggle
            checked={this.state.flatbox_monitor_max_pixel}
            onClick={this.handleToggleAndSave.bind(this)}
            style={{ labelColor: 'black'  }}
          />
          &nbsp; <br/>
          <Form>
          <Form.Input
            disabled={DISABLED}
            label='Lower level after '
            name='flatbox_imagingPixelMaximumOccurance'
            placeholder='Maximum times in a row to allow Maximum Pixel value, e.g. 1'
            value={this.state.flatbox_imagingPixelMaximumOccurance}
            onChange={this.handleChange}
            validations={{
              matchRegexp: XRegExpNonZeroPosInt, // https://github.com/slevithan/xregexp#unicode
            }}
            validationError="Must be a positive number, e.g 1, 5, 1800, 3600"
            errorLabel={ ERRORLABEL }
          />
          </Form>
          &nbsp; <br/>
          {this.renderArteskyLevel(DISABLED)}
        </Segment>
        <Segment>
          <Label>
            REQUIREMENT:
            <Label.Detail>
            <a href='https://github.com/maudy2u/artesky_flat_box'>ARTEKSY_SRV</a> needs
            to be installed on the PC<br/>
            connected to the ARTESKY FLATBOX.<br/>
            CLick to learn more.
            </Label.Detail>
          </Label>
        </Segment>
      </Segment.Group>
    )
  }
  renderArteskyLevel( no_show ) {
    if( !no_show) {
      return (
        <left>
        &nbsp;
        <h4 style={{color: "#5FB343"}} className="ui header">Lamp level: {this.state.flatbox_lamp_level}</h4>
          <ReactSimpleRange
            label
            step={1}
            min={1}
            max={254}
            value={Number(this.state.flatbox_lamp_level)}
            sliderSize={12}
            thumbSize={18}
            onChange={this.handleLampLevelChange}
            onChangeComplete={this.arteskySetLampLevel.bind(this)}
          />
        </left>
      )
    }
  }

  testArteskyConnection() {
    // these are all working methods
    // on the client
    Meteor.call("testArteskyConnection", function (error, result) {
      // identify the error
      if (result === false || (error && error.reason === "Internal server error")) {
        // show a nice error message
        alert('Artesky connection failed: ' + result);

      }
      else {
        alert('Artesky connection SUCCESSFUL ' + result);
      }
    }.bind(this));
  }

  statusArtesky() {
      // these are all working methods
      // on the client
      Meteor.call("artesky_status", function (error, result) {
        // identify the error
        if (result === false || (error && error.reason === "Internal server error")) {
          // show a nice error message
          alert('Artesky staus failed: ' + result);

        }
        else {
          alert('Artesky status: ' + result);
        }
      }.bind(this));
    }

  handleArteskyLampToggle = () => {

    if( !this.state.flatbox_lamp_on ) {
      // these are all working methods
      // on the client
      Meteor.call("artesky_on", function (error, result) {
        // identify the error
        if (result === false || (error && error.reason === "Internal server error")) {
          // show a nice error message
          alert('Artesky Lamp ON failed. Try again (may be out of sync.)');
        }
        else {
          this.setState({
            flatbox_lamp_on: true
          });
          saveDefaultStateValue( 'flatbox_lamp_on', true );
        }
      }.bind(this));
    }
    else {
      Meteor.call("artesky_off", function (error, result) {
        // identify the error
        if (result === false || (error && error.reason === "Internal server error")) {
          // show a nice error message
          alert('Artesky Lamp OFF failed. Try again (may be out of sync.)');

        }
        else {
          this.setState({
            flatbox_lamp_on: false
          });
          saveDefaultStateValue( 'flatbox_lamp_on', false );
        }
      }.bind(this));
    }
  }

  handleLampLevelChange = ( value ) => {
    this.setState({flatbox_lamp_level: value.value });
    saveDefaultStateValue( 'flatbox_lamp_level', value.value );
  }

  arteskySetLampLevel() {
    Meteor.call("artesky_level", Number(this.state.flatbox_lamp_level), function (error, result) {
      // identify the error
      if (result === false || (error && error.reason === "Internal server error")) {
        // show a nice error message
        alert('Artesky Level failed');
      }
    }.bind(this));
  }

  renderConstraints() {

    if( this.props.settingsIndex !== 'Default Constraints' ) {
      return;
    }

    const { activeIndex } = this.state

    return (
      <Segment.Group compact>
      <Segment>

      <h4 style={{color: "#5FB343"}} className="ui header">Priority: {this.state.defaultPriority}</h4>
        <ReactSimpleRange
          label
          step={1}
          min={1}
          max={19}
          value={Number(this.state.defaultPriority)}
          sliderSize={12}
          thumbSize={18}
          onChange={this.handlePriorityChange}
        />
      <Form>
      <Form.Input
        label='Twilight Altitude for Sun '
        name='defaultMinSunAlt'
        placeholder='Enter negative degrees below horizon'
        value={this.state.defaultMinSunAlt}
        onChange={this.handleChange}
        validations="isNumeric"
        validationErrors={{ isNumeric: 'Must be a number' }}
        errorLabel={ ERRORLABEL }
      />
      <Form.Input
        label='Minimum Altitude '
        name='defaultMinAlt'
        placeholder='Enter Minimum Altitude to start/stop'
        value={this.state.defaultMinAlt}
        onChange={this.handleChange}
        validations={{
          matchRegexp: XRegExpPosNum, // https://github.com/slevithan/xregexp#unicode
        }}
        validationError="Must be a positive number, e.g 45, 43.7, 1.1"
        errorLabel={ ERRORLABEL }
      />
      </Form>
      </Segment>
      </Segment.Group>
    )
  }

  renderStartStopTimes() {
    if( this.props.settingsIndex !== 'Default Start/Stop Times' ) {
      return;
    }

    var startT = `${this.state.defaultStartTime}`
    var stopT = `${this.state.defaultStopTime}`
    const { activeIndex } = this.state

    return (
      <Segment.Group compact>
        <Segment raised>
           <h4 className="ui header">Set Default START time</h4>
           <Timekeeper
             time={this.state.defaultStartTime}
             value={startT}
             onChange={this.handleStartChange}
           />
         </Segment>
         <Segment raised>
           <h4 className="ui header">Set Default STOP time</h4>
           {/* <DateTime />pickerOptions={{format:"LL"}} value="2017-04-20"/> */}
           <Timekeeper
             time={this.state.defaultStopTime}
             value={stopT}
             onChange={this.handleStopChange}
           />
         </Segment>
       </Segment.Group>
    )
  }

  renderDithering() {
    if( this.props.settingsIndex !== 'Dithering' ) {
      return;
    }

    const { activeIndex } = this.state
    var DISABLE = !this.state.isDitheringEnabled;

    return (
      <Segment.Group compact>
        <Segment tertiary>
          <Checkbox
            label=' Enable Dithering'
            name='isDitheringEnabled'
            toggle
            checked={this.state.isDitheringEnabled}
            onClick={this.handleToggleAndSave.bind(this)}
            style={{ labelColor: 'black'  }}
          />
        </Segment>
        <Segment>
          <Form>
            <Form.Input
              disabled={DISABLE}
              label='Dithering Minimum Pixel Move '
              name='minDitherFactor'
              placeholder='Minimum number of pixels'
              value={this.state.minDitherFactor}
              onChange={this.handleChange}
              validations={{
                matchRegexp: XRegExpNonZeroPosInt, // https://github.com/slevithan/xregexp#unicode
              }}
              validationError="Must be a positive number, e.g 1, 5, 1800, 3600"
              errorLabel={ ERRORLABEL }
            />
            <Form.Input
              disabled={DISABLE}
              label='Dithering Maximum Pixel Move '
              name='maxDitherFactor'
              placeholder='Maximum number of pixels'
              value={this.state.maxDitherFactor}
              onChange={this.handleChange}
              validations={{
                matchRegexp: XRegExpNonZeroPosInt, // https://github.com/slevithan/xregexp#unicode
              }}
              validationError="Must be a positive number, e.g 1, 5, 1800, 3600"
              errorLabel={ ERRORLABEL }
            />
          </Form>
          </Segment>
        </Segment.Group>
    )
  }

  renderRotator() {
    if( this.props.settingsIndex !== 'Rotator' ) {
      return;
    }

    const { activeIndex } = this.state

    return (
      <Segment.Group compact>
      <Segment>

        <Form>
          <Form.Input
            label='FOV Angle Tolerance '
            name='fovPositionAngleTolerance'
            placeholder='e.g. 0.5 (zero disables)'
            value={this.state.fovPositionAngleTolerance}
            onChange={this.handleChange}
            validations={{
              matchRegexp: XRegExpPosNum, // https://github.com/slevithan/xregexp#unicode
            }}
            validationError="Must be a positive number, e.g 1, .7, 1.1"
            errorLabel={ ERRORLABEL }
          />
          <Form.Input
            label='FOV Angle Exposure '
            name='defaultFOVExposure'
            placeholder='Enter number seconds'
            value={this.state.defaultFOVExposure}
            onChange={this.handleChange}
            validations={{
              matchRegexp: XRegExpPosNum, // https://github.com/slevithan/xregexp#unicode
            }}
            validationError="Must be a positive number, e.g 1, .7, 1.1"
            errorLabel={ ERRORLABEL }
          />
        </Form>
        </Segment>
        </Segment.Group>
    )
  }

  renderGuider() {
    if( this.props.settingsIndex !== 'Guider' ) {
      return;
    }

    const { activeIndex } = this.state

    let GUIDER_BINNINGS = '';
    try {
      GUIDER_BINNINGS = renderDropDownGuiderBinnings();
    }
    catch ( e ) {
      GUIDER_BINNINGS = [];
    }

    return (
      <Segment.Group compact>
        <Segment>

        <Form>
          <Form.Input
            label='AutoGuider Exposure '
            name='defaultGuideExposure'
            placeholder='Enter number seconds'
            value={this.state.defaultGuideExposure}
            onChange={this.handleChange}
            validations={{
              matchRegexp: XRegExpPosNum, // https://github.com/slevithan/xregexp#unicode
            }}
            validationError="Must be a positive number, e.g 1, .7, 1.1"
            errorLabel={ ERRORLABEL }
          />
          <Form.Input
            label='Guiding Tolerance '
            name='guidingPixelErrorTolerance'
            placeholder='i.e. pixel scale to settle before starting image'
            value={this.state.guidingPixelErrorTolerance}
            onChange={this.handleChange}
            validations={{
              matchRegexp: XRegExpPosNum, // https://github.com/slevithan/xregexp#unicode
            }}
            validationError="Must be a positive number, e.g 1, .7, 1.1"
            errorLabel={ ERRORLABEL }
          />
          <Form.Input
            label='Guiding image delay '
            name='guider_camera_delay'
            placeholder='Seconds to wait e.g. 1.3'
            value={this.state.guider_camera_delay}
            onChange={this.handleChange}
          />
          <Form.Field control={Dropdown}
            fluid
            label='Default Guider Binning'
            name='defaultGuiderBin'
            options={GUIDER_BINNINGS}
            wrapSelection
            scrolling
            placeholder='Bin guider image'
            text={this.state.defaultGuiderBin}
            onChange={this.handleChange}
          />
          <Form.Input
            label='Guide Camera Pixel Size: '
            name='guiderPixelSize'
            placeholder='i.e. guider pixel scale'
            value={this.state.guiderPixelSize}
            onChange={this.handleChange}
            validations={{
              matchRegexp: XRegExpPosNum, // https://github.com/slevithan/xregexp#unicode
            }}
            validationError="Must be a positive number, e.g 1, .7, 1.1"
            errorLabel={ ERRORLABEL }
          />
          <Form.Input
            label='Calibration Frame '
            name='calibrationFrameSize'
            placeholder='Frame size (pixels) '
            value={this.state.calibrationFrameSize}
            onChange={this.handleChange}
            validations={{
              matchRegexp: XRegExpNonZeroPosInt, // https://github.com/slevithan/xregexp#unicode
            }}
            validationError="Must be a positive number, e.g 1, 5, 1800, 3600"
            errorLabel={ ERRORLABEL }
          />
        </Form>
        </Segment>
        </Segment.Group>
    )
  }

  renderFilterWheel() {
    if( this.props.settingsIndex !== 'Filter Wheel' ) {
      return;
    }

    const { activeIndex } = this.state;

    let aFilters = '';
    let FILTERS = '';
    let numFilters = '';
    try {
      numFilters = this.props.filters.length
      aFilters = this.props.filters;
      FILTERS = renderDropDownFilters( aFilters );
    }
    catch ( e ) {
      FILTERS = [];
    }

    return (
      <Segment.Group compact >
        <Segment>

        <Form>
        <Form.Field control={Dropdown}
          fluid
          label='Default Filter'
          name='defaultFilter'
          options={FILTERS}
          wrapSelection
          scrolling
          placeholder='Used CLS and Focusing'
          text={this.state.defaultFilter}
          onChange={this.handleChange}
        />
        &nbsp;<br/>
        &nbsp;<br/>
        &nbsp;<br/>
        &nbsp;<br/>
        &nbsp;<br/>
        &nbsp;<br/>
        &nbsp;<br/>
        &nbsp;<br/>
        &nbsp;<br/>
        &nbsp;<br/>
        &nbsp;<br/>
        &nbsp;<br/>
        </Form>
        </Segment>
        </Segment.Group>
    )
  }

  renderImager() {
    if( this.props.settingsIndex !== 'Imaging Camera' ) {
      return;
    }

    const { activeIndex } = this.state;

    var IMAGE_BINNINGS = renderDropDownImagingBinnings();
    var NOT_DISABLE_TEMP  = false;
    try {
      NOT_DISABLE_TEMP= !this.state.defaultUseImagingCooler_enabled;
    }
    catch ( e ) {
      IMAGE_BINNINGS = [];
      NOT_DISABLE_TEMP = true;
    }


    return (
      <Segment.Group compact>
      <Segment>
        <Form>
          <Form.Input
            label='Image Camera Pixel Size: '
            name='imagingPixelSize'
            placeholder='i.e. image scale for dithering, and angle match'
            value={this.state.imagingPixelSize}
            onChange={this.handleChange}
            validations={{
              matchRegexp: XRegExpPosNum, // https://github.com/slevithan/xregexp#unicode
            }}
            validationError="Must be a positive number, e.g 1, .7, 1.1"
            errorLabel={ ERRORLABEL }
          />
          <Form.Input
            disabled={NOT_DISABLE_TEMP}
            label='Image Camera MAXIMUM pixel value: '
            name='defaultCoolTemp'
            placeholder='e.g. 16 bit can use 65504 '
            value={this.state.imagingPixelMaximum}
            onChange={this.handleChange}
            validations={{
              matchRegexp: XRegExpNonZeroPosInt, // https://github.com/slevithan/xregexp#unicode
            }}
            validationError="Must be a real number, e.g -20, -1, 0, 3, 5, ..."
            errorLabel={ ERRORLABEL }
          />
          <Form.Field control={Dropdown}
            fluid
            label='Default Image Binning'
            name='imagingBinning'
            options={IMAGE_BINNINGS}
            wrapSelection
            scrolling
            placeholder='Bin imaging camera'
            text={this.state.imagingBinning}
            onChange={this.handleChange}
          />
        </Form>
        </Segment>
        <Segment tertiary>
        <Checkbox
          label='Use imaging cooler'
          name='defaultUseImagingCooler_enabled'
          toggle
          checked={this.state.defaultUseImagingCooler_enabled}
          onClick={this.handleToggleAndSave.bind(this)}
          style={{ labelColor: 'black'  }}
        />
        </Segment>
        <Segment>
        <Form>
          <Form.Input
            disabled={NOT_DISABLE_TEMP}
            label='Image cooler temperature: '
            name='defaultCoolTemp'
            placeholder='i.e. image scale for dithering, and angle match'
            value={this.state.defaultCoolTemp}
            onChange={this.handleChange}
            validations={{
              matchRegexp: XRegExpNegToPosInt, // https://github.com/slevithan/xregexp#unicode
            }}
            validationError="Must be a real number, e.g -20, -1, 0, 3, 5, ..."
            errorLabel={ ERRORLABEL }
          />
        </Form>
        </Segment>
        </Segment.Group>
    )
  }

  renderFocuser() {
    if( this.props.settingsIndex !== 'Focuser' ) {
      return;
    }

    const { activeIndex } = this.state;

    return (
        <Segment.Group compact>
          <Segment tertiary>
            <Checkbox
              style={{color: '#68c349'}}
              label='CLS before focusing in case of clouds'
              name='focusRequiresCLS'
              toggle
              checked={this.state.focusRequiresCLS}
              onClick={this.handleToggleAndSave.bind(this)}
            />
          </Segment>
          <Segment>
            <Form>
              <Form.Input
                label='Starting Focusing Exposure '
                name='defaultFocusExposure'
                placeholder='Enter seconds'
                value={this.state.defaultFocusExposure}
                onChange={this.handleChange}
                validations={{
                  matchRegexp: XRegExpPosNum, // https://github.com/slevithan/xregexp#unicode
                }}
                validationError="Must be a positive number, e.g 1, .7, 1.1"
                errorLabel={ ERRORLABEL }
              />
            <Form.Input
              label='Focus Temp Tolerance '
              name='defaultFocusTempDiff'
              placeholder='Temp diff to run auto focus'
              value={this.state.defaultFocusTempDiff}
              onChange={this.handleChange}
              validations={{
                matchRegexp: XRegExpPosNum, // https://github.com/slevithan/xregexp#unicode
              }}
              validationError="Must be a positive number, e.g 1, .7, 1.1"
              errorLabel={ ERRORLABEL }
            />
            <Form.Input
              label='@Focus3 samples '
              name='focus3Samples'
              placeholder='Number of samples to take'
              value={this.state.focus3Samples}
              onChange={this.handleChange}
              validations={{
                matchRegexp: XRegExpNonZeroPosInt, // https://github.com/slevithan/xregexp#unicode
              }}
              validationError="Must be a positive number, e.g 1, 2, 3, 5..."
              errorLabel={ ERRORLABEL }
            />
            </Form>
          </Segment>
        </Segment.Group>
    )
  }

  renderClouds() {
    if( this.props.settingsIndex !== 'Clouds' ) {
      return;
    }

    const { activeIndex } = this.state;

    return (
      <div>
      <Accordion.Title
        active={activeIndex === eClouds}
        index={eClouds}
        onClick={this.handleClick}
      >
      <Icon name='cloud' size='large' />
      Clouds
      </Accordion.Title>
      <Accordion.Content  active={activeIndex === eClouds} >
        <Segment.Group compact>
        <Segment tertiary>
          <Checkbox
            style={{color: '#68c349'}}
            label='CLS before focusing in case of clouds'
            name='focusRequiresCLS'
            toggle
            checked={this.state.focusRequiresCLS}
            onClick={this.handleToggleAndSave.bind(this)}
          />
        </Segment>
        <Segment>
          <Form>
            <Form.Input
              label='Minutes to sleep when no target '
              name='defaultSleepTime'
              placeholder='Minutes to sleep'
              value={this.state.defaultSleepTime}
              onChange={this.handleChange}
              validations={{
                matchRegexp: XRegExpPosNum, // https://github.com/slevithan/xregexp#unicode
              }}
              validationError="Must be a positive number, e.g 1, .7, 1.1"
              errorLabel={ ERRORLABEL }
            />
            <Form.Input
              label='CloseLoopSlew Retries  '
              name='defaultCLSRetries'
              placeholder='Number of CLS retries - think cloud checking'
              value={this.state.defaultCLSRetries}
              onChange={this.handleChange}
              validations={{
                matchRegexp: XRegExpZeroToNine, // https://github.com/slevithan/xregexp#unicode
              }}
              validationError="Must be between 0-9"
              errorLabel={ ERRORLABEL }
            />
            <Form.Input
              label='CloseLoopSlew Redo  '
              name='defaultCLSRepeat'
              placeholder='Number seconds before CLS redo - think cloud checking'
              value={this.state.defaultCLSRepeat}
              onChange={this.handleChange}
              validations={{
                matchRegexp: XRegExpZeroOrPosInt, // https://github.com/slevithan/xregexp#unicode
              }}
              validationError="Must be a positive number, e.g 0, 5, 1800, 3600"
              errorLabel={ ERRORLABEL }
            />
            </Form>
          </Segment>
        </Segment.Group>
        </Accordion.Content>
        </div>
    )
  }

  renderWeatherReports() {
    if( this.props.settingsIndex !== 'Weather' ) {
      return;
    }

    const { activeIndex } = this.state;

    return (
      <div>
      <Accordion.Title
        active={activeIndex === eWeatherReports}
        index={eWeatherReports}
        onClick={this.handleClick}
      >
      <Icon name='mixcloud' size='large' />
      Weather Reports
      </Accordion.Title>
      <Accordion.Content  active={activeIndex === eWeatherReports} >
        <Segment.Group>
        <Segment>
          <Form>
            <Form.Input
              label='Metroblue Widget City code  '
              name='metroBlueReportWidget'
              placeholder='e.g. boulder_united-states-of-america_5574991'
              value={this.state.metroBlueReportWidget}
              onChange={this.handleChange}
            />
            <Form.Input
              label='ClearSky Widget City code  '
              name='clearSkyReportWidget'
              placeholder='e.g. BldrCOkey.html?1'
              value={this.state.clearSkyReportWidget}
              onChange={this.handleChange}
            />
            </Form>
          </Segment>
        </Segment.Group>
      </Accordion.Content>
    </div>
    )
  }
  rendernoVNC() {
    if( this.props.settingsIndex !== 'noVNC' ) {
      return;
    }

    const { activeIndex } = this.state
    var DISABLE = !this.state.isNoVNCEnabled;

    return (
      <Segment.Group compact>
        <Segment tertiary>
          <Checkbox
            label=' Enable noVNC'
            name='isNoVNCEnabled'
            toggle
            checked={this.state.isNoVNCEnabled}
            onClick={this.handleToggleAndSave.bind(this)}
            style={{ labelColor: 'black'  }}
          />
        </Segment>
        <Segment>
          <Form>
            <Form.Input
              disabled={DISABLE}
              label='noVNC password to log in '
              name='noVNCPWD'
              placeholder='If your VNC server needs a password enter here'
              value={this.state.noVNCPWD}
              onChange={this.handleChange}
            />
            <Form.Input
              disabled={DISABLE}
              label='Enter port for noVNC URL, e.g. 6080'
              name='noVNCPort'
              placeholder='Default is 6080'
              value={this.state.noVNCPort}
              onChange={this.handleChange}
              validations={{
                matchRegexp: XRegExpNonZeroPosInt, // https://github.com/slevithan/xregexp#unicode
              }}
              validationError="Must be a positive number, e.g 1, 5, 1800, 3600"
              errorLabel={ ERRORLABEL }
            />
          </Form>
          </Segment>
        </Segment.Group>
    )
  }

  // *******************************
  //
  render() {
    const timeOptions = {
      //inline: true,
      format: 'YYYY-MM-DD HH:mm',
      sideBySide: true,
      // icons: time,
      // minDate: new Date(),
    };
    // const handleToggle = () => this.handleToggle;

/* used in the segement:
<Sidebar.Pusher>
  <Segment basic onClick={this.pushSettingsToggle} >
*/
    return (
      <div>
        <Sidebar.Pushable width='very thin' as={Segment}>
          <Sidebar
            as={Menu}
            animation='overlay'
            icon='labeled'
            inverted
            vertical
            visible={this.props.sideBarSettingsVisible}
            width='thin'
          >
            <Menu.Item fitted as='a' name='TheSkyX Connection' onClick={this.props.handleSettingsItemClick} >
              <Icon name='star' fitted={true} size='mini' />
              TheSkyX Connection
            </Menu.Item>
            <Menu.Item fitted as='a' name='Weather' onClick={this.props.handleSettingsItemClick} >
              <Icon name='mixcloud' size='mini' />
              Weather Reports
            </Menu.Item>
            <Menu.Item fitted as='a' name='Guider' onClick={this.props.handleSettingsItemClick} >
              <Icon name='chart line' size='mini' />
              Guider
            </Menu.Item>
            <Menu.Item fitted as='a' name='Dithering' onClick={this.props.handleSettingsItemClick} >
              <Icon name='moon' size='mini' />
              Dithering
            </Menu.Item>
            <Menu.Item fitted as='a' name='Imaging Camera' onClick={this.props.handleSettingsItemClick} >
              <Icon name='camera' size='mini' />
              Imaging Camera
            </Menu.Item>
            <Menu.Item fitted as='a' name='Focuser' onClick={this.props.handleSettingsItemClick} >
              <Icon name='adjust' size='mini' />
              Focuser
            </Menu.Item>
            <Menu.Item fitted as='a' name='Rotator' onClick={this.props.handleSettingsItemClick} >
              <Icon name='crop' size='mini' />
              Rotator
            </Menu.Item>
            <Menu.Item fitted as='a' name='Filter Wheel' onClick={this.props.handleSettingsItemClick} >
              <Icon name='filter' size='mini' />
              Filter Wheel
            </Menu.Item>
            <Menu.Item fitted as='a' name='Default Constraints' onClick={this.props.handleSettingsItemClick} >
              <Icon name='settings' size='mini' />
              Default Constraints
            </Menu.Item>
            <Menu.Item fitted as='a' name='Clouds' onClick={this.props.handleSettingsItemClick} >
              <Icon name='cloud' size='mini' />
              Clouds
            </Menu.Item>
            <Menu.Item fitted as='a' name='Default Start/Stop Times' onClick={this.props.handleSettingsItemClick} >
              <Icon name='time' size='mini' />
              Default Start/Stop Times
            </Menu.Item>
            <Menu.Item fitted as='a' name='noVNC' onClick={this.props.handleSettingsItemClick} >
              <Icon name='tv' size='mini' />
              noVNC
            </Menu.Item>
            <Menu.Item fitted as='a' name='Artesky Flatbox' onClick={this.props.handleSettingsItemClick} >
              <Icon name='chart area' size='mini' />
              Artesky Flatbox
            </Menu.Item>
          </Sidebar>
          <Sidebar.Pusher onClick={this.props.hideSideBar } >
          <center>
            <Segment basic compact onClick={this.props.hideSideBar } >
            {this.renderServers()}
            {this.renderWeatherReports()}
            {this.renderGuider()}
            {this.renderDithering()}
            {this.renderImager()}
            {this.renderFocuser()}
            {this.renderRotator()}
            {this.renderFilterWheel()}
            {this.renderConstraints()}
            {this.renderClouds()}
            {this.renderStartStopTimes()}
            {this.rendernoVNC()}
            {this.renderFlatBox()}
            </Segment>
            </center>
          </Sidebar.Pusher>
          &nbsp;<br/>
          &nbsp;<br/>
          &nbsp;<br/>
          &nbsp;<br/>
          &nbsp;<br/>
          &nbsp;<br/>
          &nbsp;<br/>
          &nbsp;<br/>
          &nbsp;<br/>
          &nbsp;<br/>
          &nbsp;<br/>
          &nbsp;<br/>
          &nbsp;<br/>
        </Sidebar.Pushable>
    </div>
    );
  }
}

// *******************************
// THIS IS THE DEFAULT EXPORT AND IS WHERE THE LOADING OF THE COMPONENT STARTS
// USE THIS POINT TO GRAB THE FILTERS
export default withTracker(() => {
    const infoHandle = Meteor.subscribe('tsxInfo.all');
    const tsxInfo = TheSkyXInfos.find({}).fetch();
    var flatbox_lamp_level = TheSkyXInfos.findOne({name: 'flatbox_lamp_level'});

    return {
      flatbox_lamp_level,
      filters: Filters.find({}, { sort: { slot: 1 } }).fetch(),
  };
})(DefaultSettings);
