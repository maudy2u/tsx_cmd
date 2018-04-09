import React, { Component } from 'react'
import ReactDOM from 'react-dom';
// import {mount} from 'react-mounter';

import { withTracker } from 'meteor/react-meteor-data';

import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';
import { Seriess } from '../api/seriess.js';
import { Filters } from '../api/filters.js';

import { Form, Grid, Input, Table, Button, Dropdown, } from 'semantic-ui-react'

var frames = [
  'Light',
  'Flat',
  'Dark',
  'Bias',
];

// var filters = [
//   'Static LUM',
//   'Static R',
//   'Static G',
//   'Static B',
//   'Static Ha',
//   'Static OIII',
//   'Static SII',
// ];

class TakeSeriesEditor extends Component {

// Setup states
  state = {
    id: '',
    order: 0,
    exposure: 0,
    frame: 'Frame',
    filter: 'Filter',
    repeat: 0,
    binning: 0,
    taken: 0,
  };

  // // change states
  handleChange = (e, { name, value }) => {

    this.setState({ [name]: value });

    var id = this.props.series_id.id;
    Meteor.call(
      'updateSeriesIdWith',
      id ,
      name,
      value,
      function (error) {
        // identify the error
        if (error && error.error === "logged-out") {
          // show a nice error message
          Session.set("errorMessage", "Please log edit.");
        }
    });
  };

  // Initialize states
  componentWillMount() {
    var definedSeries = Seriess.findOne({_id:this.props.series_id.id});
    // // do not modify the state directly
    if( typeof definedSeries == 'undefined') {
      return;
    }
    this.setState({
      id: this.props.series_id,
      order: definedSeries.order,
      exposure: definedSeries.exposure,
      frame: definedSeries.frame,
      filter: definedSeries.filter,
      repeat: definedSeries.repeat,
      binning: definedSeries.binning,
      taken: definedSeries.taken,
    });
  }

  // *******************************
  // Get the filters from TheSkyX
  renderDropDownFilters() {

    var filterArray = [];
    for (var i = 0; i < this.props.filters.length; i++) {
      filterArray.push({
        key: this.props.filters[i]._id,
        text: this.props.filters[i].name,
        value: this.props.filters[i].name });
    }
    return filterArray;
    // return Filters.find().renderDropDownFilters();
  }

  // *******************************
  // This is used to populate drop down frame lists
  renderDropDownFrames() {

    var frameArray = [];
    for (var i = 0; i < frames.length; i++) {
      frameArray.push({ key: frames[i], text: frames[i], value: frames[i] });
    }
    return frameArray;
  }

  deleteEntry() {

    // Get remove form Seriess
    var removeID = this.props.series_id.id;
    var removedSeries = Seriess.findOne({_id:removeID})
    if( typeof removedSeries == 'undefined') {
      return;
    }

    // Recreate the series with ID removed
    // then delete the entry
    var takeSeries = this.props.template;
    var seriesDb = takeSeries.series;
    var newSeries = [];
    for (var i = 0; i < seriesDb.length; i++) {
      if( seriesDb[i].id != removeID ) {
        var tmp = Seriess.findOne({_id:seriesDb[i].id});
        if( typeof tmp == 'undefined') {
          continue;
        }
        // redo order
        if( tmp.order > removedSeries.order ) {
          tmp.order = tmp.order-1;
          Seriess.update( {_id:tmp._id},{
            $set:{ order: tmp.order}
          });
        }
        newSeries.push({id:tmp._id});
      }
    }

    Seriess.remove({_id:removeID});

    // now reset the series Map
    TakeSeriesTemplates.update(
      {_id: this.props.template._id}, {
      $set: {
        series: newSeries,
      }
    });
  }

  moveUpEntry() {

    var seriesID = this.props.series_id;
    var seriesInit = Seriess.findOne({_id: seriesID.id});
    var initOrder = seriesInit.order; // current order position
    var newOrder = initOrder - 1; // negative goes up to zero
    var seriesIds = this.props.template.series;
    for (var i = 0; i < seriesIds.length; i++) {
      var curSeries = Seriess.findOne({_id: seriesIds[i].id});
      if( curSeries._id != seriesInit._id ) {
        if( curSeries.order == newOrder ) {
          Seriess.update( {_id:curSeries._id}, {
            $set: {
              order: initOrder,
            }
          });
          // TakeSeriesTemplate.update({_id})
          Seriess.update( {_id:seriesID.id}, {
            $set: {
              order: newOrder,
            }
          });
        }
      }
    }
  }
  moveDownEntry() {
  }

  render() {

    return (
      <Grid.Row>
        <Grid.Column>
          <Input
            fluid
            placeholder='Exposure'
            name='exposure'
            value={this.state.exposure}
            onChange={this.handleChange}
          />
        </Grid.Column>
        <Grid.Column>
          <Dropdown
            fluid
            name='frame'
            options={this.renderDropDownFrames()}
            placeholder='Frame'
            text={this.state.frame}
            onChange={this.handleChange}
          />
        </Grid.Column>
        <Grid.Column>
          <Dropdown
              fluid
              name='filter'
              options={this.renderDropDownFilters()}
              placeholder='Filter'
              text={this.state.filter}
              onChange={this.handleChange}
            />
          </Grid.Column>
          <Grid.Column>
          <Input
            fluid
            placeholder='Repeat'
            name='repeat'
            value={this.state.repeat}
            onChange={this.handleChange}
          />
        </Grid.Column>
        <Grid.Column>
          <Input
            fluid
            placeholder='Binning'
            name='binning'
            value={this.state.binning}
            onChange={this.handleChange}
          />
        </Grid.Column>
        <Grid.Column>
          <b><label>{this.state.order}</label></b>
          <Button size='mini' icon='delete'  onClick={this.deleteEntry.bind(this)}/>
          <Button size='mini' icon='arrow up'  onClick={this.moveUpEntry.bind(this)}/>
          <Button size='mini' icon='arrow down'  onClick={this.moveDownEntry.bind(this)}/>
        </Grid.Column>
      </Grid.Row>
    )
  }

}
export default withTracker(() => {
    return {
      // tsxInfo: TheSkyXInfos.find().fetch(),
      seriess: Seriess.find({}, { sort: { order: 1 } }).fetch(),
      filters: Filters.find({}, { sort: { order: 1 } }).fetch(),
      takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
      // targetSessions: TargetSessions.find({}, { sort: { name: 1 } }).fetch(),
  };
})(TakeSeriesEditor);
