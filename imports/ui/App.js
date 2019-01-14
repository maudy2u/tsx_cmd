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

import { TextArea, Dimmer, Loader, Grid, Form, Input, Icon, Dropdown, Label, Table, Menu, Segment, Button, Progress, Modal, Radio } from 'semantic-ui-react'

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
import FlatsMenu from './FlatsMenu.js';
import TargetSessionMenu from './TargetSessionMenu.js';
// import Filter from './Filter.js';
import Series from './Series.js';
import TakeSeriesTemplateMenu from './TakeSeriesTemplateMenu.js';
import SessionControls from './SessionControls.js';
import TestModal from './TestModal.js';

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

  constructor() {
    super();
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
      modalNightPlans: false,
      planData: [],
      planDataLoading: true,
    };
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

  modalTargetReport = () => {
    this.setState({planDataLoading: true});
    this.planData(); // get the data from the server.
    this.setState({ modalNightPlans: true });
  };
  modalCloseTest2 = () => this.setState({ modalNightPlans: false });

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
            <Icon name='eye' />
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
          <Dropdown  item name='More' icon='angle double down'>
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
    } else if (this.state.activeMenu == 'Flats') {
      return (
        <FlatsMenu
          scheduler_report={this.props.scheduler_report}
          tsxInfo={this.props.tsxInfo}
          scheduler_running={this.props.scheduler_running}
          tool_active = {this.props.tool_active}
          filters = {this.props.filters}
          flatSeries = {this.props.flatSeries}
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
          scheduler_report={this.props.scheduler_report}
          scheduler_running={this.props.scheduler_running}
          tsxInfo = {this.props.tsxInfo}
          tool_active = {this.props.tool_active}
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

  renderTargetReport( night_planned ) {
    // pop up the upload dialog
    // send the file to server
    // server parses file "key=value"

    // get the time for the sun at Altitiude above and below
    // repeat for each enabled target
    // rows for start and end times....
    let PLAN = [];
    try {
      PLAN = night_planned.value;
    }
    catch( e ) {
      PLAN = [];
      return;
    }

    const STARTTIME = this.propValue(this.props.tsxInfo.find(function(element) {
      return element.name == 'defaultStartTime';
    }));
    const ENDTIME = this.propValue(this.props.tsxInfo.find(function(element) {
      return element.name == 'defaultStopTime';
    }));

    /*
    // Sun: use white for day light, and blue for night
    // Moon: use blue during Moon UP
    // Nautical Twilight is 12 degree below horizon -12, or use the time user set
    // Target: use white for no imaging, and green for imaging
    const possibleColors = [
      'red',
      'orange',
      'yellow',
      'olive',
      'green', // Target imaging time
      'teal', // Before/After start/end time
      'blue', // Moon is UP
      'violet',
      'purple',
      'pink',
      'brown',
      'grey',
      'black', // dark
    ];
    */
    let startHr=0, endHr=0,  bufHr = 1, cols=16;

    try {
      startHr = Number(STARTTIME.split(':')[0].trim());
      endHr = Number(ENDTIME.split(':')[0].trim());
    }
    catch( e ) {
      startHr = 0;
      endHr = 0;
    }

    let plannerIndex = [];
    if( startHr-bufHr < 24 && startHr-bufHr > endHr+bufHr ) {
        for( let i=startHr-bufHr; i < 24; i++ ) {
          plannerIndex.push( i );
        }
    }
    if( endHr+bufHr == 0 || endHr+bufHr < startHr-bufHr ) {
      for( let i=0; i < endHr+bufHr; i++ ) {
        plannerIndex.push( i );
      }
    }

    // *******************************
    // GET MOON data
    // Get any moon data.
    let MOONRISE= '0:0';
    let MOONRISE_HR= 0;
    let MOONSET = '0:0';
    let MOONSET_HR = 0;
    for( let i=0; i<PLAN.length; i ++ ) {
      let obj = PLAN[i];
      if( typeof obj == 'undefined' ) {
        continue;
      }
      let oName = obj.target;
      if( oName != 'Moon') {
        continue;
      }
      let alt = obj.alt;
      let sTime = obj.start;
      let eTime = obj.end;
      MOONRISE = obj.alt_start;
      MOONSET = obj.alt_end;
      MOONRISE_HR = Number(MOONRISE.split(':')[0].trim());
      MOONSET_HR = Number(MOONSET.split(':')[0].trim());

      let hrLimit = plannerIndex[plannerIndex.length-1];
      MOONRISE_HR = this.adjHour( MOONRISE_HR, hrLimit );
      MOONSET_HR = this.adjHour( MOONSET_HR, hrLimit );
      if( MOONSET_HR < MOONRISE_HR ) {
        MOONSET_HR = MOONSET_HR + 24;
      }
      if(MOONSET_HR < 12 ) {
        MOONSET_HR=+24;
      }
    }

    // *******************************
    // createt the GRID

    let colHours = [];
    let planner = [];
    // setup first half

    if( startHr-bufHr < 24 && startHr-bufHr > endHr+bufHr ) {
        for( let i=startHr-bufHr; i < 24; i++ ) {
          colHours.push( i );
          let colour = 'black';
          if( i < startHr || i > endHr ) {
            colour = 'teal';
          }

          // Colour the Moon
          if( i >= MOONRISE_HR && i <= MOONSET_HR) {
            colour = 'blue';
          }
          let note = i;
          if( i == MOONRISE_HR ) {
            note = MOONRISE;
          }
          else if( i == MOONSET_HR ) {
            note = MOONSET;
          }

          // add in moonlight hour colouring...
          // i.e. if within the moonrise hours... make text Colours XXX
          planner.push(
            <Grid.Column key={i} color={colour}>
                <small>{note}</small>
            </Grid.Column>
          );
        }
    }
    // setup last half
    if( endHr+bufHr == 0 || endHr+bufHr < startHr-bufHr ) {
      for( let j=0; j < endHr+bufHr; j++ ) {
        colHours.push( j );
        let colour = 'black';
        if( j > endHr ) {
          colour = 'teal';
        }
        // Colour the Moon
        if( j+24 >= MOONRISE_HR && j+24 <= MOONSET_HR) {
          colour = 'blue';
        }
        let note = j;
        if( j+24 == MOONRISE_HR ) {
          note = MOONRISE;
        }
        else if( j+24 == MOONSET_HR ) {
          note = MOONSET;
        }

        planner.push(
          <Grid.Column key={j} color={colour}>
            <small>{note}</small>
          </Grid.Column>
        );
      }
    }

    // if( planner.length == 0 ) {
    //   return;
    // }
    //
    return(
      <Modal
        open={this.state.modalNightPlans}
        onClose={this.modalCloseTest2}
        basic
//        size='small'
        closeIcon>
        <Modal.Header>Night Plan</Modal.Header>
        <Modal.Content>
          <Segment secondary>
            Defaults: starts={STARTTIME}, ends={ENDTIME}<br/>Teal=Waiting, Blue=Moon, Green=Imaging<br/>
            <Segment>
              <Dimmer active={this.state.planDataLoading}>
                  <Loader size='small'>Loading</Loader>
              </Dimmer>
              <Grid columns={planner.length}>
                <Grid.Row>
                  {planner}
                </Grid.Row>
                {this.renderTargetRow( PLAN, colHours )}
              </Grid>
            </Segment>
{/*            {PLAN.map((O)=>{
                return (
                   <div>
                    OBJ:{O.target},ALT:{O.alt},S:{O.start},E:{O.end},R:{O.alt_start},D:{O.alt_end}
                  </div>
                )
              })}
*/}          </Segment>
        </Modal.Content>
        <Modal.Description>
{/*          <Segment secondary>
            <Grid columns={5} padded>
              {colors.map(color => (
                <Grid.Column color={color} key={color}>
                  {color}
                </Grid.Column>
              ))}
            </Grid>
          </Segment>
*/}        </Modal.Description>
        <Modal.Actions>
        </Modal.Actions>
      </Modal>
    )
  }

  adjHour( hr, limit ) {
    if( hr <= limit ) {
      hr = hr + 24;
    }
    return hr;
  }

  renderTargetRow( DATA, colHours ) {

    let Out = [];
    for( let i=0; i<DATA.length; i ++ ) {
      let obj = DATA[i];
      if( typeof obj == 'undefined' ) {
        continue;
      }
      let oName = obj.target;
      if( oName == 'Sun' || oName == 'Moon') {
        continue;
      }
      let alt = obj.alt;
      let sTime = obj.start;
      let eTime = obj.end;
      let rise = obj.alt_start;
      let down = obj.alt_end;
      let COL = [];
      // only do the planner number of cols
      let hrLimit = colHours[colHours.length-1];
      for( let j=0; j< colHours.length; j++ ) {

        let hr = this.adjHour( colHours[j], hrLimit );

        let startHr=0,endHr=0,rHr=0,dHr=0;
        let colour = 'black';
        try {
          startHr = this.adjHour( Number(sTime.split(':')[0].trim()), hrLimit );
          endHr = this.adjHour( Number(eTime.split(':')[0].trim()), hrLimit );
          rHr = this.adjHour( Number(rise.split(':')[0].trim()), hrLimit );
          dHr = this.adjHour( Number(down.split(':')[0].trim()), hrLimit );
          if( dHr < rHr ) {
            dHr = dHr + 24;
          }
          // console.log(
          //    'HR: ' + hr + ', OBJ: ' + oName + ',ALT: ' + alt + ',S: ' + startHr + ',E: ' + endHr + ',R: ' + rHr + ',D: ' + dHr
          // )
        }
        catch( e ) {
          startHr = 0;
          endHr = 0;
          rHr = 0;
          dHr = 0;
        }
        if(
          (hr >= startHr
          && hr >= rHr
          )
          &&
          (
          hr <= endHr
          && hr <= dHr
          )
        ) {
          colour = 'green';
        }
        var note = '';

        if( j == 0 ) {
          note = oName;
        }
        else if( hr == dHr ) {
          note = down;
        }
        else if( hr == endHr ) {
          note = eTime;
        }
        else if( hr == startHr ) {
          note = sTime;
        }
        else if( hr == rHr ) {
          note = rise;
        }

        COL.push(
          <Grid.Column key={j} color={colour}>
              <small>{note}</small>
          </Grid.Column>
        );
      }
      Out.push(
        <Grid.Row key={oName+i}>
          {COL}
        </Grid.Row>
      )
    }
    return Out;
  }

  planData() {

    // these are all working methods
    // on the client
    Meteor.call("planData", function (error, result) {
      // identify the error
      this.setState({
        planData: result,
      });
      this.setState({planDataLoading: false});
    }.bind(this));
  }


  parkButtons( state, active ) {
    // detective
    var DISABLE = true;
    var NOT_DISABLE = false;
    // then use as needed disabled={DISABLE} or disabled={NOT_DISABLE}
    if( state == 'Stop'  && active == false ){
      DISABLE = false;
      NOT_DISABLE = true;
    }

    return (
      <Button.Group basic size='small' floated='right'>
        <Button icon='cloud download' onClick={this.modalOpenTest}/>
        <Button icon='detective' onClick={this.modalOpenSessionsControls}/>
        <Button disabled={DISABLE} icon='chart bar' onClick={this.modalTargetReport}/>
        <Button disabled compact />
        <Button disabled={DISABLE} icon='wifi' onClick={this.connectToTSX.bind(this)}/>
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
    let TOTAL = 0;
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
      TOTAL = 0;
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
          <Segment>
            <Segment.Group>
              <Segment.Group horizontal size='mini'>
                <Segment>
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
                </Segment>
                <Segment>
                  {this.parkButtons(RUNNING, ACTIVE)}
                </Segment>
                {this.renderIPEditor()}
                {this.renderPortEditor()}
              </Segment.Group>
              <Segment raised>
                <Label>Status: <Label.Detail>{STATUS}</Label.Detail></Label>
                <br/>
                <Progress value={PROGRESS} total={TOTAL} progress='ratio'>Processing</Progress>
              </Segment>
          </Segment.Group>
          <Segment.Group>
              <Segment>
            { this.renderMenu( MENU, RUNNING ) }
            </Segment>
          </Segment.Group>
          {/* *******************************

          THIS IS FOR A FAILED CONNECTION TO TSX

          *******************************             */}
          {this.renderSessionControls()}
          {this.renderTestModal()}
          {this.renderTargetReport(this.props.night_plan)}
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
        </Segment>
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
  Meteor.subscribe('targetSessions');
  Meteor.subscribe('tsxIP');
  Meteor.subscribe('scheduler_running');
  Meteor.subscribe('scheduler_report');
  Meteor.subscribe('currentStage');
  Meteor.subscribe('tsxInfo');
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
    flatSeries: FlatSeries.find({}).fetch(),
    takeSeriesTemplates: TakeSeriesTemplates.find({ isCalibrationFrames: false }, { sort: { name: 1 } }).fetch(),
    targetSessions: TargetSessions.find({ isCalibrationFrames: false }, { sort: { enabledActive: -1, targetFindName: 1 } }).fetch(),
    // targetSessions: TargetSessions.find({ }, { sort: { enabledActive: -1, targetFindName: 1 } }).fetch(),
    target_reports: TargetReports.find({}).fetch(),

    night_plan: TheSkyXInfos.findOne({name: 'NightPlan'}),
    night_plan_updating: TheSkyXInfos.findOne({name: 'night_plan_updating'}),
  };
})(App);
