import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Session } from 'meteor/session'

// import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';

import { Form, Input, Icon, Dropdown, Label, Table, Menu, Segment, Button, Progress, Modal, Radio } from 'semantic-ui-react'

// Import the API Model
import { TakeSeriesTemplates} from '../api/takeSeriesTemplates.js';
import { Seriess } from '../api/seriess.js';
import { Filters } from '../api/filters.js';
import { TargetSessions } from '../api/targetSessions.js';
import { TheSkyXInfos } from '../api/theSkyXInfos.js';

// Import the UI
import Monitor from './Monitor.js';
import TargetSessionMenu from './TargetSessionMenu.js';
import Filter from './Filter.js';
import Series from './Series.js';
import TakeSeriesTemplateMenu from './TakeSeriesTemplateMenu.js';
import TheSkyXInfo from './TheSkyXInfo.js';

import {
  tsx_ServerStates,
  tsx_UpdateServerState,
  // tsx_GetServerState,
} from  '../api/serverStates.js';

import ReactSimpleRange from 'react-simple-range';
import Timekeeper from 'react-timekeeper';

// App component - represents the whole app
class DefaultSettings extends Component {

  state = {
    activeItem: 'Targets',
    saveServerFailed: false,
    modalEnterIp: false,
    modalEnterPort: false,
    modalConnectionFailed: false,
    showMonitor: false, // this needs to be a server session variable

    ip: 'Not connected',
    port: 'Not connected',
    defaultMinSunAlt: -15,
    defaultMinAlt: 30,
    defaultCoolTemp: -20,
    defaultFocusTempDiff: 0.7,
    defaultMeridianFlip: true,
    defaultSoftPark: false,
    defaultStartTime: '20:00',
    defaultStopTime: '6:00',
    defaultPriority: 9,
    defaultSleepTime: 5,
    defaultDithering: 1,
    currentStage: '',
    isTwilightEnabled: true,
    isFocus3Enabled: false,
    isFocus3Binned: false,
    defaultGuideExposure: 7,
  };

  handleToggle = (e, { name, value }) => this.setState({ [name]: Boolean(!eval('this.state.'+name)) })
  handleChange = (e, { name, value }) => this.setState({ [name]: value.trim() });
  handleChangeAndSave = (e, { name, value }) => this.setSaveState(name, value.trim());
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

  // Set TSX Server
  ipChange = (e, { value }) => this.setState({ ip: value.trim() });
  portChange = (e, { value }) => this.setState({ port: value.trim() });
  modalEnterIpOpen = () => this.setState({ modalEnterIp: true });
  modalEnterIpClose = () => this.setState({ modalEnterIp: false });
  modalEnterPortOpen = () => this.setState({ modalEnterPort: true });
  modalEnterPortClose = () => this.setState({ modalEnterPort: false });
  modalConnectionFailedOpen = () => this.setState({ modalConnectionFailed: true });
  modalConnectionFailedClose = () => this.setState({ modalConnectionFailed: false });

  componentWillReceiveProps(nextProps) {
    this.updateDefaults(nextProps);
  }

  updateDefaults(nextProps) {
    this.setState({
      ip: nextProps.tsxInfo.find(function(element) {
        return element.name == 'ip';
      }).value,
      port: nextProps.tsxInfo.find(function(element) {
        return element.name == 'port';
      }).value,
      defaultCoolTemp: nextProps.tsxInfo.find(function(element) {
        return element.name == 'defaultCoolTemp';
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
      defaultPriority: nextProps.tsxInfo.find(function(element) {
        return element.name == 'defaultPriority';
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

    });

  }
  saveTSXServerIp() {
      this.saveDefaultState('ip');
      this.modalEnterIpClose();
  };

  saveTSXServerPort() {
    this.saveDefaultState('port');
    this.modalEnterPortClose();
  };

  saveTSXServerConnection() {

    if( this.state.port == "" || this.state.ip == ""  ) {
      this.saveServerFailedOpen();
    }
    else {
      this.saveDefaultState('ip');
      this.saveDefaultState('port');
    };
  };

  // Generic Method to determine default to save.
  saveDefaultState( param ) {
    var value = eval("this.state."+param);
    tsx_UpdateServerState(param, value);
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

  // Use this method to save any defaults gathered
  saveDefaults(){

    this.saveDefaultState('ip');
    this.saveDefaultState('port');
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

    return (
      <Form>
      <Segment.Group>
        <Segment>
          <Button icon='save' onClick={this.saveDefaults.bind(this)} />
          {/* <Button icon='save' onClick={this.saveTSXServerConnection.bind(this)}> Save Connection </Button>
          {this.renderTSXConnetion()} */}
        </Segment>
        <Segment>
          <h3 className="ui header">Defaults</h3>
          <Form.Group>
            <Form.Checkbox
              label='Meridian Flip Enabled '
              name='defaultMeridianFlip'
              toggle
              placeholder= 'Enable auto meridian flip'
              checked={this.state.defaultMeridianFlip}
              onChange={this.handleToggle.bind(this)}
            />
            <Form.Checkbox
              label='Soft Park Enabled (Stop tracking) '
              name='defaultSoftPark'
              toggle
              placeholder= 'Enable soft parking'
              checked={this.state.defaultSoftPark}
              onChange={this.handleToggle.bind(this)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Checkbox
              label='Checking Focus Enabled (@Focus3) '
              name='isFocus3Enabled'
              toggle
              placeholder= 'Enable focus checking'
              checked={this.state.isFocus3Enabled}
              onChange={this.handleToggle.bind(this)}
            />
            <Form.Checkbox
              label='Bin 2x2 Focus Enabled '
              name='isFocus3Binned'
              toggle
              placeholder= 'Enable to bin when focusing'
              checked={this.state.isFocus3Binned}
              onChange={this.handleToggle.bind(this)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Checkbox
              label='Twilight Check Enabled '
              name='isTwilightEnabled'
              toggle
              placeholder= 'Enable twilight check'
              checked={this.state.isTwilightEnabled}
              onChange={this.handleToggle.bind(this)}
            />
            <Form.Input
              label='Twilight Alittude for Sun '
              name='defaultMinSunAlt'
              placeholder='Enter negative degrees below horizon'
              value={this.state.defaultMinSunAlt}
              onChange={this.handleChange}
            />
          </Form.Group>
          <Form.Group>
            <Form.Input
              label='AutoGuide Exposure '
              name='defaultGuideExposure'
              placeholder='Enter number seconds'
              value={this.state.defaultGuideExposure}
              onChange={this.handleChange}
            />
            <Form.Input
              label='Minimum Altitude '
              name='defaultMinAlt'
              placeholder='Enter Minimum Altitude to start/stop'
              value={this.state.defaultMinAlt}
              onChange={this.handleChange}
            />
            <Form.Input
              label='Focusing Temperature '
              name='defaultFocusTempDiff'
              placeholder='Temp diff to run auto focus'
              value={this.state.defaultFocusTempDiff}
              onChange={this.handleChange}
            />
          </Form.Group>
          <Form.Group>
            <Form.Input
              label='Dither after X images (0 disables): '
              name='defaultDithering'
              placeholder='Images before dither'
              value={this.state.defaultDithering}
              onChange={this.handleChange}
            />
            <Form.Input
              label='Dithering Minimum Pixel Move '
              name='minDitherFactor'
              placeholder='Minimum number of pixels'
              value={this.state.minDitherFactor}
              onChange={this.handleChange}
            />
            <Form.Input
              label='Dithering Maximum Pixel Move '
              name='maxDitherFactor'
              placeholder='Maximum number of pixels'
              value={this.state.maxDitherFactor}
              onChange={this.handleChange}
            />
          </Form.Group>
          <Form.Group>
            <Form.Input
              label='Cooling Temperature: '
              name='defaultCoolTemp'
              placeholder='-20'
              value={this.state.defaultCoolTemp}
              onChange={this.handleChange}
            />
            <Form.Input
              label='Time to sleep when no target '
              name='defaultSleepTime'
              placeholder='Minutes to sleep'
              value={this.state.defaultSleepTime}
              onChange={this.handleChange}
            />
          </Form.Group>
        </Segment>
        <Segment>
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
        <Segment>
            <h4 className="ui header">Set Default START time</h4>
            <Timekeeper
              time={this.state.defaultStartTime}
              onChange={this.handleStartChange}
            />
          </Segment>
          <Segment>
            <h4 className="ui header">Set Default STOP time</h4>
            {/* <DateTime />pickerOptions={{format:"LL"}} value="2017-04-20"/> */}
            <Timekeeper
              time={this.state.defaultStopTime}
              onChange={this.handleStopChange}
            />
          </Segment>
      </Segment.Group>
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
      seriess: Seriess.find({}, { sort: { order: 1 } }).fetch(),
      filters: Filters.find({}, { sort: { slot: 1 } }).fetch(),
      takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
      targetSessions: TargetSessions.find({}, { sort: { name: 1 } }).fetch(),
  };
})(DefaultSettings);
