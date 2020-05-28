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
import TrackerReact from 'meteor/ultimatejs:tracker-react'
// import ReactDOM from 'react-dom';
// import { Session } from 'meteor/session'

// used for log files
import { Logger }     from 'meteor/ostrio:logger';
import { LoggerFile } from 'meteor/ostrio:loggerfile';


// import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';

import { Header, TextArea, Dimmer, Loader, Grid, Form, Input, Icon, Dropdown, Label, Table, Menu, Segment, Button, Progress, Modal, Radio } from 'semantic-ui-react'

// Import the API Model
import {
  TakeSeriesTemplates,
  addNewTakeSeriesTemplate,
} from '../api/takeSeriesTemplates.js';
import {
  TargetSessions,
  addNewTargetSession,
 } from '../api/targetSessions.js';
 import {
   TargetReports
 } from '../api/targetReports.js'
 import {
   TargetAngles
 } from '../api/targetAngles.js'

import { Filters } from '../api/filters.js';
import { CalibrationFrames } from '../api/calibrationFrames.js';
import { FlatSeries  } from '../api/flatSeries.js';
import { TheSkyXInfos } from '../api/theSkyXInfos.js';
import { AppLogsDB } from '../api/theLoggers.js'

// Import the UI
import DefaultSettings from './DefaultSettings.js';
import Monitor from './Monitor.js';
import Toolbox from './Toolbox.js';
import CalibrationsMenu from './CalibrationsMenu.js';
import TargetSessionMenu from './TargetSessionMenu.js';
import AppInfo from './AppInfo.js'
import AppStates from './AppStates.js'

// import Filter from './Filter.js';
import Series from './Series.js';
import TakeSeriesTemplateMenu from './TakeSeriesTemplateMenu.js';
import TestModal from './TestModal.js';
import NightPlanner from './NightPlanner.js';

import {
  tsx_ServerStates,
  tsx_UpdateServerState,
  UpdateStatus,
  // tsx_GetServerState,
} from  '../api/serverStates.js';

import {
  formatDate,
} from '../api/time_utils.js'

import ReactSimpleRange from 'react-simple-range';
import Timekeeper from 'react-timekeeper';

// App component - represents the whole app
class App extends TrackerReact(Component) {

  constructor(props) {
    super(props);
    this.state = {
      activeMenu: 'Targets',
      saveServerFailed: false,

      ip: 'localhost',
      port: '3040',
      currentStage: ' Loading....',
      progress: 0,
      progress_total: 0,

      modalOpen: false,
      modalOpenTest: false,
    };
  }

  handleToggle = (e, { name, value }) => this.setState({ [name]: Boolean(!eval('this.state.'+name)) })

  handleMenuItemClick = (e, { name }) => this.setState({ activeMenu: name });
  saveServerFailedOpen = () => this.setState({ saveServerFailed: true });
  saveServerFailedClose = () => this.setState({ saveServerFailed: false });

  // Set TSX Server

  modalOpenTest = () => this.setState({ modalOpenTest: true });
  modalCloseTest = () => this.setState({ modalOpenTest: false });

  propValue( prop ) {
    let val = '';
    try {
      val = prop.value;
    }
    catch( e ) {
      val = ''
    }
    return val;
  }

  // WARNING!!  adding this did not work
  // shouldComponentUpdate(prevProps) {
  //   // Typical usage (don't forget to compare props):
  //   if (this.props.target !== prevProps.target) {
  //     return true;
  //   }
  //   return false;
  // }

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
    if( typeof nextProps.tsxIP !== 'undefined' && typeof nextProps.tsxIP.value !== 'undefined') {
      this.setState({
        ip: nextProps.tsxIP.value,
      });
    }

    if( typeof nextProps.tsxPort !== 'undefined' && typeof nextProps.tsxPort.value !== 'undefined') {
      this.setState({
        port: nextProps.tsxPort.value,
      });
    }
    if( typeof nextProps.currentStage !== 'undefined' && typeof nextProps.currentStage.value !== 'undefined') {
      this.setState({
        currentStage: nextProps.currentStage.value,
      });
    }
    if( typeof nextProps.tsx_progress !== 'undefined' && typeof nextProps.tsx_progress.value !== 'undefined') {
      this.setState({
        progress: nextProps.tsx_progress.value,
      });
    }
    if( typeof nextProps.tsx_total !== 'undefined' && typeof nextProps.tsx_total.value !== 'undefined') {
      this.setState({
        progress_total: nextProps.tsx_total.value,
      });
    }
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
    tsx_UpdateServerState(param, value);
  }

  renderMenu( MENU, RUNNING ) {
    const { activeMenu  } = this.state;
    return(
      <div>
        <Menu tabular icon size='huge'>
          <Menu.Item fitted name='Monitor' active={activeMenu === 'Monitor'} onClick={this.handleMenuItemClick}>
            <Icon name='play circle' size='large' />
          </Menu.Item>
          <Menu.Item fitted name='Plan' active={activeMenu === 'Plan'} onClick={this.handleMenuItemClick}>
            <Icon name='tasks' size='large' />
          </Menu.Item>
          <Menu.Item fitted name='Targets' active={activeMenu === 'Targets'} onClick={this.handleMenuItemClick}>
            <Icon name='target' size='large' />
          </Menu.Item>
          <Menu.Item fitted name='Series' active={activeMenu === 'Series'} onClick={this.handleMenuItemClick}>
            <Icon name='list ol' size='large' />
          </Menu.Item>
          <Menu.Item fitted name='Calibration' active={activeMenu === 'Calibration'} onClick={this.handleMenuItemClick}>
            <Icon name="area graph" size='large' />
          </Menu.Item>
          <Menu.Item fitted name='Toolbox' active={activeMenu === 'Toolbox'} onClick={this.handleMenuItemClick}>
            <Icon name='briefcase' size='large' />
          </Menu.Item>
          <Menu.Item fitted name='Settings' active={activeMenu === 'Settings'} onClick={this.handleMenuItemClick}>
            <Icon name='configure' size='large'/>
          </Menu.Item>
          <Menu.Item fitted name='Weather' active={activeMenu === 'Weather'} onClick={this.handleMenuItemClick}>
            <Icon name='cloud' size='large'/>
          </Menu.Item>
        </Menu>
        {this.renderMenuSegments( MENU )}
      </div>
    )
  }

  // *******************************
  //
  renderMenuSegments( MENU ){
    var RUNNING = '';
    try {
      RUNNING = this.props.scheduler_running.value;
    } catch (e) {
      RUNNING = '';
    }

    var DISABLE = true;
    if( RUNNING == 'Stop'){
      DISABLE = false;
    }

    if (this.state.activeMenu == 'Monitor' ) {
      return (
        <Monitor
          tsx_progress={this.props.tsx_progress}
          tsx_total={this.props.tsx_total}
          scheduler_report={this.props.scheduler_report}
          targetName={this.props.targetName}
          tsxInfo={this.props.tsxInfo}
          scheduler_running={this.props.scheduler_running}
          srvLog={this.props.srvLog}
          tool_active = {this.props.tool_active}
        />
      )
    } else if (this.state.activeMenu == 'Plan' ) {

      return (
          <NightPlanner
            night_plan = {this.props.night_plan}
            enabledtargets={this.props.enabledTargetSessions}
            night_plan_reset={this.props.night_plan_reset}
            tsxInfo= {this.props.tsxInfo}
            tool_active = {this.props.tool_active}
            scheduler_running={this.props.scheduler_running}
          />
      )
    } else if (this.state.activeMenu == 'Targets' ) {
      return (
        <div>
          <TargetSessionMenu
            targets={this.props.targetSessions}
            target_reports={this.props.target_reports}
            scheduler_running={this.props.scheduler_running}
            tool_active = {this.props.tool_active}
          />
        </div>
      )
    } else if (this.state.activeMenu == 'Series') {
      return (
        <div>
          <TakeSeriesTemplateMenu
            seriesList={this.props.takeSeriesTemplates}
            scheduler_running={this.props.scheduler_running}
            tool_active = {this.props.tool_active}
          />
      </div>
      )
    } else if (this.state.activeMenu == 'Calibration') {
      return (
        <CalibrationsMenu
          scheduler_report={this.props.scheduler_report}
          flatbox_enabled={this.props.flatbox_enabled}
          tsxInfo={this.props.tsxInfo}
          scheduler_running={this.props.scheduler_running}
          calibrations={this.props.calibrations}
          filters = {this.props.filters}
          tool_active = {this.props.tool_active}
          tool_flats_via = {this.props.tool_flats_via}
          tool_flats_location = {this.props.tool_flats_location}
          tool_flats_dec_az = {this.props.tool_flats_dec_az}
        />
      )
    } else if (this.state.activeMenu == 'Settings') {
      return (
        <DefaultSettings
          scheduler_running={this.props.scheduler_running}
        />
      )

    } else if (this.state.activeMenu == 'Toolbox') {
      return (
        <Toolbox
          scheduler_report={ this.props.scheduler_report }
          scheduler_running={ this.props.scheduler_running }
          tsxInfo = { this.props.tsxInfo }
          tool_active = { this.props.tool_active }
        />
      )
    } else if (this.state.activeMenu == 'Weather') {
      return (
        <center>
          <a href="https://www.meteoblue.com/en/weather/forecast/seeing/moncton_canada_6076211?utm_source=weather_widget&utm_medium=linkus&utm_content=seeing&utm_campaign=Weather%2BWidget" target="_blank">meteoblue
          </a>
          <br/>
          <iframe
            src="https://www.meteoblue.com/en/weather/widget/seeing/moncton_canada_6076211?geoloc=fixed&noground=0"
            frameBorder="0"
            scrolling="NO"
            allowTransparency="true"
            sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
            style={{width: '520px', height: '727px'}}/>
        </center>
      )
    } else {
      return (
        <DefaultSettings
          scheduler_running={this.props.scheduler_running}
          tsxInfo = { this.props.tsxInfo }
          tool_active = { this.props.tool_active }
        />
      )
    }
    this.saveDefaultState('activeMenu');

  }

  renderTestModal() {
    return(
      <Modal
        open={this.state.modalOpenTest}
        onClose={this.modalCloseTest}
        basic
        size='small'
        closeIcon>
        <Modal.Header>test</Modal.Header>
        <Modal.Content>
          <TestModal
            tsxInfo = { this.props.tsxInfo }
            target_reports={this.props.target_reports}
            tool_active = {this.props.tool_active}
            scheduler_running={this.props.scheduler_running}
            scheduler_report={this.props.scheduler_report}
            tsxInfo = {this.props.tsxInfo}
            currentStage= {this.props.currentStage}
          />
        </Modal.Content>
        <Modal.Description>
        </Modal.Description>
        <Modal.Actions>
        </Modal.Actions>
      </Modal>
    )
  }


/* This is a sample template to add in a modal
  renderTestModal() {
    return(
      <Modal
        open={this.state.modalOpenTest}
        onClose={this.modalCloseTest}
        basic
        size='small'
        closeIcon>
        <Modal.Header>test</Modal.Header>
        <Modal.Content>
          <TestModal
            tsxInfo = { this.props.tsxInfo }
            target_reports={this.props.target_reports}
            tool_active = {this.props.tool_active}
            scheduler_running={this.props.scheduler_running}
            scheduler_report={this.props.scheduler_report}
            tsxInfo = {this.props.tsxInfo}
          />
        </Modal.Content>
        <Modal.Description>
        </Modal.Description>
        <Modal.Actions>
        </Modal.Actions>
      </Modal>
    )
  }
*/
  render() {
    if (
      this.props.tsxInfo
      && this.props.targetName
     ) {
      /* https://react.semantic-ui.com/modules/checkbox#checkbox-example-radio-group
      */
      var MENU = 'Targets';
      var RUNNING = '';
      var ACTIVE = false;
      var PROGRESS = 0;
      var PROGRESS_TOTAL = 60;
      var STAGE = 'Setting up';

     try {
        MENU = this.props.activeMenu.value;
        RUNNING = this.props.scheduler_running.value;
        ACTIVE = this.props.tool_active.value;
        PROGRESS =  this.props.tsx_progress.value;
        PROGRESS_TOTAL = this.props.tsx_total.value;
        STAGE = this.props.currentStage.value;

      } catch (e) {
        MENU = 'Targets';
        RUNNING = '';
        ACTIVE = false;
        PROGRESS = 0;
        PROGRESS_TOTAL = 60;
        STAGE = 'Setting up';
      }
      var LOG = [];
      var num = 0;
      try {
        num = this.props.srvLog.length;
      }
      finally {
        for (var i = num-1; i > -1; i--) { // this puts most resent line on top
            var log = this.props.srvLog[i];
            LOG = LOG + '[' + log.level +']' + log.message + '\n';
        }
      }

      return (
        <div className="container">
            <Segment.Group>
              <Segment>
                <AppStates
                  scheduler_running={ this.props.scheduler_running }
                  tool_active = { this.props.tool_active }
                  tsxInfo= {this.props.tsxInfo }
                  progress= { this.props.tsx_progress }
                  progress_total = { this.props.tsx_total }
                  currentStage = { this.props.currentStage }
                  target_reports={this.props.target_reports}
                  scheduler_report={this.props.scheduler_report}
                />
              </Segment>
              <Segment>
                { this.renderMenu( MENU, RUNNING ) }
              </Segment>
            {/* *******************************

            THIS IS FOR A FAILED CONNECTION TO TSX

            *******************************             */}
            {this.renderTestModal()}
          </Segment.Group>
          <AppInfo
            ip = {this.props.tsxIP}
            port = {this.props.tsxPort}
            version = {this.props.tsx_version}
            date = {this.props.tsx_date}
            />
        </div>
      );
    }
    else {
      return(
        <Label>Loading...</Label>
      )
    }
  }
}
// *******************************
// THIS IS THE DEFAULT EXPORT AND IS WHERE THE LOADING OF THE COMPONENT STARTS
export default withTracker(() => {
  const infoHandle = Meteor.subscribe('tsxInfo.all');
  var infoReadyYet = infoHandle.ready();
  var tsxInfo = TheSkyXInfos.find({}).fetch();
  var targetName = TheSkyXInfos.findOne({name: 'targetName'});
  var flatbox_enabled = TheSkyXInfos.findOne({name: 'flatbox_enabled'});

  return {
    infoReadyYet,
    tsxInfo,
    targetName,
    flatbox_enabled,
    scheduler_running: TheSkyXInfos.findOne({name: 'scheduler_running'}),

    tool_calibrate_via: TheSkyXInfos.findOne({name: 'tool_calibrate_via'}),
    tool_calibrate_location: TheSkyXInfos.findOne({name: 'tool_calibrate_location'}),
    tool_rotator_num: TheSkyXInfos.findOne({name: 'tool_rotator_num'}),
    tool_rotator_type: TheSkyXInfos.findOne({name: 'tool_rotator_type'}),
    tool_active: TheSkyXInfos.findOne({name: 'tool_active'}),
    tool_flats_dec_az: TheSkyXInfos.findOne({name: 'tool_flats_dec_az'}),
    tool_flats_location: TheSkyXInfos.findOne({name: 'tool_flats_location'}),
    tool_flats_via: TheSkyXInfos.findOne({name: 'tool_flats_via'}),

    // SESSION Controls
    defaultMeridianFlip: TheSkyXInfos.findOne({name: 'defaultMeridianFlip'}),
    defaultCLSEnabled: TheSkyXInfos.findOne({name: 'defaultCLSEnabled'}),
    defaultSoftPark: TheSkyXInfos.findOne({name: 'defaultSoftPark'}),

    isFOVAngleEnabled: TheSkyXInfos.findOne({name: 'isFOVAngleEnabled'}),
    isFocus3Enabled: TheSkyXInfos.findOne({name: 'isFocus3Enabled'}),
    isFocus3Binned: TheSkyXInfos.findOne({name: 'isFocus3Binned'}),

    isAutoguidingEnabled: TheSkyXInfos.findOne({name: 'isAutoguidingEnabled'}),
    isCalibrationEnabled: TheSkyXInfos.findOne({name: 'isCalibrationEnabled'}),
    isGuideSettlingEnabled: TheSkyXInfos.findOne({name: 'isGuideSettlingEnabled'}),

    isCLSRepeatEnabled: TheSkyXInfos.findOne({name: 'isCLSRepeatEnabled'}),
    isTwilightEnabled: TheSkyXInfos.findOne({name: 'isTwilightEnabled'}),

    // App stuf
    currentStage: TheSkyXInfos.findOne({name: 'currentStage'}),
    tsx_version: TheSkyXInfos.findOne({name: 'tsx_version'}),
    tsx_date: TheSkyXInfos.findOne({name: 'tsx_date'}),
    tsxIP: TheSkyXInfos.findOne({name: 'ip'}),
    tsxPort: TheSkyXInfos.findOne({name: 'port'}),
    srvLog: AppLogsDB.find({}, {sort:{time:-1}}).fetch(10),
    activeMenu: TheSkyXInfos.findOne({name: 'activeMenu'}),

    flatSettings: TheSkyXInfos.findOne({name: 'flatSettings'}),
    tsx_progress: TheSkyXInfos.findOne({name: 'tsx_progress'}),
    tsx_total:  TheSkyXInfos.findOne({name: 'tsx_total'}),
    tsx_message: TheSkyXInfos.findOne({name: 'tsx_message'}),
    scheduler_report: TheSkyXInfos.findOne({name: 'scheduler_report'}),
    filters: Filters.find({}, { sort: { slot: 1 } }).fetch(),
//    calibrations: CalibrationFrames.find({}, { sort: { order: 1 } }).fetch(),
    calibrations: CalibrationFrames.find({}).fetch(),
    flatSeries: FlatSeries.find({}).fetch(),
    takeSeriesTemplates: TakeSeriesTemplates.find({ isCalibrationFrames: false }, { sort: { name: 1 } }).fetch(),
    targetSessions: TargetSessions.find({ isCalibrationFrames: false }, { sort: { enabledActive: -1, targetFindName: 1 } }).fetch(),
    // targetSessions: TargetSessions.find({ }, { sort: { enabledActive: -1, targetFindName: 1 } }).fetch(),
    target_reports: TargetReports.find({}).fetch(),

    enabledTargetSessions: TargetSessions.find({ enabledActive: true }, { sort: { priority: 1, numericOrdering: true } }).fetch(),
//    enabledTargetSessions: TargetSessions.find({ enabledActive: true }), { sort: { priority: 1, numericOrdering: true }).fetch(),
    night_plan: TheSkyXInfos.findOne({name: 'night_plan'}),
    night_plan_reset: TheSkyXInfos.findOne({name: 'night_plan_reset'}),
  };
})(App);
