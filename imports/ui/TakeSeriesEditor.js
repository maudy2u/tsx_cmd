import React, { Component } from 'react'
import ReactDOM from 'react-dom';
// import {mount} from 'react-mounter';

import { withTracker } from 'meteor/react-meteor-data';

import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';
import { Seriess } from '../api/seriess.js';

import { Form, Grid, Input, Table, Button, Dropdown, } from 'semantic-ui-react'

var frames = [
  'Light',
  'Flat',
  'Dark',
  'Bias',
];

var filters = [
  'Static LUM',
  'Static R',
  'Static G',
  'Static B',
  'Static Ha',
  'Static OIII',
  'Static SII',
];

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
    // Seriess.update( {id: this.props.series_id}, {
    //   $set:{
    //     order: this.state.order,
    //     exposure: this.state.exposure,
    //     frame: this.state.frame,
    //     filter: this.state.filter,
    //     repeat: this.state.repeat,
    //     binning: this.state.binning,
    //     taken: this.state.taken,
    //   }
    // });
    Meteor.call( 
      'updateSeriesIdWith',
      this.props.series_id ,
      this.state.order,
      this.state.exposure,
      this.state.frame,
      this.state.filter,
      this.state.repeat,
      this.state.binning,
      this.state.taken,
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

    // NEED TO RETRIEVE FROM TSX....
    var filterArray = [];
    for (var i = 0; i < filters.length; i++) {
      filterArray.push({ key: filters[i], text: filters[i], value: filters[i] });
    }
    return filterArray;
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
      // filters: Filters.find({}, { sort: { slot: 1 } }).fetch(),
      takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
      // targetSessions: TargetSessions.find({}, { sort: { name: 1 } }).fetch(),
  };
})(TakeSeriesEditor);
