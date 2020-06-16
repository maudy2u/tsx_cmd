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

import {
  Header,
  Loader,
  Dimmer,
  Icon,
  Label,
  Menu,
  Segment,
  Progress,
  Modal,
  Accordion,
  Sidebar,
  Embed,
} from 'semantic-ui-react'

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

      eMetro: 0,
      eClearSky: 1,
      weatherIndex: 'metroBlue',
      sideBarVisible: true,
      sideBarSettingsVisible: true,
      settingsIndex: 'TheSkyX Connection',

    };
  }

  handleWeatherItemClick = (e, { name }) => this.setState({ weatherIndex: name });
  pushWeatherToggle = () => this.setState({ sideBarVisible: !this.state.sideBarVisible })
  pushSettingsToggle = () => this.setState({ sideBarSettingsVisible: false })
  handleSettingsItemClick = (e, { name }) => this.setState({ settingsIndex: name });

  handleMenuItemClick = (e, { name }) => {

    this.setState({ activeMenu: name });
    const { activeMenu  } = this.state;
    if( activeMenu === 'Settings' ) {
       this.setState({ sideBarSettingsVisible: !this.state.sideBarSettingsVisible });
    }
  }
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

  renderMenu() {
    const { activeMenu  } = this.state;
    const { noVNC_enabled } = this.props;

//    if( noVNC_enabled.value ) {
    if( noVNC_enabled.value ) {
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
            <Menu.Item fitted name='noVNC' active={activeMenu === 'noVNC'} onClick={this.handleMenuItemClick}>
              <Icon name='tv' size='large'/>
            </Menu.Item>
            <Menu.Item fitted name='Weather' active={activeMenu === 'Weather'} onClick={this.handleMenuItemClick}>
              <Icon name='mixcloud' size='large'/>
            </Menu.Item>
            <Menu.Item fitted name='INDIGO' active={activeMenu === 'INDIGO'} onClick={this.handleMenuItemClick}>
              <Icon name='wrench' size='large'/>
            </Menu.Item>
            <Menu.Item position ='right' fitted name='Settings' active={activeMenu === 'Settings'} onClick={this.handleMenuItemClick}>
              <Icon name='settings' size='large'/>
            </Menu.Item>
          </Menu>
          {this.renderMenuSegments()}
        </div>
      )

    }
    else {
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
            <Menu.Item fitted name='Weather' active={activeMenu === 'Weather'} onClick={this.handleMenuItemClick}>
              <Icon name='mixcloud' size='large'/>
            </Menu.Item>
            <Menu.Item fitted name='INDIGO' active={activeMenu === 'INDIGO'} onClick={this.handleMenuItemClick}>
              <Icon name='wrench' size='large'/>
            </Menu.Item>
            <Menu.Item position ='right' fitted name='Settings' active={activeMenu === 'Settings'} onClick={this.handleMenuItemClick}>
              <Icon name='settings' size='large'/>
            </Menu.Item>
          </Menu>
          {this.renderMenuSegments()}
        </div>
      )

    }

  }

  // *******************************
  //
  renderMenuSegments(){
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
//      srvLog={this.props.srvLog}
      return (
        <Monitor
          tsx_progress={this.props.tsx_progress}
          tsx_total={this.props.tsx_total}
          scheduler_report={this.props.scheduler_report}
          targetName={this.props.targetName}
          tsxInfo={this.props.tsxInfo}
          scheduler_running={this.props.scheduler_running}
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
        <Sidebar.Pushable width='very thin' as={Segment}>
          <Sidebar
            as={Menu}
            animation='push'
            icon='labeled'
            inverted
            vertical
            visible={this.state.sideBarVisible}
            width='thin'
          >
            <Menu.Item as='a' name='metroBlue' onClick={this.handleWeatherItemClick} >
              metroBlue
            </Menu.Item>
            <Menu.Item as='a' name='clearSky' onClick={this.handleWeatherItemClick}>
              ClearSky
            </Menu.Item>
          </Sidebar>

          <Sidebar.Pusher>
            <Segment basic onClick={this.pushWeatherToggle}>
              {this.renderClouds(this.state.weatherIndex)}
            </Segment>
          </Sidebar.Pusher>
        </Sidebar.Pushable>
      )
    } else if (this.state.activeMenu == 'INDIGO') {
      // 10.9.8.34
      var IP = this.props.tsxIP.value;
      var URL = 'http://'+IP+':7624/ctrl.html';
      console.log( URL )

      return (
        <Embed
        icon='right circle arrow'
        url={URL}
        />
      )
    } else if (this.state.activeMenu == 'noVNC') {
      // 10.9.8.34
      var IP = this.props.tsxIP.value;
      var PWD = this.props.noVNCPWD.value;
      var PORT = this.props.noVNCPort.value;
      var URL = 'http://'+IP+':6080/vnc.html?host='+IP+'&port=6080&autoconnect=true';
      if( PWD !== '') {
          URL = URL + '&password=' + PWD;
      }
      console.log( URL )

      return (
        <Embed
        icon='right circle arrow'
        url={URL}
        />
      )
    } else if (this.state.activeMenu == 'Settings') {
      return (
        <DefaultSettings
          scheduler_running={this.props.scheduler_running}
          tsxInfo = { this.props.tsxInfo }
          tool_active = { this.props.tool_active }
          sideBarSettingsVisible = {this.state.sideBarSettingsVisible}
          hideSideBar = {this.pushSettingsToggle }
          handleSettingsItemClick={this.handleSettingsItemClick}
          settingsIndex={this.state.settingsIndex}
        />
      )
    } else {
      return (
        <DefaultSettings
          scheduler_running={this.props.scheduler_running}
          tsxInfo = { this.props.tsxInfo }
          tool_active = { this.props.tool_active }
          sideBarSettingsVisible = {this.state.sideBarSettingsVisible}
          handleSettingsItemClick={this.handleSettingsItemClick}
          hideSideBar = {this.pushSettingsToggle }
          settingsIndex={this.state.settingsIndex}
        />
      )
    }
    this.saveDefaultState('activeMenu');

  }

  renderClouds( index ) {

    var metro = this.props.metroBlueReportWidget.value;
    if( metro == '') {
          metro = 'boulder_united-states-of-america_5574991';
    }

    var metroLink =
        'https://www.meteoblue.com/en/weather/forecast/seeing/'
      + metro
      + '?utm_source=weather_widget'
      + '&utm_medium=linkus&utm_content=seeing&utm_campaign=Weather%2BWidget';
    var metroFrame =
        'https://www.meteoblue.com/en/weather/widget/seeing/'
        + metro
      + '?geoloc=fixed&noground=0';

/*
<a href=https://www.cleardarksky.com/c/Monctonkey.html>
<img src="https://www.cleardarksky.com/c/Monctoncsk.gif?c=471637"></a>
*/

    var ccCity = this.props.clearSkyReportWidget.value;
    if( ccCity == '' ) {
      ccCity = 'BldrCOkey.html?1';
    }
    // https://www.cleardarksky.com/c/Monctoncsk.gif?c=471637
    var ccImage = "https://www.cleardarksky.com/c/" + ccCity ;//+ "\"";

//            onHide={false}
//          placeholder='/images/image-16by9.png'

    if( index === 'clearSky' ) {
      return (
        <center>
          <a href={"http://www.cleardarksky.com/csk/"} target="_blank">Clear Sky Chart
          </a>
          <br/>
          Get your city code and pput it in Cloud Settings. e.g. Boulder Code<br/>
            BldrCOkey.html?1<br/>
          <br/>
          <img src={ccImage} onClick={this.pushWeatherToggle}/>
        </center>
      )
    }
    else if( index === 'metroBlue' ) {
      return (
        <center>
          <a href={metroLink} target="_blank">meteoblue
          </a>
          <br/>
          Get your city code and pput it in Cloud Settings. e.g. Boulder Code<br/>
          boulder_united-states-of-america_5574991
          <br/>
          <iframe
            src={metroFrame}
            frameBorder="0"
            scrolling="NO"
            allowTransparency="true"
            sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
            style={{width: '520px', height: '727px'}}
            onClick={this.pushWeatherToggle}
            />
        </center>
      )
    }
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


/* https://react.semantic-ui.com/modules/checkbox#checkbox-example-radio-group
*/
  render() {

    const { infoReadyYet } = this.props;
    const { noVNCReadyYet } = this.props;

    if (
     infoReadyYet
      && noVNCReadyYet
      // this.props.activeMenu
      // && typeof this.props.tsx_progress !== 'undefined'
      // && this.props.activeMenu
      // && typeof this.props.scheduler_running !== 'undefined'
      // && typeof this.props.tsx_total !== 'undefined'
      // && typeof this.props.currentStage !== 'undefined'
     ) {

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
                { this.renderMenu() }
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
            build = {this.props.tsx_build}
            />
        </div>
      );
    }
    else {
      return(
        <Dimmer active>
           <Loader
           />
         </Dimmer>
       )
    }
  }
}
// *******************************
// THIS IS THE DEFAULT EXPORT AND IS WHERE THE LOADING OF THE COMPONENT STARTS
export default withTracker(() => {
  const infoHandle = Meteor.subscribe('tsxInfo.all');
  const noVNCHandle = Meteor.subscribe('noVNC.status');
  const tsxInfo = TheSkyXInfos.find({}).fetch();

  // const activeMenu = tsxInfo.find(function(element) {
  //   return element.name == 'activeMenu';
  // });

  const activeMenu = TheSkyXInfos.findOne({name: 'activeMenu'});
  const tsx_progress = TheSkyXInfos.findOne({name: 'tsx_progress'});
  const tsx_total =  TheSkyXInfos.findOne({name: 'tsx_total'});
  const currentStage = TheSkyXInfos.findOne({name: 'currentStage'});

  const targetName = TheSkyXInfos.findOne({name: 'targetName'});
  const flatbox_enabled = TheSkyXInfos.findOne({name: 'flatbox_enabled'});
  const scheduler_running= TheSkyXInfos.findOne({name: 'scheduler_running'});
  const tool_active= TheSkyXInfos.findOne({name: 'tool_active'});
  const tool_flats_dec_az= TheSkyXInfos.findOne({name: 'tool_flats_dec_az'});
  const tool_flats_location = TheSkyXInfos.findOne({name: 'tool_flats_location'});
  const tool_flats_via = TheSkyXInfos.findOne({name: 'tool_flats_via'});
  const tsx_version = TheSkyXInfos.findOne({name: 'tsx_version'});
  const tsx_date = TheSkyXInfos.findOne({name: 'tsx_date'});
  const tsx_build = TheSkyXInfos.findOne({name: 'tsx_build'});
  const tsxIP = TheSkyXInfos.findOne({name: 'ip'});
  const tsxPort = TheSkyXInfos.findOne({name: 'port'});
  const scheduler_report = TheSkyXInfos.findOne({name: 'scheduler_report'});
  const night_plan = TheSkyXInfos.findOne({name: 'night_plan'});
  const night_plan_reset = TheSkyXInfos.findOne({name: 'night_plan_reset'});
  const metroBlueReportWidget = TheSkyXInfos.findOne({name: 'metroBlueReportWidget'});
  const clearSkyReportWidget = TheSkyXInfos.findOne({name: 'clearSkyReportWidget'});

  const noVNC_enabled =  TheSkyXInfos.findOne({name: 'isNoVNCEnabled'});

  const noVNCPWD = TheSkyXInfos.findOne({name: 'noVNCPWD'});
  const noVNCPort = TheSkyXInfos.findOne({name: 'noVNCPort'});

  const targetSessionsHandle = Meteor.subscribe('targetSessions.all');
  const targetSessionsReadyYet = targetSessionsHandle.ready();

  const filtersHandle = Meteor.subscribe('filters.all');
  const filtersReadyYet = filtersHandle.ready();

  const calibrationFramesHandle = Meteor.subscribe('calibrationFrames.all');
  const calibrationFramesReadyYet = calibrationFramesHandle.ready();

  const flatSeriesHandle = Meteor.subscribe('flatSeries.all');
  const flatSeriesReadyYet = flatSeriesHandle.ready();

  const targetReportsHandle = Meteor.subscribe('targetReports.all');
  const targetReportsReadyYet = targetReportsHandle.ready();

  const takeSeriesTemplatesHandle = Meteor.subscribe('takeSeriesTemplates.all');
  const takeSeriesTemplatesReadyYet = takeSeriesTemplatesHandle.ready();

  const seriessHandle = Meteor.subscribe('seriess.all');
  const seriessReadyYet = seriessHandle.ready();

  const infoReadyYet = infoHandle.ready();
  const noVNCReadyYet = noVNCHandle.ready();

  return {
    infoReadyYet,
    noVNCReadyYet,
    seriessReadyYet,
    targetSessionsReadyYet,
    filtersReadyYet,
    calibrationFramesReadyYet,
    flatSeriesReadyYet,
    targetReportsReadyYet,
    takeSeriesTemplatesReadyYet,

    noVNC_enabled,
    noVNCPort,
    noVNCPWD,

    tsxInfo,
    metroBlueReportWidget,
    clearSkyReportWidget,
    targetName,
    flatbox_enabled,
    scheduler_running,
    tool_active,
    tool_flats_dec_az,
    tool_flats_location,
    tool_flats_via,
    currentStage,
    tsx_version,
    tsx_date,
    tsx_build,
    tsxIP,
    tsxPort,
    activeMenu,
    tsx_progress,
    tsx_total,
    scheduler_report,
    night_plan,
    night_plan_reset,

    targetSessions: TargetSessions.find({ isCalibrationFrames: false }, { sort: { enabledActive: -1, targetFindName: 1 } }).fetch(10),
    enabledTargetSessions: TargetSessions.find({ enabledActive: true }, { sort: { priority: 1, numericOrdering: true } }).fetch(10),
    filters: Filters.find({}, { sort: { slot: 1 } }).fetch(),
    calibrations: CalibrationFrames.find({}).fetch(),
    flatSeries: FlatSeries.find({}).fetch(10),
    target_reports: TargetReports.find({}).fetch(10),
    takeSeriesTemplates: TakeSeriesTemplates.find({ isCalibrationFrames: false }, { sort: { name: 1 } }).fetch(10),

  };
})(App);
