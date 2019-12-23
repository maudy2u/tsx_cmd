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
import { FlatSeries } from '../api/flatSeries.js';
import { TheSkyXInfos } from '../api/theSkyXInfos.js';
import { AppLogsDB } from '../api/theLoggers.js'

// Import the UI
import DefaultSettings from './DefaultSettings.js';
import Monitor from './Monitor.js';
import Toolbox from './Toolbox.js';
import CalibrationsMenu from './CalibrationsMenu.js';
import TargetSessionMenu from './TargetSessionMenu.js';
// import Filter from './Filter.js';
import Series from './Series.js';
import TakeSeriesTemplateMenu from './TakeSeriesTemplateMenu.js';
import SessionControls from './SessionControls.js';
import TestModal from './TestModal.js';
import BackupModal from './BackupModal.js';
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
      modalEnterIp: false,
      modalEnterPort: false,
      modalConnectionFailed: false,
      showMonitor: false, // this needs to be a server session variable

      ip: 'localhost',
      port: '3040',

      currentStage: ' Loading....',
      modalOpenWindowSessionControls: false,
      modalOpen: false,
      modalOpenTest: false,
      modalOpenBackup: false,
      modalViewNightPlanner: false,
      planData: '',
      planDataLoading: true,
    };
    this.planDataLoaded = this.planDataLoaded.bind(this);
  }

  handleToggle = (e, { name, value }) => this.setState({ [name]: Boolean(!eval('this.state.'+name)) })

  handleMenuItemClick = (e, { name }) => this.setState({ activeMenu: name });
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

  modalOpenSessionsControls = () => this.setState({ modalOpenWindowSessionControls: true });
  modalCloseSessionsControls = () => this.setState({ modalOpenWindowSessionControls: false });


modalOpenTest = () => this.setState({ modalOpenTest: true });
modalCloseTest = () => this.setState({ modalOpenTest: false });
modalOpenBackup = () => this.setState({ modalOpenBackup: true });
modalCloseBackup = () => this.setState({ modalOpenBackup: false });

  modalShowTargetReport = () => {
    this.setState({planDataLoading: true});
    this.loadPlanData();
    if( this.planData != '') {
      this.setState({ modalViewNightPlanner: true });
    }
  };
  modalCloseNightPlanner = () => {
    this.setState({ modalViewNightPlanner: false });
  };

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

  saveTSXServerIp() {
    this.modalEnterIpClose();
    if( this.state.ip == ""  ) {
      this.saveServerFailedOpen();
    }
    else {
      this.saveDefaultState('ip');
    };

  };

  saveTSXServerPort() {
    this.modalEnterPortClose();
    if( this.state.port == ""  ) {
      this.saveServerFailedOpen();
    }
    else {
      this.saveDefaultState('port');
    };

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

  // *******************************
  //
  componentDidMount() {
    if( typeof this.props.tsxIP == 'undefined' || typeof this.props.tsxPort == 'undefined' ) {
      return;
    }

    this.updateDefaults(this.props);
  }

  updateDefaults(nextProps) {
    if( typeof nextProps.tsxIP.value != 'undefined') {
      this.setState({
        ip: nextProps.tsxIP.value,
      });
    }

    if( typeof nextProps.tsxPort.value != 'undefined') {
      this.setState({
        port: nextProps.tsxPort.value,
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

  // Use this method to save any defaults gathered
  saveDefaults(){
    this.saveDefaultState('ip');
    this.saveDefaultState('port');
  }

  // // *******************************
  // //
  // addNewFilter(event) {
  //   // Find the text field via the React ref
  //   const text = ReactDOM.findDOMNode(this.refs.textInput).value.trim();
  //
  //   Filters.insert({
  //     name: text,
  //     createdAt: new Date(), // current time
  //     offset: 0,
  //   });
  //   // Clear form
  //   ReactDOM.findDOMNode(this.refs.textInput).value = '';
  // }

  // *******************************
  //
  renderTSXConnetion() {

    return (
      <Segment>
        <Form>
          <Form.Group widths='equal' onSubmit={this.saveTSXServerConnection.bind(this)}>
            <Form.Input
              label='IP Address'
              name='ip'
              placeholder="Enter TSX address"
              value={this.state.ip}
              onChange={this.ipChange}/>
            <Form.Input
              label='Port'
              name='port'
              placeholder="Enter TSX port"
              value={this.state.port}
              onChange={this.portChange}/>
          </Form.Group>
        </Form>

           {/* *******************************
             Used to handle the FAILED deleting of a series
             */}
           <Modal
             open={this.state.saveServerFailed}
             onClose={this.saveServerFailedClose.bind(this)}
             basic
             size='small'
             closeIcon>
             <Modal.Header>Save Failed</Modal.Header>
             <Modal.Content>
               <h3>Both IP and Port need to have a value.</h3>
             </Modal.Content>
             <Modal.Actions>
               <Button color='red' onClick={this.saveServerFailedClose.bind(this)} inverted>
                 <Icon name='stop' /> Got it
               </Button>
             </Modal.Actions>
           </Modal>
      </Segment>
    );
  }

  // *******************************
  //
  renderMonitor() {
    /* need to pass things down:
        - the tsxInfo...
        - the published active target
        - the progress...
     */
//      <Monitor  tsxInfo={this.props.tsxInfo}/>
    return  (
      <Monitor
        tsx_progress={this.props.tsx_progress}
        tsx_total={this.props.tsx_total}
        scheduler_report={this.props.scheduler_report}
        targetSessionId={this.props.targetSessionId}
        targetName={this.props.targetName}
        tsxInfo={this.props.tsxInfo}
      />
    );
  }


  renderDevices() {

    var mount = TheSkyXInfos.findOne().mount();
    var camera = TheSkyXInfos.findOne().camera();
    var guider = TheSkyXInfos.findOne().guider();
    var rotator = TheSkyXInfos.findOne().rotator();
    var efw = TheSkyXInfos.findOne().efw();
    var focuser = TheSkyXInfos.findOne().focuser();

    return (
        <Segment.Group>
          <Segment><Label>Mount<Label.Detail>
            {mount.manufacturer + ' | ' + mount.model}
          </Label.Detail></Label></Segment>
          <Segment><Label>Camera<Label.Detail>
            {camera.manufacturer + ' | ' + camera.model}
          </Label.Detail></Label></Segment>
          <Segment><Label>Autoguider<Label.Detail>
            {guider.manufacturer + ' | ' + guider.model}
          </Label.Detail></Label></Segment>
          <Segment><Label>Filter Wheel<Label.Detail>
            {efw.manufacturer + ' | ' + efw.model}
          </Label.Detail></Label></Segment>
          <Segment><Label>Focuser<Label.Detail>
            {focuser.manufacturer + ' | ' + focuser.model}
          </Label.Detail></Label></Segment>
          <Segment><Label>Rotator<Label.Detail>
            {rotator.manufacturer + ' | ' + rotator.model}
          </Label.Detail></Label></Segment>
        </Segment.Group>
    );

  }

  // *******************************
  //
  renderLogout() {

  }

  connectToTSX() {

    // these are all working methods
    // on the client
    Meteor.call("connectToTSX", function (error, result) {
      // identify the error
      if (error && error.reason === "Internal server error") {
        // show a nice error message
        this.setState({modalConnectionFailed: true});
      }
      else {
        this.setState({activeMenu: 'Devices'});
        this.saveDefaultState('activeMenu');
      }
    }.bind(this));
  }

  park() {

    // these are all working methods
    // on the client
    Meteor.call("park", function (error, result) {
      // identify the error
      if (error && error.reason === "Internal server error") {
        // show a nice error message
        this.setState({modalConnectionFailed: true});
      }
    }.bind(this));

  }

  renderMenu( MENU, RUNNING ) {
    const { activeMenu  } = this.state;
    return(
      <div>
        <Menu tabular icon size='huge'>
          <Menu.Item fitted name='Monitor' active={activeMenu === 'Monitor'} onClick={this.handleMenuItemClick}>
            <Icon name='eye' size='large' />
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
          <Menu.Item fitted name='Devices' active={activeMenu === 'Devices'} onClick={this.handleMenuItemClick}>
            <Icon name='power cord' size='large' />
          </Menu.Item>
            <Menu.Item fitted name='Settings' active={activeMenu === 'Settings'} onClick={this.handleMenuItemClick}>
            <Icon name='configure' size='large'/>
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
        <div>
          <Monitor
            tsx_progress={this.props.tsx_progress}
            tsx_total={this.props.tsx_total}
            scheduler_report={this.props.scheduler_report}
            targetSessionId={this.props.targetSessionId}
            targetName={this.props.targetName}
            tsxInfo={this.props.tsxInfo}
            scheduler_running={this.props.scheduler_running}
            srvLog={this.props.srvLog}
            tool_active = {this.props.tool_active}
          />
        </div>
      )
    } else if (this.state.activeMenu == 'Plan' ) {
      return (
        <div>
          <Button icon='refresh' onClick={this.loadPlanData.bind(this)} label='Refresh Plan'/>
          <NightPlanner
            enabledtargets={this.props.enabledTargetSessions}
            night_plan_updating = {this.props.night_plan_updating}
            planDataLoading = {this.state.planDataLoading}
            planDataLoaded = {this.planDataLoaded}
            night_plan = {this.props.night_plan}
            tsxInfo= {this.props.tsxInfo}
          />
        </div>
      )
    } else if (this.state.activeMenu == 'Targets' ) {
//      <Button disabled={DISABLE} size='mini' onClick={this.addNewTargets.bind(this)}>Add Target</Button>
      return (
        <div>
          <TargetSessionMenu
            targets={this.props.targetSessions}
            target_reports={this.props.target_reports}
            tool_active = {this.props.tool_active}
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
    } else if (this.state.activeMenu == 'Devices') {
      return this.renderDevices();

    } else if (this.state.activeMenu == 'Settings') {
      return (
        <DefaultSettings
          scheduler_running={this.props.scheduler_running}
        />
      )

    } else if (this.state.activeMenu == 'logout') {
      return this.renderLogout();

    } else if (this.state.activeMenu == 'Toolbox') {
      return (
        <Toolbox
          scheduler_report={ this.props.scheduler_report }
          scheduler_running={ this.props.scheduler_running }
          tsxInfo = { this.props.tsxInfo }
          tool_active = { this.props.tool_active }
        />
      )
    } else {
      return (
        <DefaultSettings
          scheduler_running={this.props.scheduler_running}
        />
      )
    }
    this.saveDefaultState('activeMenu');

  }

  renderIPEditor() {

    return (
      <Modal
        open={this.state.modalEnterIp}
        onClose={this.modalEnterIpClose.bind(this)}
        basic
        size='small'
        closeIcon>
        <Modal.Header>Enter the IP to use to connect to the TSX Server.</Modal.Header>
        <Modal.Content>
          <Form>
          <Segment>
              <Form.Input
                label='IP:'
                name='ip'
                value={this.state.ip}
                onChange={this.ipChange}/>
          </Segment>
          </Form>
        </Modal.Content>
        <Modal.Description>
        </Modal.Description>
        <Modal.Actions>
          <Button onClick={this.modalEnterIpClose.bind(this)} inverted>
            <Icon name='cancel' />Cancel
          </Button>
          <Button onClick={this.saveTSXServerIp.bind(this)} inverted>
            <Icon name='save' />Save
          </Button>
        </Modal.Actions>
      </Modal>
    )
  }

  renderPortEditor() {

    return (
      <Modal
        open={this.state.modalEnterPort}
        onClose={this.modalEnterPortClose.bind(this)}
        basic
        size='small'
        closeIcon>
        <Modal.Header>Enter the TCP Port to use to connect to the TSX Server.</Modal.Header>
        <Modal.Content>
        </Modal.Content>
          <Form>
          <Segment>
            <Form.Group>
              <Form.Input
                label='Port: '
                name='port'
                placeholder='Minutes to sleep'
                value={this.state.port}
                onChange={this.portChange}
              />
            </Form.Group>
          </Segment>
          </Form>
        <Modal.Description>
        </Modal.Description>
        <Modal.Actions>
          <Button onClick={this.modalEnterPortClose.bind(this)} inverted>
            <Icon name='cancel' />Cancel
          </Button>
          <Button onClick={this.saveTSXServerPort.bind(this)} inverted>
            <Icon name='save' />Save
          </Button>
        </Modal.Actions>
      </Modal>
    )
  }

  tsxConnectionFailed() {
    return (
      <Modal
        open={this.state.modalConnectionFailed}
        onClose={this.modalConnectionFailedClose.bind(this)}
        basic
        size='small'
        closeIcon>
        <Modal.Header>TSX Connection Failed</Modal.Header>
        <Modal.Content>
          <h3>Check that TheSkyX server is available, and the IP and Port to use to connect to the TSX Server.</h3>
        </Modal.Content>
        <Modal.Description>
          <Input
            label='IP:'
            value={this.state.ip}
          />
          <Input
            label='Port:'
            value={this.state.port}
          />
        </Modal.Description>
        <Modal.Actions>
          <Button onClick={this.modalConnectionFailedClose.bind(this)} inverted>
            <Icon name='stop' />Stop
          </Button>
        </Modal.Actions>
      </Modal>
    )
  };


  // *******************************
  // Night planner
  planDataLoaded() {
    //this.state.enabledActive
    this.setState({
      planDataLoading: false
    })
  }

  loadPlanData() {
    // these are all working methods
    // on the client
    var RUNNING = '';
    var ACTIVE = false;
    try {
      RUNNING = this.props.scheduler_running.value;
      ACTIVE = this.props.tool_active.value;
    } catch (e) {
      RUNNING = '';
      ACTIVE = false;
    }

    var RELOAD = true;
    if( RUNNING == 'Stop'  && ACTIVE == false ){
      RELOAD = false;
    }

    if( RELOAD ) {
      let result = [];
      try {
        // It is possible there is no plan to load...
        result = TheSkyXInfos.findOne({name: 'NightPlan'});
      }
      catch(e) {
        // no plan so do not process
        result = '';
        this.setState({
          planData: '',
          planDataLoading: true,
        });
      }
      if( result != '') {
        this.setState({
          planData: result,
          planDataLoading: false,
        });
      }
    }
    else {
      Meteor.call("planData", function (error, result) {
        // identify the error
        this.setState({
          planData: result,
          planDataLoading: false,
        });
      }.bind(this));
    }
  }

  renderTargetReportModal( night_plans ) {

    // Night Plan for 2019-02-04

    return (
      <Modal
      open={this.state.modalViewNightPlanner}
      onClose={this.modalCloseNightPlanner}
      basic
      closeIcon>
        <Modal.Header>Report</Modal.Header>
        <Modal.Content>
          <NightPlanner
            night_plan_updating = {night_plans}
            planDataLoading = {this.state.planDataLoading}
            planDataLoaded = {this.planDataLoaded}
            night_plan = {this.props.night_plan}
            tsxInfo= {this.props.tsxInfo}
          />
        </Modal.Content>
        <Modal.Description>
        </Modal.Description>
        <Modal.Actions>
        </Modal.Actions>
      </Modal>
    )
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
//        <Button disabled compact />
    return (
      <Button.Group compact size='mini' floated='right'>
        <Button icon='cloud download' onClick={this.modalOpenBackup}/>
        <Button icon='detective' onClick={this.modalOpenSessionsControls}/>
        <Button icon='chart bar' onClick={this.modalShowTargetReport}/>
        <Button disabled={DISABLE} icon='plug' onClick={this.connectToTSX.bind(this)}/>
        <Button disabled={DISABLE} icon='car' onClick={this.park.bind(this)}/>
      </Button.Group>
    )
  }

  renderSessionControls( ) {
    /*
    modalWindowTitle='ControlPanel'
    let test = this.props.defaultMeridianFlip;
     */
    return(
      <Modal
        open={this.state.modalOpenWindowSessionControls}
        onClose={this.modalCloseSessionsControls}
        basic
        size='small'
        closeIcon>
        <Modal.Header>Session Controls</Modal.Header>
        <Modal.Content>
          <SessionControls
            tsxInfo = { this.props.tsxInfo }
          />
        </Modal.Content>
        <Modal.Description>
        </Modal.Description>
        <Modal.Actions>
        </Modal.Actions>
      </Modal>
    )
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

  renderBackupModal() {
    return(
      <Modal
        open={this.state.modalOpenBackup}
        onClose={this.modalCloseBackup}
        basic
        size='small'
        closeIcon>
        <Modal.Header>Backup tsx_cmd DB</Modal.Header>
        <Modal.Content>
          <BackupModal
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
    /* https://react.semantic-ui.com/modules/checkbox#checkbox-example-radio-group
    */
    var IP = '';
    var PORT ='';
    var STATUS ='';
    var MENU = '';
    var VERSION = '';
    var DATE = '';
    var RUNNING = '';
    var ACTIVE = false;
    let PROGRESS = 0;
    let TOTAL = 60;
    try {
      IP = this.props.tsxIP.value;
      PORT = this.props.tsxPort.value;
      STATUS = this.props.currentStage.value;
      MENU = this.props.activeMenu.value;
      VERSION = this.props.tsx_version.value;
      DATE = this.props.tsx_date.value;
      RUNNING = this.props.scheduler_running.value;
      ACTIVE = this.props.tool_active.value;
      PROGRESS = this.props.tsx_progress.value;
      TOTAL = this.props.tsx_total.value;
    } catch (e) {
      IP = 'Initializing';
      PORT = 'Initializing';
      STATUS = 'Initializing';
      MENU = 'Targets';
      VERSION = '...';
      DATE = '...';
      RUNNING = '';
      ACTIVE=false;
      PROGRESS = 0;
      TOTAL = 60;
    }
    var LOG = [];
    var num = 0;
    if( TOTAL == 0 ) {
      TOTAL = 60;
    }
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
            <Segment size='mini' clearing>
                {this.appButtons(RUNNING, ACTIVE)}
                <Label onClick={this.modalEnterIpOpen.bind(this)}>TSX ip:
                  <Label.Detail>
                    {IP}
                  </Label.Detail>
                </Label>
                <Label onClick={this.modalEnterPortOpen.bind(this)}>
                  TSX port:
                  <Label.Detail>
                    {PORT}
                  </Label.Detail>
                </Label>
                <br/>
                {this.renderIPEditor()}
                {this.renderPortEditor()}
            </Segment>
            <Segment>
              <Progress
                size='medium'
                value={PROGRESS}
                total={TOTAL}
                autoSuccess
                progress='ratio'>
                <Label>
                  {STATUS}
                </Label>
              </Progress>
            </Segment>
            <Segment>
              { this.renderMenu( MENU, RUNNING ) }
            </Segment>
          {/* *******************************

          THIS IS FOR A FAILED CONNECTION TO TSX

          *******************************             */}
          {this.renderSessionControls()}
          {this.renderTestModal()}
          {this.renderBackupModal()}
          {this.renderTargetReportModal(this.props.night_plan_updating)}
        </Segment.Group>
        <Modal
          open={this.state.modalConnectionFailed}
          onClose={this.modalConnectionFailedClose.bind(this)}
          basic
          size='small'
          closeIcon>
          <Modal.Header>TSX Connection Failed</Modal.Header>
          <Modal.Content>
            <h3>Check that TheSkyX server is available, and the IP and Port to use to connect to the TSX Server.</h3>
          </Modal.Content>
          <Modal.Description>
            <Input
              label='IP:'
              value={this.state.ip}
            />
            <Input
              label='Port:'
              value={this.state.port}
            />
          </Modal.Description>
          <Modal.Actions>
            <Button onClick={this.modalConnectionFailedClose.bind(this)} inverted>
              <Icon name='stop' />Stop
            </Button>
          </Modal.Actions>
        </Modal>
        <Label>tsx cmd - A web page to send commands to TheSkyX server</Label>
        <Label>version <Label.Detail>{VERSION}</Label.Detail></Label>
        <Label>date <Label.Detail>{DATE}</Label.Detail></Label>
      </div>
    );
  }
}
// *******************************
// THIS IS THE DEFAULT EXPORT AND IS WHERE THE LOADING OF THE COMPONENT STARTS
export default withTracker(() => {
  // Meteor.subscribe('targetSessions');
  // Meteor.subscribe('tsxIP');
  // Meteor.subscribe('scheduler_running');
  // Meteor.subscribe('scheduler_report');
  // Meteor.subscribe('currentStage');
  // Meteor.subscribe('tsxInfo');
  return {
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
    tsxInfo: TheSkyXInfos.find({}).fetch(),
    tsx_version: TheSkyXInfos.findOne({name: 'tsx_version'}),
    tsx_date: TheSkyXInfos.findOne({name: 'tsx_date'}),
    tsxIP: TheSkyXInfos.findOne({name: 'ip'}),
    tsxPort: TheSkyXInfos.findOne({name: 'port'}),
    srvLog: AppLogsDB.find({}, {sort:{time:-1}}).fetch(10),
    activeMenu: TheSkyXInfos.findOne({name: 'activeMenu'}),

    flatSettings: TheSkyXInfos.findOne({name: 'flatSettings'}),
    targetName: TheSkyXInfos.findOne({name: 'targetName'}),
    tsx_progress: TheSkyXInfos.findOne({name: 'tsx_progress'}),
    tsx_total:  TheSkyXInfos.findOne({name: 'tsx_total'}),
    tsx_message: TheSkyXInfos.findOne({name: 'tsx_message'}),
    scheduler_running: TheSkyXInfos.findOne({name: 'scheduler_running'}),
    scheduler_report: TheSkyXInfos.findOne({name: 'scheduler_report'}),
    filters: Filters.find({}, { sort: { slot: 1 } }).fetch(),
//    calibrations: CalibrationFrames.find({}, { sort: { order: 1 } }).fetch(),
    calibrations: CalibrationFrames.find({}).fetch(),
    flatSeries: FlatSeries.find({}).fetch(),
    takeSeriesTemplates: TakeSeriesTemplates.find({ isCalibrationFrames: false }, { sort: { name: 1 } }).fetch(),
    targetSessions: TargetSessions.find({ isCalibrationFrames: false }, { sort: { enabledActive: -1, targetFindName: 1 } }).fetch(),
    enabledTargetSessions: TargetSessions.find({ enabledActive: true }, { sort: { priority: 1 } }).fetch(),
    // targetSessions: TargetSessions.find({ }, { sort: { enabledActive: -1, targetFindName: 1 } }).fetch(),
    target_reports: TargetReports.find({}).fetch(),

    night_plan: TheSkyXInfos.findOne({name: 'NightPlan'}),
    night_plan_updating: TheSkyXInfos.findOne({name: 'night_plan_updating'}),
  };
})(App);
