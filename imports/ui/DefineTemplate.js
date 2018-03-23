import React, { Component } from 'react'
import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';

export default class DefineTemplate extends Component {

  render() {
//    <input type="checkbox" checked={!!this.props.takeSeriesTemplate.checked} name={this.props.takeSeriesTemplate.name} readOnly="" tabIndex="0" />
    return (
      <tr>
        <td>
          <div className="ui checked checkbox">
            <input type="checkbox" checked="" name={this.props.takeSeriesTemplate.name} readOnly="" tabIndex="0" />
            <label></label>
          </div>
        </td>
        <td>{this.props.takeSeriesTemplate.name}</td>
        <td>{this.props.takeSeriesTemplate.details}</td>
      </tr>
    )
  }

}
