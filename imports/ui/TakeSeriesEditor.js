import React, { Component } from 'react'
import ReactDOM from 'react-dom';
import {mount} from 'react-mounter';

import { withTracker } from 'meteor/react-meteor-data';

import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';

import { Form, Grid, Input, Table, Button, Dropdown, } from 'semantic-ui-react'

var frames = [
  'Light',
  'Flat',
  'Dark',
  'Bias',
];

class TakeSeriesEditor extends Component {

// Setup states
  state = {
    order: 0,
    exposure: 0,
    frame: 'Light',
    filter: 0,
    repeat: 0,
    binning: 0,
    taken: 0,
  };

  handleChange = (e, { name, value }) => this.setState({ [name]: value })

  // change states
  // exposureChange = (e, { value }) => this.setState({ exposure: value });
  // frameChange = (e, { value }) => this.setState({ frame: value });
  // filterChange = (e, { value }) => this.setState({ filter: value });
  // repeatChange = (e, { value }) => this.setState({ repeat: value });
  // binningChange = (e, { value }) => this.setState({ binning: value });
  // takenChange = (e, { value }) => this.setState({ taken: value });

  // Initialize states
  componentWillMount() {
    // // do not modify the state directly
    this.setState({
      order: this.props.definedSeries.order,
      exposure: this.props.definedSeries.exposure,
      frame: this.props.definedSeries.frame,
      filter: this.props.definedSeries.filter,
      repeat: this.props.definedSeries.repeat,
      binning: this.props.definedSeries.binning,
      taken: this.props.definedSeries.taken,
    });
  }

  // *******************************
  // Get the filters from TheSkyX
  renderDropDownFilters() {

    // NEED TO RETRIEVE FROM TSX....
    var filters = [
      'Static LUM',
      'Static R',
      'Static G',
      'Static B',
      'Static Ha',
      'Static OIII',
      'Static SII',
    ];

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
    if( this.props.enableSaving ) {
      var takeSeries = this.props.template;
      var series = takeSeries.series;
      var index = this.props.definedSeries.order;
      if( index > -1 ) {
        // remove the current item
        series.splice(index, 1);
      }

      // renumber...
      for (var i = 0; i < series.length; i++) {
        series[i].order=i;
      }

      TakeSeriesTemplates.update(
        {_id: this.props.template._id}, {
        $set: {
          series: series,
        }
      });
    }
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
            onChange={this.handleChange}
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
      takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
  };
})(TakeSeriesEditor);
