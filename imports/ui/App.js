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

import { TextArea, Form, Input, Icon, Dropdown, Label, Table, Menu, Segment, Button, Progress, Modal, Radio } from 'semantic-ui-react'

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
import { FlatSeries } from '../api/flatSeries.js';
import { TheSkyXInfos } from '../api/theSkyXInfos.js';
import { AppLogsDB } from '../api/theLoggers.js'

// Import the UI
import DefaultSettings from './DefaultSettings.js';
import Monitor from './Monitor.js';
import Toolbox from './Toolbox.js';
import Flats from './Flats.js';
import TargetSessionMenu from './TargetSessionMenu.js';
// import Filter from './Filter.js';
import Series from './Series.js';
import TakeSeriesTemplateMenu from './TakeSeriesTemplateMenu.js';

import {
  tsx_ServerStates,
  tsx_UpdateServerState,
  UpdateStatus,
  // tsx_GetServerState,
} from  '../api/serverStates.js';

import ReactSimpleRange from 'react-simple-range';
import Timekeeper from 'react-timekeeper';

// App component - represents the whole app
class App extends TrackerReact(Component) {

  state = {
    activeMenu: 'Targets',
    saveServerFailed: false,
    modalEnterIp: false,
    modalEnterPort: false,
    modalConnectionFailed: false,
    showMonitor: false, // this needs to be a server session variable

    ip: 'localhost',
    port: '3040',
    currentStage: ' Loading....',
  };

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
        saveDefaultState('activeMenu');
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
        <Menu tabular icon>
          <Menu.Item name='Monitor' active={activeMenu === 'Monitor'} onClick={this.handleMenuItemClick}>
            <Icon name='camera' />
          </Menu.Item>
          <Menu.Item name='Targets' active={activeMenu === 'Targets'} onClick={this.handleMenuItemClick}>
            <Icon name='target' />
          </Menu.Item>
          <Menu.Item name='Series' active={activeMenu === 'Series'} onClick={this.handleMenuItemClick}>
            <Icon name='list ol' />
          </Menu.Item>
          <Menu.Item name='Flats' active={activeMenu === 'Flats'} onClick={this.handleMenuItemClick}>
            <Icon name="area graph" />
          </Menu.Item>
          <Menu.Item name='Toolbox' active={activeMenu === 'Toolbox'} onClick={this.handleMenuItemClick}>
            <Icon name='briefcase' />
          </Menu.Item>
          <Dropdown icon='dropdown'>
            <Dropdown.Menu>
              <Dropdown.Item name='Devices' icon='power cord' active={activeMenu === 'Devices'} onClick={this.handleMenuItemClick}/>
              <Dropdown.Item name='Settings' icon='configure' active={activeMenu === 'Settings'} onClick={this.handleMenuItemClick}/>
            </Dropdown.Menu>
          </Dropdown>
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
    } else if (this.state.activeMenu == 'Targets' ) {
      return (
        <div>
          <Button disabled={DISABLE} size='mini' onClick={this.addNewTargets.bind(this)}>Add Target</Button>
          <TargetSessionMenu
            targets={this.props.targetSessions}
            scheduler_running={this.props.scheduler_running}
            tool_active = {this.props.tool_active}
          />
        </div>
      )
    } else if (this.state.activeMenu == 'Series') {
      return (
        <div>
          <Button disabled={DISABLE} size='mini' onClick={this.addNewTakeSeries.bind(this)}>Add Series</Button>
          <TakeSeriesTemplateMenu
            seriesList={this.props.takeSeriesTemplates}
            scheduler_running={this.props.scheduler_running}
            tool_active = {this.props.tool_active}
          />
      </div>
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
          scheduler_report={this.props.scheduler_report}
          scheduler_running={this.props.scheduler_running}
          tsxInfo = {this.props.tsxInfo}
          tool_active = {this.props.tool_active}
        />
      )
    } else if (this.state.activeMenu == 'Flats') {
      return (
        <Flats
          scheduler_report={this.props.scheduler_report}
          tsxInfo={this.props.tsxInfo}
          scheduler_running={this.props.scheduler_running}
          tool_active = {this.props.tool_active}
          filters = {this.props.filters}
          flatSeries = {this.props.flatSeries}
        />
      )
    } else {
      return (
        <DefaultSettings
          scheduler_running={this.props.scheduler_running}
        />
      )
    }
    saveDefaultState('activeMenu');
  }

  renderIPEditor() {

    return (
      <Modal
        open={this.state.modalEnterIp}
        onClose={this.modalEnterIpClose.bind(this)}
        basic
        size='small'
        closeIcon>
        <Modal.Header>TSX Server IP</Modal.Header>
        <Modal.Content>
          <h3>Enter the IP to use to connect to the TSX Server.</h3>
        </Modal.Content>
        <Modal.Description>
          <Input
            label='IP:'
            name='ip'
            value={this.state.ip}
            onChange={this.ipChange}/>
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
        <Modal.Header>TSX Server TCP Port</Modal.Header>
        <Modal.Content>
          <h3>Enter the TCP Port to use to connect to the TSX Server.</h3>
        </Modal.Content>
        <Modal.Description>
          <Form.Input
            label='Port: '
            name='port'
            placeholder='Minutes to sleep'
            value={this.state.port}
            onChange={this.portChange}
          />
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

  addNewTargets() {
    // get the id for the new object
    var out = addNewTargetSession();
    console.log('Left TargetSessionMenu addNewTarget');
  };

  addNewTakeSeries() {
    var out = addNewTakeSeriesTemplate();
  };

  parkButtons( state, active ) {
    if( state == 'Stop' && active == false ) {
      return (
        <div>
          <Button icon='wifi' onClick={this.connectToTSX.bind(this)}/>
          <Button icon='car' onClick={this.park.bind(this)}/>
        </div>
      )
    }
    else {
      return (
        <div>
          <Button disabled icon='wifi' onClick={this.connectToTSX.bind(this)}/>
          <Button disabled icon='car' onClick={this.park.bind(this)}/>
        </div>
      )
    }
  }

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
    try {
      IP = this.props.tsxIP.value;
      PORT = this.props.tsxPort.value;
      STATUS = this.props.currentStage.value;
      MENU = this.props.activeMenu.value;
      VERSION = this.props.tsx_version.value;
      DATE = this.props.tsx_date.value;
      RUNNING = this.props.scheduler_running.value;
      ACTIVE = this.props.tool_active.value;
    } catch (e) {
      IP = 'Initializing';
      PORT = 'Initializing';
      STATUS = 'Initializing';
      MENU = 'Targets';
      VERSION = '...';
      DATE = '...';
      RUNNING = '';
      ACTIVE=false;
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
          <div>
            <Segment.Group>
              <Segment>
                <Label onClick={this.modalEnterIpOpen.bind(this)}>TSX ip:
                  <Label.Detail>
                    {IP}
                  </Label.Detail>
                </Label>
                 {this.renderIPEditor()}
                <Label onClick={this.modalEnterPortOpen.bind(this)}>
                  TSX port:
                  <Label.Detail>
                    {PORT}
                  </Label.Detail>
                </Label>
                {this.renderPortEditor()}
                <Button.Group basic size='small' floated='right'>
                  {this.parkButtons(RUNNING, ACTIVE)}
                </Button.Group>
              </Segment>
              <Segment>
                <Label>Status: <Label.Detail>{STATUS}</Label.Detail></Label>
              </Segment>
            {/* { this.tsxConnectionFailed() } */}
              <Segment>
            { this.renderMenu( MENU, RUNNING ) }
            </Segment>
          </Segment.Group>
          {/* *******************************

          THIS IS FOR A FAILED CONNECTION TO TSX

          *******************************             */}
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
          </div>
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

    return {
      tool_calibrate_via: TheSkyXInfos.findOne({name: 'tool_calibrate_via'}),
      tool_calibrate_location: TheSkyXInfos.findOne({name: 'tool_calibrate_location'}),
      tool_rotator_num: TheSkyXInfos.findOne({name: 'tool_rotator_num'}),
      tool_rotator_type: TheSkyXInfos.findOne({name: 'tool_rotator_type'}),
      tool_active: TheSkyXInfos.findOne({name: 'tool_active'}),

      tsx_version: TheSkyXInfos.findOne({name: 'tsx_version'}),
      tsx_date: TheSkyXInfos.findOne({name: 'tsx_date'}),
      flatSettings: TheSkyXInfos.findOne({name: 'flatSettings'}),
      currentStage: TheSkyXInfos.findOne({name: 'currentStage'}),
      activeMenu: TheSkyXInfos.findOne({name: 'activeMenu'}),
      targetName: TheSkyXInfos.findOne({name: 'targetName'}),
      tsx_progress: TheSkyXInfos.findOne({name: 'tsx_progress'}),
      tsx_total:  TheSkyXInfos.findOne({name: 'tsx_total'}),
      tsx_message: TheSkyXInfos.findOne({name: 'tsx_message'}),
      scheduler_running: TheSkyXInfos.findOne({name: 'scheduler_running'}),
      scheduler_report: TheSkyXInfos.findOne({name: 'scheduler_report'}),
      tsxIP: TheSkyXInfos.findOne({name: 'ip'}),
      tsxPort: TheSkyXInfos.findOne({name: 'port'}),
      tsxInfo: TheSkyXInfos.find({}).fetch(),
      srvLog: AppLogsDB.find({}, {sort:{time:-1}}).fetch(10),
      filters: Filters.find({}, { sort: { slot: 1 } }).fetch(),
      flatSeries: FlatSeries.find({}).fetch(),
      takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
      targetSessions: TargetSessions.find({}, { sort: { enabledActive: -1, targetFindName: 1 } }).fetch(),
      targetReports: TargetReports.find({}).fetch(),
  };
})(App);
