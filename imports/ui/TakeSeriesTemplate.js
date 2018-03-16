import React, { Component } from 'react';
import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';

// Filter component - represents a single filter item
export default class TakeSeriesTemplate extends Component {

  saveTakeSeriesTemplate() {

    // need to get the template details...

  }

  toggleChecked() {
    // Set the checked property to the opposite of its current value
    TakeSeriesTemplates.update(this.props.takeSeriesTemplate._id, {
      $set: { checked: !this.props.takeSeriesTemplate.checked },
    });
  }

  deleteTakeSeriesTemplate() {
    TakeSeriesTemplates.remove(this.props.takeSeriesTemplate._id);
  }

  render() {

    // Give tasks a different className when they are checked off,
    // so that we can style them nicely in CSS
    const filterClassName = this.props.takeSeriesTemplate.checked ? 'checked' : '';

    return (
      <tr>
        <td>
          <div className="ui checked checkbox">
            <input type="checkbox" checked={!!this.props.takeSeriesTemplate.checked} name={this.props.takeSeriesTemplate.name} readOnly="" tabIndex="0" />
            <label></label>
          </div>
        </td>
        <td>{this.props.takeSeriesTemplate.name}</td>
        <td>{this.props.takeSeriesTemplate.details}</td>
      </tr>
    );
  }
}

/*

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
*/
