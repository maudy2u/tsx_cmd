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
import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';

import { Modal, Button, Item, Radio, Icon, Table, Segment, } from 'semantic-ui-react'

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

  render() {

    var test0 = this.props.seriesList;
//    var test1 = this.props.seriesList.series;

    return (
      <div>
        <Segment>
         <Item.Group divided unstackable>
           {this.props.seriesList.map( (takeSeriesTemplate)=>{
             return <TakeSeries key={takeSeriesTemplate._id} seriesTemplate={takeSeriesTemplate} />
           })}
         </Item.Group>
        </Segment>
       </div>
      )
  }
}
export default withTracker(() => {
    return {
      // takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
  };
})(TakeSeriesTemplateMenu);
