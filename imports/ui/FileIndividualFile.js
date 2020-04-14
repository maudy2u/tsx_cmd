import React, { Component } from 'react';
import PropTypes from 'prop-types';

// client ref: https://github.com/VeliovGroup/Meteor-Files/blob/master/docs/react-example.md

class IndividualFile extends Component {
  constructor(props) {
    super(props);

    this.state = {
    };

    this.removeFile = this.removeFile.bind(this);
    this.renameFile = this.renameFile.bind(this);
    this.restoreFile = this.restoreFile.bind(this);

  }

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

  restoreFile() {
    let conf = confirm('Are you sure you want to restore this file?') || false;
    if (conf == true) {
      Meteor.call('RestoreFile', this.props.fileId, function (err, res) {
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

    if (prompt != '' && prompt != 'undefined' ) {
      Meteor.call('RenameFile', this.props.fileId, prompt, function (err, res) {
        if (err)
          console.log(err);
      })
    }
  }

  render() {
    return <div className="m-t-sm">
          <strong>{this.props.fileName}</strong>
          <button onClick={this.renameFile} className="btn btn-outline btn-primary btn-sm">
            Rename
          </button>
          <a href={this.props.fileUrl} className="btn btn-outline btn-primary btn-sm"
             target="_blank">Download</a>
          <button onClick={this.removeFile} className="btn btn-outline btn-danger btn-sm">
            Delete
          </button>
          <button onClick={this.restoreFile} className="btn btn-outline btn-danger btn-sm">
            Restore
          </button>
          Size: {this.props.fileSize}
          <br/><hr/>
    </div>
  }
}
export default IndividualFile;
