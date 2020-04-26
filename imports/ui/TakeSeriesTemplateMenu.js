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
import { withTracker } from 'meteor/react-meteor-data';
import { Modal, Button, Item, Radio, Icon, Table, Segment, } from 'semantic-ui-react'

import {
  TakeSeriesTemplates,
  addNewTakeSeriesTemplate,
} from '../api/takeSeriesTemplates.js';
import TakeSeries from './TakeSeries.js'

// Filter component - represents a single filter item
class TakeSeriesTemplateMenu extends Component {


  newTemplate = '';

  //{this.testMeteorMethod.bind(this)}
  loadTestDataMeteorMethod() {

    // on the client
    Meteor.call("loadTestDataAllTakeSeriesTemplates", function (error) {
      // identify the error
      if (error && error.error === "logged-out") {
        // show a nice error message
        Session.set("errorMessage", "Please log in to post a comment.");
      }
    }.bind(this));
  }

  chkTestData() {
    var takeSeries = this.props.seriesList;
    console.log('test');
  }

  addNewTakeSeries() {
    var out = addNewTakeSeriesTemplate();
  };

  takeSeriesButtons(
    state
    , active
    ) {

    var DISABLE = true;
    var NOT_DISABLE = false;
    // then use as needed disabled={DISABLE} or disabled={NOT_DISABLE}
    if( state == 'Stop'  && active == false ){
      DISABLE = false;
      NOT_DISABLE = true;
    }
/*
<Button.Group basic size='mini' floated='right'>
  <Button disabled={DISABLE} icon='recycle' />
  <Button disabled={DISABLE} icon='settings' />
</Button.Group>
<Button disabled={DISABLE}  >Refresh</Button>
<Button disabled compact  />
<Button disabled compact   />
<Button disabled={DISABLE} icon='play'  onClick={this.playScheduler.bind(this)}/>
<Button disabled={NOT_DISABLE} icon='stop' onClick={this.stopScheduler.bind(this)} />
*/
    return (
      <Button.Group>
          <Button disabled={DISABLE} icon='plus' onClick={this.addNewTakeSeries.bind(this)} />
       </Button.Group>
     )
  }

  render() {

    var RUNNING = '';
    var ACTIVE = false;
    try {
      RUNNING = this.props.scheduler_running.value;
      ACTIVE = this.props.tool_active.value;
    } catch (e) {
      RUNNING = '';
      ACTIVE=false;
    }

    return (
      <div>
      <h1>TakeSeries Templates</h1>
      {this.takeSeriesButtons(
        RUNNING
        , ACTIVE
      )}
      <br />
       {this.props.seriesList.map( (takeSeriesTemplate)=>{
           return (
             <TakeSeries
              key={takeSeriesTemplate._id}
              seriesTemplate={takeSeriesTemplate}
              scheduler_running={this.props.scheduler_running}
              tool_active={this.props.tool_active}
            />
           )
       })}
     </div>
    )
  }
}
export default withTracker(() => {
    return {
      // takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
  };
})(TakeSeriesTemplateMenu);
