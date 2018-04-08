import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Session } from 'meteor/session'


// import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';

import { Input, Icon, Dropdown, Label, Table, Menu, Segment, Button, Progress, Modal, Form, Radio } from 'semantic-ui-react'

// Import the API Model
import { SessionTemplates } from '../api/sessionTemplates.js';
import { TakeSeriesTemplates} from '../api/takeSeriesTemplates.js';
import { Seriess } from '../api/seriess.js';
import { Filters } from '../api/filters.js';
import { TargetSessions } from '../api/targetSessions.js';
import { TheSkyXInfos } from '../api/theSkyXInfos.js';

// Import the UI
import Monitor from './Monitor.js';
import TargetSessionMenu from './TargetSessionMenu.js';
import SessionTemplate from './SessionTemplate.js';
import Filter from './Filter.js';
import Series from './Series.js';
import TakeSeriesTemplateMenu from './TakeSeriesTemplateMenu.js';
import TheSkyXInfo from './TheSkyXInfo.js';


import {
  tsx_ServerStates,
  // tsx_UpdateServerState,
  // tsx_GetServerState,
} from  '../api/serverStates.js';


// Examples
import Task from './Task.js';

// App component - represents the whole app
class App extends Component {

  state = {
    activeItem: 'Targets',
    ip: 'Not connected',
    port: 'Not connected',
    saveServerFailed: false,
    modalEnterIp: false,
    modalEnterPort: false,

    defaultMinAlt: 30,
    defaultCoolTemp: -20,
    defaultFocusTempDiff: 0.7,
    defaultMeridianFlip: true,
    defaultStartTime: 21,
    defaultStopTime: 6,

    showMonitor: false, // this needs to be a server session variable
  };

  handleToggle = (e, { name, value }) => this.setState({ [name]: !eval('this.state.'+name) })

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

  defaultMeridianFlipChange() {
    this.setState({defaultMeridianFlip: !this.state.defaultMeridianFlip});
  }



  //    this.setState({port: this.state.port});
  // TargetSessions.update({_id: this.props.target._id}, {
  //   $set: { enabledActive: !this.props.target.enabledActive },
  // })
  saveTSXServerConnection() {

    if( this.state.port == "" || this.state.ip == ""  ) {
      this.saveServerFailedOpen();
    }
    else {
      var portId = TheSkyXInfos.findOne({name: 'port'});
      if ( typeof portId == 'undefined' ) {
        TheSkyXInfos.insert({
          name: 'port',
          text: this.state.port
        });
      }
      else {
        TheSkyXInfos.update( {_id: portId._id}, {
          $set: { text: this.state.port}
        });
      }
      var pID = TheSkyXInfos.findOne({name: 'ip'});
      if ( typeof pID == 'undefined' ) {
        TheSkyXInfos.insert({
          name: 'ip',
          text: this.state.ip
        });
      }
      else {
        TheSkyXInfos.update( {_id: pID._id }, {
          $set: { text: this.state.ip}
        });
      }
    };
  };

  componentWillMount() {
    // do not modify the state directly
    // console.log('End initialization');

  };

  // *******************************
  //
  getImageSessions() {
    return [
      { _id: 1, description: 'M1: 33 Lumx300s, 33 Rx300s, 33 Bx300s, 33 Gx300s' },
      { _id: 2, description: 'This is task 2' },
      { _id: 3, description: 'This is task 3' },
    ];
  };

  // *******************************
  //
  // Default creation of sessions using above method
  renderTargetSessions() {

/*
  If there is no content in the map then use the test data to create a samples

*/
    // var chkTargetSize = testTargetSessions.length;
    // console.log('Number of Target Sessions found in Test data: ' + chkTargetSize);
    //
    // var chkSeriesSize = testAllTakeSeriesTemplates.length;
    // console.log('Number of Series Templates found in Test data: ' + chkSeriesSize);

    var chkDBSize = Object.keys(this.props.targetSessions).length;
    console.log('Number of Sessions found in Mongo DB: ' + chkDBSize);

    // switch "this.props.targetSessions" to "testTargetSessions" if trying to
    // load the test data instead... should be able to remove if the load is right
    return this.props.targetSessions.map((targetSession) => (
      <TargetSession key={targetSession._id} targetSession={targetSession} />
    ));
  }

  // *******************************
  //
  addNewFilter(event) {
    // Find the text field via the React ref
    const text = ReactDOM.findDOMNode(this.refs.textInput).value.trim();

    Filters.insert({
      name: text,
      createdAt: new Date(), // current time
      offset: 0,
    });
    // Clear form
    ReactDOM.findDOMNode(this.refs.textInput).value = '';
  }

  // *******************************
  //
  renderTSXConnetion() {

    // var pID = TheSkyXInfos.findOne( { name: 'ip'} );
    // if( typeof pID == 'undefined') {
    //   TheSkyXInfos.insert(
    //     name: 'ip',
    //     text: ""
    //   );
    // }
    // var portID = TheSkyXInfos.findOne( { name: 'port'} );
    // if( typeof portID == 'undefined') {
    //   TheSkyXInfos.insert(
    //     name: 'port',
    //     text: ""
    //   );
    // }

    return (
      <Segment>
        <Form>
          <Form.Group widths='equal' onSubmit={this.connectTSX.bind(this)}>
            <Form.Input
              label='IP Address'
              className='textIP'
              placeholder="Enter TSX address"
              defaultValue={this.state.ip}
              onChange={this.ipChange}/>
            <Form.Input
              label='Port'
              placeholder="Enter TSX port"
              defaultValue={this.state.port}
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
  connectTSX(event) {

    TheSkyXInfos.upsert({
      name: 'TheSkyX_connection',
      connection: {
        address: tsx_ip, // current time
        port: tsx_port,
      },
    });
  }

  // *******************************
  //
  // Used to put the filter line into the table
  renderFilters() {
    // "filters" ise created in the withTracker loading at the bottom
    return this.props.filters.map((obj) => (
      <Filter key={obj._id} filter={obj} />
    ));
  }

  // *******************************
  //
  renderDropDownFiltersTest() {
    return [
      { text: 'Static Lum', value: 0 },
      { text: 'Static R', value: 1 },
      { text: 'Static G', value: 2 },
    ];
  }
  renderDropDownFilters() {
    // Get the filters
    return [
      { name: 'Static Lum', value: 0 },
      { name: 'Static R', value: 1 },
      { name: 'Static G', value: 2 },
    ];
  }

  // *******************************
  // This is used to populate drop down frame lists
  renderDropDownFrames() {
    return [
      { type: 'Light', value: 0 },
      { type: 'Dark', value: 1 },
      { type: 'Flat', value: 2 },
      { type: 'Bias', value: 2 },
    ];
  }

  // *******************************
  getTasks() {
    return [
      { _id: 1, text: 'This is task 1' },
      { _id: 2, text: 'This is task 2' },
      { _id: 3, text: 'This is task 3' },
    ];
  }

  // *******************************
  //
  renderTasks() {
    return this.getTasks().map((task) => (
      <Task key={task._id} task={task} />
    ));
  }

  // *******************************
  //
  renderMonitor() {
    return  (
      <Monitor  />
    );
  }

  // *******************************
  //
  tsxUpdateFilterNames() {

    // on the client
    Meteor.call("tsx_updateFilterNames", function (error) {
      // identify the error
      if (error && error.error === "logged-out") {
        // show a nice error message
        Session.set("errorMessage", "Please log in to post a comment.");
      }
    });
  }

  // *******************************
  //
  renderTargetSequences(){

    // need to retrieve the process for the session, and for the series...

    var cImage = 10;
    var tImage = 33;
    var iNum = (cImage/tImage*100).toFixed(0);
    console.log( 'Percent complete: ' + iNum);

    return (
      <div>
        <Button.Group basic size='small'>
          <Button icon='settings' onClick={this.loadTestDataMeteorMethod.bind(this)}/>
          <Button icon='find' onClick={this.chkTestData.bind(this)}/>
          <Button icon='upload' />
        </Button.Group>
      <Table celled selectable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Description</Table.HeaderCell>
            <Table.HeaderCell>Progress</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
            {this.renderTargetSessions()}
        </Table.Body>
      </Table>
      </div>
    );
  }

  renderModalSeriesTable() {
    return (
      <div>
      </div>
    );
  }

  /*
  <Dropdown placeholder='Select Filter' fluid selection options={this.renderDropDownFiltersTest()} />
  <table className="ui selectable celled table">
    <thead>
      <tr>
        <th>Series#</th>
        <th>Frame/Action</th>
        <th>Exposure/Time/Temp</th>
        <th>Binning</th>
        <th>Filter</th>
        <th>Repeat</th>
        <th>Calibration</th>
        <th>Progress</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <div className="ui checked checkbox">
            <input type="checkbox" checked="" name="series1" readOnly="" tabIndex="0" />
            <label>This checkbox comes pre-checked</label>
          </div>
          1
        </td>
        <td>Light</td>
        <td>300</td>
        <td>1x1</td>
        <td>Lum</td>
        <td>33</td>
        <td>None</td>
        <td><Progress percent={0} progress /></td>
      </tr>
    </tbody>
  </table>
   */


  // *******************************
  //
  //aSeriesForm = EditorSeriesForm.render();

  renderTakeSeriesTemplates() {
  }


  saveDefaultState( param ) {
    var paramId = TheSkyXInfos.findOne({name: param});
    if ( typeof paramId == 'undefined' ) {
      TheSkyXInfos.insert({
        name: param,
        text: eval("this.state."+param)
      });
    }
    else {
      TheSkyXInfos.update( {_id: paramId._id}, {
        $set: { text: eval("this.state."+param)}
      });
    }
  }

  saveDefaults(){
    this.saveDefaultState('defaultMinAlt');
    this.saveDefaultState('defaultCoolTemp');
    this.saveDefaultState('defaultFocusTempDiff');
    this.saveDefaultState('defaultMeridianFlip');
    this.saveDefaultState('defaultStartTime');
    this.saveDefaultState('defaultStopTime');

  }
  // *******************************
  //
  renderDefaultSettings() {
    const timeOptions = {
      //inline: true,
      format: 'YYYY-MM-DD HH:mm',
      sideBySide: true,
      // icons: time,
      // minDate: new Date(),
    };

    return (
      <Segment.Group>
        <Segment>
          <Button  icon='settings' onClick={this.tsxUpdateFilterNames.bind(this)} />
          <Button icon='save' onClick={this.saveTSXServerConnection.bind(this)}/>
          <Button onClick={this.saveDefaults.bind(this)}>Save Defaults</Button>
          {this.renderTSXConnetion()}
        </Segment>
        <Segment>
          <Form.Group>
            <h3 className="ui header">Defaults</h3>
            <Form.Input
              label='Minimum Altitude '
              name='defaultMinAlt'
              placeholder='Enter Minimum Altitude to start/stop'
              value={this.state.defaultMinAlt}
              onChange={this.handleChange}
            />
            <Form.Input
              label='Cooling Temperature '
              name='defaultCoolTemp'
              placeholder='-20'
              value={this.state.defaultCoolTemp}
              onChange={this.handleChange}
            />
            <Form.Input
              label='Focusing Temperature'
              name='defaultCoolTemp'
              placeholder='Temp diff to run auto focus'
              value={this.state.defaultFocusTempDiff}
              onChange={this.handleChange}
            />
            <Form.Checkbox
              label='Meridian Flip Enabled'
              name='merdianFlip'
              toggle
              placeholder= 'Enable auto meridian flip'
              checked={this.state.defaultMeridianFlip}
              onChange={this.defaultMeridianFlipChange.bind(this)}
            />
            <Form.Input
              label='Start Time'
              name='defaultStartTime'
              placeholder= 'Enter time to start'
              value={this.state.defaultStartTime}
              onChange={this.handleChange}
            />
            <Form.Input
              label='Stop Time'
              name='defaultStopTime'
              placeholder= 'Enter time to stop'
              value={this.state.defaultStopTime}
              onChange={this.handleChange}
            />
          </Form.Group>
        </Segment>
      </Segment.Group>
    );
  }

  renderDevices() {

    var tsxInfo = this.props.tsxInfo;
    //    var tsxInfo = TheSkyXInfos.find().fetch();
    ip = tsxInfo.ip;
    port = tsxInfo.port;

    var mount = TheSkyXInfos.findOne({name:'mount'});
    var mountInfo;
    if( (typeof mount.mount.manufacturer != 'undefined') && (typeof mount.mount.model != 'undefined') ) {
      mountInfo = mount.mount.manufacturer + '|' + mount.mount.model;
    }
    else {
      mountInfo = 'Not connected';
    }

    var camera = TheSkyXInfos.findOne({name:'camera'});
    var cameraInfo;
    if( (typeof camera.camera.manufacturer != 'undefined') && (typeof camera.camera.model != 'undefined') ) {
      cameraInfo = camera.camera.manufacturer + '|' + camera.camera.model;
    }
    else {
      cameraInfo = 'Not connected';
    }

    var guider = TheSkyXInfos.findOne({name:'guider'});
    var guiderInfo;
    if( (typeof guider.guider.manufacturer != 'undefined') && (typeof guider.guider.model != 'undefined') ) {
      guiderInfo = guider.guider.manufacturer + '|' + guider.guider.model;
    }
    else {
      guiderInfo = 'Not connected';
    }

    var rotator = TheSkyXInfos.findOne({name:'rotator'});
    var rotatorInfo;
    if( (typeof rotator.rotator.manufacturer != 'undefined') && (typeof rotator.rotator.model != 'undefined') ) {
      rotatorInfo = rotator.rotator.manufacturer + '|' + rotator.rotator.model;
    }
    else {
      rotatorInfo = 'Not connected';
    }

    var efw = TheSkyXInfos.findOne({name:'efw'});
    var efwInfo;
    if( (typeof efw.efw.manufacturer != 'undefined') && (typeof efw.efw.model != 'undefined') ) {
      efwInfo = efw.efw.manufacturer + '|' + efw.efw.model;
    }
    else {
      efwInfo = 'Not connected';
    }

    var focuser = TheSkyXInfos.findOne({name:'focuser'});
    var focuserInfo;
    if( (typeof focuser.focuser.manufacturer != 'undefined') && (typeof focuser.focuser.model != 'undefined') ) {
      focuserInfo = focuser.focuser.manufacturer + '|' + focuser.focuser.model;
    }
    else {
      focuserInfo = 'Not connected';
    }

    return (
        <Segment.Group>
          <Segment><Label>Mount<Label.Detail>
            {mountInfo}
          </Label.Detail></Label></Segment>
          <Segment><Label>Camera<Label.Detail>
            {cameraInfo}
          </Label.Detail></Label></Segment>
          <Segment><Label>Autoguider<Label.Detail>
            {guiderInfo}
          </Label.Detail></Label></Segment>
          <Segment><Label>Filter Wheel<Label.Detail>
            {efwInfo}
          </Label.Detail></Label></Segment>
          <Segment><Label>Focuser<Label.Detail>
            {focuserInfo}
          </Label.Detail></Label></Segment>
          <Segment><Label>Rotator<Label.Detail>
            {rotatorInfo}
          </Label.Detail></Label></Segment>
        </Segment.Group>
    );

  }

  // *******************************
  //
  renderLogout() {

  }

  // *******************************
  //
  renderMenuSegments(){

    console.log('Found state: ' + this.state.activeItem);

    if (this.state.activeItem == 'Targets' ) {
      console.log('Running state: ' + this.state.activeItem);
      return (
        <TargetSessionMenu />
      )
    } else if (this.state.activeItem == 'Series') {
      return (
        <TakeSeriesTemplateMenu />
      )
    } else if (this.state.activeItem == 'Devices') {
      return this.renderDevices();

    } else if (this.state.activeItem == 'Settings') {
      return this.renderDefaultSettings();

    } else if (this.state.activeItem == 'tests') {
      console.log('Running state: ' + this.state.activeItem);
      return this.renderTestSegement();

    } else if (this.state.activeItem == 'logout') {
      return this.renderLogout();

    } else {
      this.state = { activeItem: 'Targets' };
      return (
        <TargetSessionMenu />
      )
    }
  }

  // *******************************
  //
  addNewTemplate() {
    TakeSeriesTemplates.insert({
      name: "",
      processSeries: "across series",
      // series: {
      //   order: 0,
      //   checked: false,
      //   series: [
      //     { order: 'Order', value: 0 },
      //     { exposure: 'Exposure', value: 1 },
      //     { binning: 'Binning', value: 1 },
      //     { frame: 'Frame', value: 'Light' },
      //     { filter: 'LUM', value: 0 },
      //     { repeat: 'Repeat', value: 1 },
      //   ],
      // },
      createdAt: new Date(), // current time
    });
    return;
  }

  saveTSXServerIp() {

  }

  connectToTSX() {

    // these are all working methods
    var pid = this.props.tsxIP.text;
    var prt = this.props.tsxPort.text;

    // var portId = TheSkyXInfos.findOne({name: 'port'});
    if( typeof pid != 'undefined' ) { //}&& (typeof portId != 'undefined') ) {
      this.setState({ ip: pid.trim() });
    }
    // var portId = TheSkyXInfos.findOne({name: 'port'});
    if( typeof prt != 'undefined' ) { //}&& (typeof portId != 'undefined') ) {
      ip = prt.text;
      this.setState({ port: prt.trim() });
    }

    // on the client
    Meteor.call("connectTsx", function (error) {
      // identify the error
      if (error && error.error === "logged-out") {
        // show a nice error message
        Session.set("errorMessage", "Please log in to post a comment.");
      }
    });

  }

  getTsxIp() {
    var found = this.props.tsxIP.name;
    if( typeof found == 'undefined') {
      found = 'Click to enter IP'
    }
    return (
        <div>
          {found}
        </div>
    )
  }

  serverTest() {

    // on the client
    Meteor.call("serverSideText", function (error) {
      // identify the error
      if (error && error.error === "logged-out") {
        // show a nice error message
        Session.set("errorMessage", "Please log in to post a comment.");
      }
    });

  }

  renderMenu() {
    const { activeItem  } = this.state;

    return(
      <div>
        <Menu pointing secondary>
          <Menu.Item name='Targets' active={activeItem === 'Targets'} onClick={this.handleMenuItemClick} />
          <Menu.Item name='Series' active={activeItem === 'Series'} onClick={this.handleMenuItemClick} />
          <Menu.Item name='Devices' active={activeItem === 'Devices'} onClick={this.handleMenuItemClick} />
          <Menu.Item name='Settings' active={activeItem === 'Settings'} onClick={this.handleMenuItemClick} />
          <Menu.Menu position='right'>
            <Menu.Item name='tests' active={activeItem === 'tests'} onClick={this.handleMenuItemClick} />
            <Menu.Item name='logout' active={activeItem === 'logout'} onClick={this.handleMenuItemClick} />
          </Menu.Menu>
        </Menu>
        <Segment raised>
          {this.renderMenuSegments()}
        </Segment>
      </div>
    )
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
            value={this.state.ip}
            onChange={this.ipChange}/>
        </Modal.Description>
        <Modal.Actions>
          <Button onClick={this.modalEnterIpClose.bind(this)} inverted>
            <Icon name='cancel' />Cancel
          </Button>
          <Button onClick={this.modalEnterIpClose.bind(this)} inverted>
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
          <Input
            label='Port:'
            value={this.state.port}
            onChange={this.portChange}/>
        </Modal.Description>
        <Modal.Actions>
          <Button onClick={this.modalEnterPortClose.bind(this)} inverted>
            <Icon name='cancel' />Cancel
          </Button>
          <Button onClick={this.modalEnterPortClose.bind(this)} inverted>
            <Icon name='save' />Save
          </Button>
        </Modal.Actions>
      </Modal>
    )
  }

  showMain() {

//    if( !Session.get( 'showMonitor' ) {
    if( !this.state.showMonitor ) {
      return this.renderMenu();
    }
    else {
      return this.renderMonitor();
    }
  }

  tsxStat() {
    // return TheSkyXInfos.findOne({name: tsx_ServerStates.currentStage });
    if( typeof this.props.tsxStatus == 'undefined') {
      return 'idle';
    }
    return this.props.tsxStatus.value;
  }

  render() {
    /* https://react.semantic-ui.com/modules/checkbox#checkbox-example-radio-group
    */
    const { activeItem, ip, port,  } = this.state;

    return (
      <div className="container">
        <header>
          <h1>Image Sessions</h1>
          <div>
            <Segment>
              <Button name='showMonitor' icon='dashboard' onClick={this.handleToggle.bind(this)}/>
              <Button icon='refresh' onClick={this.connectToTSX.bind(this)}/>
              <Button icon='exchange' onClick={this.serverTest.bind(this)}/>
              <Label>TSX ip:
                <Label.Detail onClick={this.modalEnterIpOpen.bind(this)}>
                  {ip}
                </Label.Detail>
              </Label>
               {this.renderIPEditor()}
              <Label>
                TSX port:
                <Label.Detail onClick={this.modalEnterPortOpen.bind(this)}>
                  {port}
                </Label.Detail>
              </Label>
              <Label>Status <Label.Detail>{this.tsxStat()}</Label.Detail></Label>

               {this.renderPortEditor()}
            </Segment>
             { this.showMain() }
          </div>
        </header>
      </div>
    );
  }

  renderTestSegement() {
          return (
            <div>
              Filters found:
              <ul>
                {this.renderFilters()}
              </ul>
              Task:
              <ul>
                {this.renderTasks()}
              </ul>
              <br/>
              <div className="ui relaxed divided list">
                <div className="item">
                  <i className="large github middle aligned icon"></i>
                  <div className="content">
                    <a className="header">Semantic-Org/Semantic-UI</a>
                    <div className="description">Updated 10 mins ago</div>
                  </div>
                </div>
                <div className="item">
                  <i className="large github middle aligned icon"></i>
                  <div className="content">
                    <a className="header">Semantic-Org/Semantic-UI-Docs</a>
                    <div className="description">        <div className="ui indicating progress" data-value="1" data-total="200" id="example1">
                      <div className="bar"></div>
                      <div className="label">Funding</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="item">
                <i className="large github middle aligned icon"></i>
                <div className="content">
                  <a className="header">Semantic-Org/Semantic-UI-Meteor</a>
                  <div className="description">Updated 34 mins ago</div>
                </div>
              </div>
            </div>
            <br/>
            <div className="ui checked checkbox">
              <input type="checkbox" checked="" className="hidden" readOnly="" tabIndex="0" />
              <label>This checkbox comes pre-checked</label>
            </div>
            <div className="ui vertical menu">
              <div className="item">Home</div>
              <div role="listbox" aria-expanded="false" className="ui left pointing dropdown link item" tabIndex="0">
                <div className="text" role="alert" aria-live="polite">Messages</div>
                <i aria-hidden="true" className="dropdown icon"></i>
                <div className="menu transition">
                  <div role="option" className="item">Inbox</div>
                  <div role="option" className="item">Starred</div>
                  <div role="option" className="item">Sent Mail</div>
                  <div role="option" className="item">Drafts (143)</div>
                  <div className="divider">
                  </div>
                  <div role="option" className="item">Spam (1009)</div>
                  <div role="option" className="item">Trash</div>
                </div>
              </div>
              <div className="item">Browse</div>
              <div className="item">Help</div>
            </div>
            <div className="ui fitted toggle checkbox">
              <input type="checkbox" className="hidden" readOnly="" tabIndex="0" />
              <label></label>
            </div>
            <div className="ui radio checkbox">
              <input type="checkbox" className="hidden" readOnly="" tabIndex="0" />
              <label>Radio choice</label>
            </div>
            <div className="ui indicating progress">
              <div className="bar"></div>
              <div className="label">Funding</div>
            </div>
            <div className="ui progress success">
              <div className="bar">
                <div className="progress"></div>
              </div>
              <div className="label">Everything worked, your file is all ready.</div>
            </div>
            <div className="ui progress">
              <div className="bar">
                <div className="progress"></div>
              </div>
              <div className="label">Uploading Files</div>
            </div>
            <form className="ui form">
              <div className="field">Selected value: <b>
              </b>
            </div>
            <div className="field">
              <div className="ui radio checkbox">
                <input type="checkbox" className="hidden" name="checkboxRadioGroup" readOnly="" tabIndex="0" value="this" />
                <label>Choose this</label>
              </div>
            </div>
            <div className="field">
              <div className="ui radio checkbox">
                <input type="checkbox" className="hidden" name="checkboxRadioGroup" readOnly="" tabIndex="0" value="that" />
                <label>Or that</label>
              </div>
            </div>
          </form>
          <table className="ui striped table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Date Joined</th>
                <th>E-mail</th>
                <th>Called</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>John Lilki</td>
                <td>September 14, 2013</td>
                <td>jhlilk22@yahoo.com</td>
                <td>No</td>
              </tr>
              <tr>
                <td>Jamie Harington</td>
                <td>January 11, 2014</td>
                <td>jamieharingonton@yahoo.com</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td>Jill Lewis</td>
                <td>May 11, 2014</td>
                <td>jilsewris22@yahoo.com</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td>John Lilki</td>
                <td>September 14, 2013</td>
                <td>jhlilk22@yahoo.com</td>
                <td>No</td>
              </tr>
              <tr>
                <td>John Lilki</td>
                <td>September 14, 2013</td>
                <td>jhlilk22@yahoo.com</td>
                <td>No</td>
              </tr>
              <tr>
                <td>Jamie Harington</td>
                <td>January 11, 2014</td>
                <td>jamieharingonton@yahoo.com</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td>Jill Lewis</td>
                <td>May 11, 2014</td>
                <td>jilsewris22@yahoo.com</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td>John Lilki</td>
                <td>September 14, 2013</td>
                <td>
                  <div className="ui indicating progress" data-value="1" data-total="200" id="example5">
                  <div className="bar"></div>
                  <div className="label">Funding</div>
                </div>
              </td>
              <td>
                <div className="ui checked checkbox">
                <input type="checkbox" checked="" className="hidden" readOnly="" tabIndex="0" />
                <label>This checkbox comes pre-checked</label>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
      );
    }
  }
  // *******************************
  // THIS IS THE DEFAULT EXPORT AND IS WHERE THE LOADING OF THE COMPONENT STARTS
  // USE THIS POINT TO GRAB THE FILTERS
  export default withTracker(() => {

    return {
      tsxStatus: TheSkyXInfos.findOne({name: 'currentStage' }),
      tsxInfo: TheSkyXInfos.find({}).fetch(),
      tsxIP: TheSkyXInfos.findOne({name: 'ip' }),
      tsxPort: TheSkyXInfos.findOne({name: 'port' }),
      seriess: Seriess.find({}, { sort: { order: 1 } }).fetch(),
      filters: Filters.find({}, { sort: { slot: 1 } }).fetch(),
      takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
      targetSessions: TargetSessions.find({}, { sort: { name: 1 } }).fetch(),
  };
})(App);
/*
<table className="ui selectable celled table">
  <thead>
    <tr>
      <th>Series#</th>
      <th>Frame/Action</th>
      <th>Exposure/Time/Temp</th>
      <th>Binning</th>
      <th>Filter</th>
      <th>Repeat</th>
      <th>Calibration</th>
      <th>Progress</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <div className="ui checked checkbox">
          <input type="checkbox" checked="" className="hidden" readonly="" tabIndex="0" />
          <label>This checkbox comes pre-checked</label>
        </div>
        1
      </td>
      <td>Light</td>
      <td>300</td>
      <td>1x1</td>
      <td>Lum</td>
      <td>33</td>
      <td>None</td>
      <td><Progress percent={0} progress /></td>
    </tr>
    <tr>
      <td>Focus</td>
      <td>Light</td>
      <td>300</td>
      <td>1x1</td>
      <td>Lum</td>
      <td>33</td>
      <td>None</td>
      <td><Progress percent={0} progress /></td>
    </tr>
    <tr>
      <td>Jill</td>
      <td>Light</td>
      <td>300</td>
      <td>1x1</td>
      <td>Lum</td>
      <td>33</td>
      <td>None</td>
      <td><Progress percent={0} progress /></td>
    </tr>
    <tr class="warning">
      <td>John</td>
      <td>Light</td>
      <td>300</td>
      <td>1x1</td>
      <td>Lum</td>
      <td>33</td>
      <td>None</td>
      <td><Progress percent={0} progress /></td>
    </tr>
    <tr>
      <td>Jamie</td>
      <td class="positive">Light</td>
      <td class="warning">300</td>
      <td>1x1</td>
      <td>Lum</td>
      <td>33</td>
      <td>None</td>
      <td><Progress percent={0} progress /></td>
    </tr>
    <tr>
      <td>Jill</td>
      <td class="negative">Light</td>
      <td>300</td>
      <td>1x1</td>
      <td>Lum</td>
      <td>33</td>
      <td>None</td>
      <td><Progress percent={0} progress /></td>
    </tr>
  </tbody>
</table>
*/
