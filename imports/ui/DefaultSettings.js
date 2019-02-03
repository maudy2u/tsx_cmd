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
  // tsx_GetServerState,
} from  '../api/serverStates.js';

import ReactSimpleRange from 'react-simple-range';
import Timekeeper from 'react-timekeeper';

const XRegExp = require('xregexp');
const XRegExpPosNum = XRegExp('^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$');
const XRegExpNonZeroPosInt = XRegExp('[1-9][0-9]*');
const XRegExpZeroOrPosInt = XRegExp('[0]|[1-9][0-9]*');
const XRegExpZeroToNine = XRegExp('[0-9]');

// App component - represents the whole app
class DefaultSettings extends Component {

  // constructor() {
  //   super();
    state = {
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
      isFocus3Binned: false,
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
    };
  // }

  // requires the ".bind(this)", on the callers
  handleToggle = (e, { name, value }) => {

    var val = eval( 'this.state.' + name);

    this.setState({
      [name]: !val
    });
    this.saveDefaultState( name );
  };

  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value.trim() });
    this.saveDefaultState( name );
  };

  setSaveState( name, value ) {
    this.setState({ [name]: value });
    this.saveDefaultState( name );
  };

  handleStartChange = ( value ) => this.setState({defaultStartTime: value.formatted24 });
  handleStopChange = ( value ) => this.setState({defaultStopTime: value.formatted24 });
  handlePriorityChange = ( value ) => this.setState({defaultPriority: value.value });

  handleMenuItemClick = (e, { name }) => this.setState({ activeItem: name });
  saveServerFailedOpen = () => this.setState({ saveServerFailed: true });
  saveServerFailedClose = () => this.setState({ saveServerFailed: false });

  componentDidMount() {
    this.updateDefaults(this.props);
  }

  getDefault( name ) {
    var found;
    var result;
    try {
      found = this.props.tsxInfo.find(function(element) {
        return element.name == name;
      });
      result = found.value;
    } catch (e) {
      result = '';
    } finally {
      return result;
    }
  }

  // Generic Method to determine default to save.
  saveDefaultState( param ) {
    var value = eval("this.state."+param);

    Meteor.call( 'updateServerState', param, value , function(error, result) {

        if (error && error.error === "logged-out") {
          // show a nice error message
          Session.set("errorMessage", "Please fix.");
        }
    });//.bind(this));
  }

  updateDefaults(nextProps) {
      if( typeof nextProps == 'undefined'  ) {
        return;
      }

      if( typeof nextProps.tsxInfo == 'undefined'  ) {
        return;
      }

    this.setState({

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
      isFocus3Binned: nextProps.tsxInfo.find(function(element) {
        return element.name == 'isFocus3Binned';
      }).value,
      defaultGuideExposure: nextProps.tsxInfo.find(function(element) {
        return element.name == 'defaultGuideExposure';
      }).value,
      defaultDithering: nextProps.tsxInfo.find(function(element) {
        return element.name == 'defaultDithering';
      }).value,
      defaultMinSunAlt: nextProps.tsxInfo.find(function(element) {
        return element.name == 'defaultMinSunAlt';
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

    });

  }

  // Use this method to save any defaults gathered
  saveDefaults(){

    // this.saveDefaultState('ip');
    // this.saveDefaultState('port');
    this.saveDefaultState('defaultMinAlt');
    this.saveDefaultState('defaultCoolTemp');
    this.saveDefaultState('defaultFocusTempDiff');
    this.saveDefaultState('defaultMeridianFlip');
    this.saveDefaultState('defaultStartTime');
    this.saveDefaultState('defaultStopTime');
    this.saveDefaultState('defaultPriority');
    this.saveDefaultState('defaultSoftPark');
    this.saveDefaultState('defaultSleepTime');
    this.saveDefaultState('isTwilightEnabled');
    this.saveDefaultState('isFocus3Enabled');
    this.saveDefaultState('isFocus3Binned');
    this.saveDefaultState('defaultGuideExposure');
    this.saveDefaultState('defaultDithering');
    this.saveDefaultState('defaultMinSunAlt');
    this.saveDefaultState('minDitherFactor');
    this.saveDefaultState('maxDitherFactor');
    this.saveDefaultState('imagingPixelSize');
    this.saveDefaultState('imagingFocalLength');
    this.saveDefaultState('guiderPixelSize');
    this.saveDefaultState('guidingPixelErrorTolerance');
    this.saveDefaultState('defaultFocusExposure');
    this.saveDefaultState('defaultCLSEnabled');
    this.saveDefaultState('defaultFilter');
    this.saveDefaultState('fovPositionAngleTolerance');
    this.saveDefaultState('defaultFOVExposure');
    this.saveDefaultState('defaultCLSRetries');
    this.saveDefaultState('defaultCLSRepeat');
    this.saveDefaultState('calibrationFrameSize');

  }

  getDropDownFilters( pFilters ) {

    var filterArray = [];
    for (var i = 0; i < pFilters.length; i++) {
      filterArray.push({
        key: this.props.filters[i]._id,
        text: this.props.filters[i].name,
        value: this.props.filters[i].name });
    }
    return filterArray;
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
    let aFilters = '';
    let FILTERS = '';
    let numFilters = '';
    try {
      numFilters = this.props.filters.length
      aFilters = this.props.filters;
      FILTERS = this.getDropDownFilters( aFilters );
    }
    catch ( e ) {
      FILTERS = [];
    }

    // const handleToggle = () => this.handleToggle;
    const ERRORLABEL = <Label color="red" pointing/>

    return (
      <Form>
        <Segment>
          <Button icon='save' onClick={this.saveDefaults.bind(this)} />
          {/* <Button icon='save' onClick={this.saveTSXServerConnection.bind(this)}> Save Connection </Button>
          {this.renderTSXConnetion()} */}
        </Segment>
        <Segment raised>
          <h3 className="ui header">Defaults</h3>
          <Form.Group>
            <Form.Field control={Dropdown}
              fluid
              label='Default Filter'
              name='defaultFilter'
              options={FILTERS}
              placeholder='Used CLS and Focusing'
              text={this.state.defaultFilter}
              onChange={this.handleChange}
            />
          </Form.Group>
        </Segment>
        <Segment raised>
          <Form.Group>
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
            <Form.Input
              label='Time to sleep when no target '
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
          </Form.Group>
        </Segment>
        <Segment raised>
          <Form.Group>
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
          </Form.Group>
        </Segment>
        <Segment raised>
          <Form.Group>
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
          </Form.Group>
        </Segment>
        <Segment raised>
          <Form.Group>
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
          </Form.Group>
        </Segment>
        <Segment raised>
          <Form.Group>
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
          </Form.Group>
        </Segment>
        <Segment raised>
          <Form.Group>
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
          </Form.Group>
        </Segment>
        <Segment raised>
            <h4 className="ui header">Priority: {this.state.defaultPriority}</h4>
            <ReactSimpleRange
              label
              step={1}
              min={1}
              max={19}
              value={this.state.defaultPriority}
              sliderSize={12}
              thumbSize={18}
              onChange={this.handlePriorityChange}
            />
        </Segment>
        <Segment raised>
            <h4 className="ui header">Set Default START time</h4>
            <Timekeeper
              time={this.state.defaultStartTime}
              onChange={this.handleStartChange}
            />
          </Segment>
          <Segment raised>
            <h4 className="ui header">Set Default STOP time</h4>
            {/* <DateTime />pickerOptions={{format:"LL"}} value="2017-04-20"/> */}
            <Timekeeper
              time={this.state.defaultStopTime}
              onChange={this.handleStopChange}
            />
          </Segment>
    </Form>

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
