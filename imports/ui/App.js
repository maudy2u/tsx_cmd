import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Session } from 'meteor/session'

// import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';

import { Input, Icon, Dropdown, Label, Table, Menu, Segment, Button, Progress, Modal, Form, Radio } from 'semantic-ui-react'

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
    modalConnectionFailed: false,
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
  modalConnectionFailedOpen = () => this.setState({ modalConnectionFailed: true });
  modalConnectionFailedClose = () => this.setState({ modalConnectionFailed: false });

  componentWillMount() {
    // do not modify the state directly
    // console.log('End initialization');
    console.log('Component mounted');
    if( typeof this.props.tsxPort != 'undefined') {
      this.setState({port: this.props.tsxPort.value});
    }
    if( typeof this.props.tsxPort != 'undefined') {
      this.setState({ip: this.props.tsxIP.value});
    }
  };

  defaultMeridianFlipChange() {
    this.setState({defaultMeridianFlip: !this.state.defaultMeridianFlip});
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
          <Form.Group widths='equal' onSubmit={this.saveTSXServerConnection.bind(this)}>
            <Form.Input
              label='IP Address'
              className='textIP'
              placeholder="Enter TSX address"
              value={this.state.ip}
              onChange={this.ipChange}/>
            <Form.Input
              label='Port'
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

  saveDefaultState( param ) {
    tsx_UpdateServerState(param, eval("this.state."+param));
  }

  saveDefaults(){
    this.saveDefaultState('ip');
    this.saveDefaultState('port');
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
          <Button icon='save' onClick={this.saveDefaults.bind(this)} />
          {/* <Button icon='save' onClick={this.saveTSXServerConnection.bind(this)}> Save Connection </Button>
          {this.renderTSXConnetion()} */}
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

  // *******************************
  //
  renderMenuSegments(){

    if (this.state.activeItem == 'Targets' ) {
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

  connectToTSX() {

    // these are all working methods
    // on the client
    Meteor.call("connectTsx", function (error, result) {
      // identify the error
      if (error && error.reason === "Internal server error") {
        // show a nice error message
        this.setState({modalConnectionFailed: true});

      }
    }.bind(this));

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
            {/* <Menu.Item name='tests' active={activeItem === 'tests'} onClick={this.handleMenuItemClick} /> */}
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
          <Input
            label='Port:'
            value={this.state.port}
            onChange={this.portChange}/>
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

  showMain() {

//    if( !Session.get( 'showMonitor' ) {
    if( !this.state.showMonitor ) {
      return this.renderMenu();
    }
    else {
      return this.renderMonitor();
    }
  }

  getTsxIp() {
    // return TheSkyXInfos.findOne({name: tsx_ServerStates.currentStage });
    if( typeof this.props.tsxIP == 'undefined') {
      return 'Not connected';
    }
    // this.setState({ip: this.props.tsxIP.value}); // fails here.
    return this.props.tsxIP.value;
  }

  getTsxPort() {
    // return TheSkyXInfos.findOne({name: tsx_ServerStates.currentStage });
    if( typeof this.props.tsxPort == 'undefined') {
      return 'Not connected';
    }
    return this.props.tsxPort.value;
  }

  tsxStat() {
    // return TheSkyXInfos.findOne({name: tsx_ServerStates.currentStage });
    if( typeof this.props.tsxStatus == 'undefined') {
      return 'idle';
    }
    return this.props.tsxStatus.value;
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
              <Label onClick={this.modalEnterIpOpen.bind(this)}>TSX ip:
                <Label.Detail>
                  {this.getTsxIp()}
                </Label.Detail>
              </Label>
               {this.renderIPEditor()}
              <Label onClick={this.modalEnterPortOpen.bind(this)}>
                TSX port:
                <Label.Detail>
                  {this.getTsxPort()}
                </Label.Detail>
              </Label>
              <Label>Status <Label.Detail>{this.tsxStat()}</Label.Detail></Label>
              {this.renderPortEditor()}
            </Segment>
            {/* { this.tsxConnectionFailed() } */}
            { this.showMain() }
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
        </header>
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
      tsxIP: TheSkyXInfos.findOne({name: 'ip' }),
      tsxPort: TheSkyXInfos.findOne({name: 'port' }),
      tsxInfo: TheSkyXInfos.find({}).fetch(),
      seriess: Seriess.find({}, { sort: { order: 1 } }).fetch(),
      filters: Filters.find({}, { sort: { slot: 1 } }).fetch(),
      takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
      targetSessions: TargetSessions.find({}, { sort: { name: 1 } }).fetch(),
  };
})(App);
