import React, { Component } from 'react';
import { Filters } from '../api/filters.js';

// Filter component - represents a single filter item
export default class Filter extends Component {

  toggleChecked() {
    // Set the checked property to the opposite of its current value
    Filters.update(this.props.filter._id, {
      $set: { checked: !this.props.filter.checked },
    });
  }

  deleteThisFilter() {
    Filters.remove(this.props.filter._id);
  }

  sendTSXTest() {

    // on the client
    Meteor.call("tsx_feeder", function (error) {
      // identify the error
      if (error && error.error === "logged-out") {
        // show a nice error message
        Session.set("errorMessage", "Please log in to post a comment.");
      }
    });

    Meteor.call("tsx_mountRaDec", function (error) {
      // identify the error
      if (error && error.error === "logged-out") {
        // show a nice error message
        Session.set("errorMessage", "Please log in to post a comment.");
      }
    });

  }

  render() {

    // Give tasks a different className when they are checked off,
    // so that we can style them nicely in CSS
    const filterClassName = this.props.filter.checked ? 'checked' : '';

    return (
      <li className={filterClassName}>
      <button className="ok" onClick={this.sendTSXTest.bind(this)}>
        &times;
      </button>

        <button className="delete" onClick={this.deleteThisFilter.bind(this)}>
          &times;
        </button>

        <input
          type="checkbox"
          readOnly
          checked={!!this.props.filter.checked}
          onClick={this.toggleChecked.bind(this)}
        />

        <span className="text">{this.props.filter.slot}: {this.props.filter.name}</span>
      </li>
    );
  }
}
