import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import {mount} from 'react-mounter';
import { withTracker } from 'meteor/react-meteor-data';

import { Input, Dropdown, Label, Table, Menu, Segment, Button, Progress, Modal, Form, Radio } from 'semantic-ui-react'

// Import the API Model
import { SessionTemplates } from '../api/sessionTemplates.js';
import { TakeSeriesTemplates} from '../api/takeSeriesTemplates.js';
import { Seriess } from '../api/seriess.js';
import { Filters } from '../api/filters.js';
import { TargetSessions } from '../api/targetSessions.js';
import { TheSkyXInfos } from '../api/theSkyXInfos.js';
// PROBLEM: import { TheSkyXInfos } from '../api/theSkyXInfo.js';

// Import the UI
import TargetSessionMenu from './TargetSessionMenu.js';
import SessionTemplate from './SessionTemplate.js';
import Filter from './Filter.js';
import Series from './Series.js';
import TakeSeriesTemplateMenu from './TakeSeriesTemplateMenu.js';
import TheSkyXInfo from './TheSkyXInfo.js';


// Examples
import Task from './Task.js';
import {tsxCmdTakeImage} from '../tsx/SkyX_JS_TakeImage.js'

// App component - represents the whole app
class App extends Component {

  state = {
    activeItem: 'Targets',
    ip: '',
    port: '',
  }
  handleMenuItemClick = (e, { name }) => this.setState({ activeItem: name })
  ipChange = (e, { value }) => this.setState({ ip: value.trim() });
  portChange = (e, { value }) => this.setState({ port: value.trim() });

  componentWillMount() {
    // do not modify the state directly
    //TheSkyXInfos.findOne({name:'camera'})
    var connection = TheSkyXInfos.findOne({name:'TheSkyX_connection'});
    console.log('End initialization');
    // this.setState({
    //   ip: connection.address,
    //   port: connection.port,
    // });
  }

  // *******************************
  //
  getImageSessions() {
    return [
      { _id: 1, description: 'M1: 33 Lumx300s, 33 Rx300s, 33 Bx300s, 33 Gx300s' },
      { _id: 2, description: 'This is task 2' },
      { _id: 3, description: 'This is task 3' },
    ];
  }

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

    return (
      <Form>
        <Form.Group widths='equal' onSubmit={this.connectTSX.bind(this)}>
          <Form.Field control={Input}
            label='IP Address'
            placeholder="Enter TSX address"
            defaultValue={this.state.ip}
            onChange={this.ipChange}/>
          <Form.Field control={Input}
            label='Port'
            placeholder="Enter TSX port"
            defaultValue={this.state.port}
            onChange={this.portChange}/>
        </Form.Group>
      </Form>
    );
  }

  // *******************************
  //
  connectTSX(event) {

    TheSkyXInfos.insert({
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
  testMeteorMethod() {

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
        <Button.Group labeled icon>
          <Button icon='play'  onClick={this.testTakeImage.bind(this)}/>
          <Button icon='pause'  />
          <Button icon='stop'  />
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

  // *******************************
  //
  renderSettings() {

    var info = this.props.tsxInfo;
    var mount = TheSkyXInfos.findOne({name:'mount'});
    var man = mount.mount.manufacturer;
    var camera = TheSkyXInfos.findOne({name:'camera'});
    var guider = TheSkyXInfos.findOne({name:'guider'});
    var rotator = TheSkyXInfos.findOne({name:'rotator'});
    var efw = TheSkyXInfos.findOne({name:'efw'});
    var focuser = TheSkyXInfos.findOne({name:'focuser'});
    return (
      <div>
        <button className="circular ui icon button" onClick={this.testMeteorMethod.bind(this)}>
          <i class="icon settings"></i>
        </button>
        {this.renderTSXConnetion()}
        <form className="new-filter" onSubmit={this.addNewFilter.bind(this)} >
          <input
            type="text"
            ref="textInput"
            placeholder="Type to add new filter"
          />
        </form>
        <Segment.Group>
          <Segment><Label>Mount<Label.Detail>
            {mount.mount.manufacturer}|{mount.mount.model}
          </Label.Detail></Label></Segment>
          <Segment><Label>Camera<Label.Detail>
            {camera.camera.manufacturer}|{camera.camera.model}
          </Label.Detail></Label></Segment>
          <Segment><Label>Autoguider<Label.Detail>
            {guider.guider.manufacturer}|{guider.guider.model}
          </Label.Detail></Label></Segment>
          <Segment><Label>Filter Wheel<Label.Detail>
            {efw.efw.manufacturer}|{efw.efw.model}
          </Label.Detail></Label></Segment>
          <Segment><Label>Focuser<Label.Detail>
            {focuser.focuser.manufacturer}|{focuser.focuser.model}
          </Label.Detail></Label></Segment>
          <Segment><Label>Rotator<Label.Detail>
            {rotator.rotator.manufacturer}|{rotator.rotator.model}
          </Label.Detail></Label></Segment>
        </Segment.Group>
      </div>
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
    } else if (this.state.activeItem == 'Settings') {
      return this.renderSettings();

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

  connectToTSX() {

    // on the client
    Meteor.call("connectTsx", function (error) {
      // identify the error
      if (error && error.error === "logged-out") {
        // show a nice error message
        Session.set("errorMessage", "Please log in to post a comment.");
      }
    });
  }

  render() {
    /* https://react.semantic-ui.com/modules/checkbox#checkbox-example-radio-group
    */
    //        {this.renderMenuSegments()}
    // var totalPlannedImages = 0;
    // var totalTakenImages = 0;
    // var target = this.props.targetSessions[0];
    // var take = target.takeSeries;
    // var series = take.series[0];
    // for (var i = 0; i < target.length; i++) {
    //   totalTakenImages += target[i].taken;
    //   // totalPlannedImages +=target.[i].repeat;
    // }


    const { activeItem } = this.state

    return (
      <div className="container">
        <header>
          <h1>Image Sessions</h1>
          <div>
            <Button icon='linkify' onClick={this.connectToTSX.bind(this)}/>

{/*
            <button className="circular ui icon button" onClick={this.loadTestDataMeteorMethod.bind(this)}>
              <i class="icon settings"></i>
            </button>
 */}
            {/* <Button primary onClick={this.addNewTemplate()}>Add</Button> */}
            {/* <button onClick={this.addNewTemplate()}>Click me</button> */}
            <Menu pointing secondary>
              <Menu.Item name='Targets' active={activeItem === 'Targets'} onClick={this.handleMenuItemClick} />
              <Menu.Item name='Series' active={activeItem === 'Series'} onClick={this.handleMenuItemClick} />
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
      tsxInfo: TheSkyXInfos.find().fetch(),
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
