import React, { Component } from 'react';
import { Seriess } from '../api/seriess.js';

// Filter component - represents a single filter item
export default class Series extends Component {
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
        <td>{this.props.series.name}</td>
        <td>{this.props.takeSeriesTemplate.details}</td>
      </tr>
    );
  }
}
