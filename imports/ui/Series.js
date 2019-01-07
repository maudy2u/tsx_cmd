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
