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
// import {mount} from 'react-mounter';

// used for log files
import { Logger }     from 'meteor/ostrio:logger';
import { LoggerFile } from 'meteor/ostrio:loggerfile';
import { withTracker } from 'meteor/react-meteor-data';

import { TextArea, Form, Input, Icon, Dropdown, Label, Table, Menu, Segment, Button, Progress, Modal, Radio
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
import { FlatSeries } from '../api/flatSeries.js';
import { TheSkyXInfos } from '../api/theSkyXInfos.js';
import { AppLogsDB } from '../api/theLoggers.js'
import { Backups } from '../api/backups.js';

import {
  tsx_ServerStates,
  tsx_UpdateServerState,
  saveDefaultStateValue,
  UpdateStatus,
  // tsx_GetServerState,
} from  '../api/serverStates.js';

import IndividualFile from './FileIndividualFile.js';
const debug = require('debug')('demo:file');
import PropTypes from 'prop-types';

// App component - represents the whole app
class BackupModal extends Component {

  constructor(props) {
    super(props);

    this.state = {

        defaultMeridianFlip: this.props.tsxInfo.find(function(element) {
        return element.name == 'defaultMeridianFlip';}).value,
        defaultCLSEnabled: this.props.tsxInfo.find(function(element) {
        return element.name == 'defaultCLSEnabled';}).value,
        defaultSoftPark: this.props.tsxInfo.find(function(element) {
        return element.name == 'defaultSoftPark';}).value,

        isFOVAngleEnabled: this.props.tsxInfo.find(function(element) {
        return element.name == 'isFOVAngleEnabled';}).value,
        isFocus3Enabled: this.props.tsxInfo.find(function(element) {
        return element.name == 'isFocus3Enabled';}).value,
        isFocus3Binned: this.props.tsxInfo.find(function(element) {
        return element.name == 'isFocus3Binned';}).value,

        isAutoguidingEnabled: this.props.tsxInfo.find(function(element) {
        return element.name == 'isAutoguidingEnabled';}).value,
        isCalibrationEnabled: this.props.tsxInfo.find(function(element) {
        return element.name == 'isCalibrationEnabled';}).value,
        isGuideSettlingEnabled: this.props.tsxInfo.find(function(element) {
        return element.name == 'isGuideSettlingEnabled';}).value,

        isCLSRepeatEnabled: this.props.tsxInfo.find(function(element) {
        return element.name == 'isCLSRepeatEnabled';}).value,
        isTwilightEnabled: this.props.tsxInfo.find(function(element) {
        return element.name == 'isTwilightEnabled';}).value,

    };
    this.removeFile = this.removeFile.bind(this);
    this.renameFile = this.renameFile.bind(this);

  }

  handleToggle = (e, { name, value }) => this.setState({ [name]: Boolean(!eval('this.state.'+name)) })

  handleToggleAndSave = (e, { name, value }) => {
    var val = eval( 'this.state.' + name);

    this.setState({
      [name]: !val
    });
    saveDefaultStateValue( name, !val );
  };


  propTypes: {
    fileName: PropTypes.string.isRequired,
    fileSize: PropTypes.number.isRequired,
    fileUrl: PropTypes.string,
    fileId: PropTypes.string.isRequired
  }

  removeFile(){
    let conf = confirm('Are you sure you want to delete the file?') || false;
    if (conf == true) {
      Meteor.call('RemoveFile', this.props.fileId, function (err, res) {
        if (err)
          console.log(err);
      })
    }
  }

  renameFile(){

    let validName = /[^a-zA-Z0-9 \.:\+()\-_%!&]/gi;
    let prompt    = window.prompt('New file name?', this.props.fileName);

    // Replace any non valid characters, also do this on the server
    if (prompt) {
      prompt = prompt.replace(validName, '-');
      prompt.trim();
    }

    if (!_.isEmpty(prompt)) {
      Meteor.call('RenameFile', this.props.fileId, prompt, function (err, res) {
        if (err)
          console.log(err);
      })
    }
  }

  backupAndDownloadDatabase() {
    Meteor.call('GetBackupOfDatabase', function (err, res) {
      if (err)
        console.log(err);
    })
  }

  databaseButtons( state, active ) {
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
        <Button icon='cloud download' onClick={this.backupAndDownloadDatabase.bind(this)}/>
      </Button.Group>
    )
  }

  displayFiles() {
    console.log("Rendering FileUpload",this.props.docsReadyYet);
    if (this.props.files && this.props.docsReadyYet) {

      let fileCursors = this.props.files;

      // Run through each file that the user has stored
      // (make sure the subscription only sends files owned by this user)
      let display = fileCursors.map((aFile, key) => {
        // console.log('A file: ', aFile.link(), aFile.get('name'))
        let link = Backups.findOne({_id: aFile._id}).link();  //The "view/download" link
        // need to replce the "host" address with the tsxip
//        let tsxIP = TheSkyXInfos.findOne({name: 'ip'}).value;
//        console.log( tsxIP);
//        link.replace('localhost',tsxIP);
//        link.replace('127.0.0.1',tsxIP);
        console.log( link );

        // Send out components that show details of each file
        return <div key={'file' + key}>
          <IndividualFile
            fileName={aFile.name}
            fileUrl={link}
            fileId={aFile._id}
            fileSize={aFile.size}
          />
        </div>
      })
      return display;
    }
    else {
      return <div>Loading file list</div>;
    }
  }

  render() {

    /*
     */
     let STATUS ='';
     try {
       STATUS = this.props.currentStage.value;
     } catch (e) {
       STATUS = 'Initializing';
     }

    return (
      <Segment.Group size='mini'>
        <Segment secondary>{/* use this icon fro the Model settings configure */}
          <Label>Status: <Label.Detail>{STATUS}</Label.Detail></Label>
          <Segment>
            {this.databaseButtons( this.props.scheduler_running, this.props.tool_active ) }
            <br/>
            Do a backup of the database and then download the file to save it...
            <br/>1. send meteor command to backup
            <br/>2. button to download the backup file
            <br/>3. Button to upload and restore database file
          </Segment>
          <Segment>
          {this.displayFiles()}
          </Segment>
        </Segment>
      </Segment.Group>
    );
  }
}
export default withTracker(( props ) => {

  const filesHandle = Meteor.subscribe('files.backups.all');
  const docsReadyYet = filesHandle.ready();
  const files = Backups.find({}, {sort: {name: 1}}).fetch();
  return {
    docsReadyYet,
    files,
  };
})(BackupModal);
