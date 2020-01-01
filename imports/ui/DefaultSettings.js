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

import ReactSimpleRange from 'react-simple-range';
import Timekeeper from 'react-timekeeper';

const XRegExp = require('xregexp');
const XRegExpPosNum = XRegExp('^0$|(^([1-9]\\d*(\\.\\d+)?)$)|(^0?\\.\\d*[1-9]\\d*)$');
const XRegExpNonZeroPosInt = XRegExp('^([1-9]\\d*)$');
const XRegExpZeroOrPosInt = XRegExp('^(\\d|[1-9]\\d*)$');
const XRegExpZeroToNine = XRegExp('^\\d$');

const ERRORLABEL = <Label color="red" pointing/>

const eSetup = 0;
const eDefaultConstrainsts =1;
const eStartStop = 2;
const eClouds = 3;
const eGuider = 4;
const eFocuser =5;
const eFilterWheel = 6;
const eRotator = 7;
const eCamera =8;
const eMount = 9;

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
      focus3samples: 5,
      defaultGuideExposure: 7,
      defaultFocusExposure: 1,
      minDitherFactor: 3,
      maxDitherFactor: 7,
      imagingPixelSize: 3.8,
      imagingFocalLength: 2800,
      guiderPixelSize: 3.8,
      guidingPixelErrorTolerance: 0.9,
      defaultCLSEnabled: true,
      fovPositionAngleTolerance: 0.5,
      defaultFOVExposure: 4,
      defaultCLSRetries: 1,
      defaultCLSRepeat: 3600,
      calibrationFrameSize: 100,

      flatbox_device:'',
      flatbox_ip: '',
      flatbox_enabled: false,

      ip: '',
      port: '',

      activeIndex: 0,
    };
  }

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

  // componentWillMount() {
  //   this.updateDefaults(this.props);
  // }

  componentDidMount() {
    this.updateDefaults(this.props);
  }

  updateDefaults(nextProps) {
      if( typeof nextProps == 'undefined'  ) {
        return;
      }

      if( typeof nextProps.tsxInfo != 'undefined'  ) {
        // false === 'undefined' issues
        this.setState({
          flatbox_enabled: nextProps.tsxInfo.find(function(element) {
            return element.name == 'flatbox_enabled';
        }).value});

        this.setState({
          ip: nextProps.tsxInfo.find(function(element) {
            return element.name == 'ip';
          }).value,
          port: nextProps.tsxInfo.find(function(element) {
            return element.name == 'port';
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
          minDitherFactor: nextProps.tsxInfo.find(function(element) {
            return element.name == 'minDitherFactor';
          }).value,
          maxDitherFactor: nextProps.tsxInfo.find(function(element) {
            return element.name == 'maxDitherFactor';
          }).value,
          imagingPixelSize: nextProps.tsxInfo.find(function(element) {
            return element.name == 'imagingPixelSize';
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

          flatbox_ip: nextProps.tsxInfo.find(function(element) {
            return element.name == 'flatbox_ip';
          }).value,
          flatbox_device: nextProps.tsxInfo.find(function(element) {
            return element.name == 'flatbox_device';
          }).value,
        });
      }
  }

  // *******************************
  //
  renderServers() {
    const { activeIndex } = this.state

    return (
      <div>
      <Accordion.Title
        active={activeIndex === eSetup}
        content='System Setup'
        index={eSetup}
        onClick={this.handleClick}
        />
      <Accordion.Content  active={activeIndex === eSetup} >
      <Form>
        <Form.Group>
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
        </Form.Group>
        <Form.Group>
          <Checkbox
            label='Enable Artseky Flatbox'
            name='flatbox_enabled'
            toggle
            checked={this.state.flatbox_enabled}
            onClick={this.handleToggleAndSave.bind(this)}
          />
          <Form.Input
            label='Artseky Flatbox Server IP'
            name='flatbox_ip'
            placeholder='Enter artesky_srv IP address, e.g. 127.0.0.1'
            value={this.state.flatbox_ip}
            onChange={this.handleChange}
          />
          <Form.Input
            label='Artseky Flatbox Device Port'
            name='flatbox_device'
            placeholder='e.g. /dev/ttyARTESKYFLAT'
            value={this.state.flatbox_device}
            onChange={this.handleChange}
          />
        </Form.Group>
        <Form.Group>
        Button to refresh Devices
        Iterate each device and
        </Form.Group>
      </Form>
    </Accordion.Content>
    </div>
    )
  }

  renderConstraints() {
    const { activeIndex } = this.state

    return (
      <div>
      <Accordion.Title
        active={activeIndex === eDefaultConstrainsts}
        content='Default Constraints'
        index={eDefaultConstrainsts}
        onClick={this.handleClick}
        />
      <Accordion.Content  active={activeIndex === eDefaultConstrainsts} >
      <div>
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
      </div>
    </Accordion.Content>
    </div>
    )
  }

  renderStartStopTimes() {
    var startT = `${this.state.defaultStartTime}`
    var stopT = `${this.state.defaultStopTime}`
    const { activeIndex } = this.state

    return (
      <div>
      <Accordion.Title
        active={activeIndex === eStartStop}
        content='Default Start/Stop Times'
        index={eStartStop}
        onClick={this.handleClick}
        />
      <Accordion.Content  active={activeIndex === eStartStop} >
      <div>
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
         </div>
      </Accordion.Content>
      </div>
    )
  }

  renderMount() {
    const { activeIndex } = this.state

    return (
      <div>
      <Accordion.Title
        active={activeIndex === eMount}
        content='Mount'
        index={eMount}
        onClick={this.handleClick}
        />
      <Accordion.Content active={activeIndex === eMount} >
        <Form>
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
      </Accordion.Content>
      </div>
    )
  }

  renderRotator() {
    const { activeIndex } = this.state

    return (
      <div>
      <Accordion.Title
        active={activeIndex === eRotator}
        content='Rotator'
        index={eRotator}
        onClick={this.handleClick}
        />
      <Accordion.Content active={activeIndex === eRotator} >
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
      </Accordion.Content>
      </div>
    )
  }

  renderGuider() {
    const { activeIndex } = this.state

    return (
      <div>
      <Accordion.Title
        active={activeIndex === eGuider}
        content='Guider'
        index={eGuider}
        onClick={this.handleClick}
        />
      <Accordion.Content  active={activeIndex === eGuider} >
        <Form>
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
      </Accordion.Content>
      </div>
    )
  }

  renderFilterWheel() {
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
      <div>
      <Accordion.Title
        active={activeIndex === eFilterWheel}
        content='Filter Wheel'
        index={eFilterWheel}
        onClick={this.handleClick}
        />
      <Accordion.Content  active={activeIndex === eFilterWheel} >
        <Form>
        <Form.Field control={Dropdown}
          fluid
          label='Default Filter'
          name='defaultFilter'
          options={FILTERS}
          placeholder='Used CLS and Focusing'
          text={this.state.defaultFilter}
          onChange={this.handleChange}
        />
        </Form>
      </Accordion.Content>
      </div>
    )
  }

  renderImager() {
    const { activeIndex } = this.state;

    return (
      <div>
      <Accordion.Title
        active={activeIndex === eCamera}
        content='Imaging Camera'
        index={eCamera}
        onClick={this.handleClick}
        />
      <Accordion.Content  active={activeIndex === eCamera} >
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
      </Form>
      </Accordion.Content>
      </div>
    )
  }

  renderFocuser() {
    const { activeIndex } = this.state;

    return (
      <div>
      <Accordion.Title
        active={activeIndex === eFocuser}
        content='Focuser'
        index={eFocuser}
        onClick={this.handleClick}
        />
      <Accordion.Content  active={activeIndex === eFocuser} >
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
          name='focus2Samples'
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
      </Accordion.Content>
    </div>
    )
  }

  renderClouds() {
    const { activeIndex } = this.state;

    return (
      <div>
      <Accordion.Title
        active={activeIndex === eClouds}
        content='Clouds'
        index={eClouds}
        onClick={this.handleClick}
        />
      <Accordion.Content  active={activeIndex === eClouds} >
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

    </Accordion.Content>
    </div>
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

    return (
      <div>
        <Accordion styled>
          {this.renderServers()}
          {this.renderConstraints()}
          {this.renderStartStopTimes()}
          {this.renderClouds()}
          {this.renderGuider()}
          {this.renderFocuser()}
          {this.renderFilterWheel()}
          {this.renderRotator()}
          {this.renderImager()}
          {this.renderMount()}

      </Accordion>
    </div>
    );
  }
}
// *******************************
// THIS IS THE DEFAULT EXPORT AND IS WHERE THE LOADING OF THE COMPONENT STARTS
// USE THIS POINT TO GRAB THE FILTERS
export default withTracker(() => {
    return {
      tsxInfo: TheSkyXInfos.find({}).fetch(),
      filters: Filters.find({}, { sort: { slot: 1 } }).fetch(),
  };
})(DefaultSettings);
