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
    frame: 'Light',
    filter: 0,
    repeat: 0,
    binning: 0,
    taken: 0,
  };

  handleChange = (e, { name, value }) => this.setState({ [name]: value });

  // change states
  exposureChange = (e, { value }) => {
    this.setState({ exposure: value });
    this.props.definedSeries.exposure = value;

// can the tempalte edirot that callss this use tracter properties and so
// that this issue of changes and savins goes away...


  };
  // frameChange = (e, { value }) => this.setState({ frame: value });
  // filterChange = (e, { value }) => this.setState({ filter: value });
  // repeatChange = (e, { value }) => this.setState({ repeat: value });
  // binningChange = (e, { value }) => this.setState({ binning: value });
  // takenChange = (e, { value }) => this.setState({ taken: value });

  // Initialize states
  componentWillMount() {
    var definedSeries = Seriess.findOne({_id:this.props.key}).fetch();
    // // do not modify the state directly
    this.setState({
      id: this.props.key,
      order: definedSeries.order,
      exposure: definedSeries.exposure,
      frame: { text: definedSeries.frame},
      filter: { text: definedSeries.filter},
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
      filterArray.push({ key: i, text: filters[i], value: filters[i] });
    }
    return filterArray;
  }

  // *******************************
  // This is used to populate drop down frame lists
  renderDropDownFrames() {

    var frameArray = [];
    for (var i = 0; i < frames.length; i++) {
      frameArray.push({ key: i, text: frames[i], value: frames[i] });
    }
    return frameArray;
  }


  deleteEntry() {

    // Recreate the series with ID removed
    // then delete the entry
    var takeSeries = this.props.template;
    var seriesDb = takeSeries.series;
    var series = [];
    for (var i = 0; i < seriesDb.length; i++) {
      if( seriesDb._id != removeID ) {
        var tmp = Seriess.findOne({_id:seriesDb[i].id}).fetch();
        series.push(tmp._id);
      }
    }

    // Now remove form Seriess
    var removeID = this.state.id;
    Seriess.remove({_id:this.state.id});

    // now reset the series Map
    TakeSeriesTemplates.update(
      {_id: this.props.template._id}, {
      $set: {
        series: series,
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
            defaultValue={this.state.exposure}
            onChange={this.exposureChange}
          />
        </Grid.Column>
        <Grid.Column>
          <Dropdown
            fluid
            name='frame'
            options={this.renderDropDownFrames()}
            placeholder='Light'
            text={this.state.frame.text}
            onChange={this.handleChange}
          />
        </Grid.Column>
        <Grid.Column>
          <Dropdown
              fluid
              name='filter'
              options={this.renderDropDownFilters()}
              placeholder='Filter'
              text={this.state.filter.text}
              onChange={this.handleChange}
            />
          </Grid.Column>
          <Grid.Column>
          <Input
            fluid
            placeholder='Repeat'
            name='repeat'
            defaultValue={this.state.repeat}
            onChange={this.handleChange}
          />
        </Grid.Column>
        <Grid.Column>
          <Input
            fluid
            placeholder='Binning'
            name='binning'
            defaultValue={this.state.binning}
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
      // takeSeriesTemplates: TakeSeriesTemplates.find({_id:seriesTemplate._id}, { sort: { name: 1 } }).fetch(),
  };
})(TakeSeriesEditor);
