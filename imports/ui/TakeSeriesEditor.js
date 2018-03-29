import React, { Component } from 'react'
import ReactDOM from 'react-dom';
import {mount} from 'react-mounter';

import { withTracker } from 'meteor/react-meteor-data';

import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';

import { Form, Grid, Input, Table, Button, Dropdown, } from 'semantic-ui-react'

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

  // change states
  exposureChange = (e, { value }) => this.setState({ exposure: value });
  frameChange = (e, { value }) => this.setState({ frame: value });
  filterChange = (e, { value }) => this.setState({ filter: value });
  repeatChange = (e, { value }) => this.setState({ repeat: value });
  binningChange = (e, { value }) => this.setState({ binning: value });
  takenChange = (e, { value }) => this.setState({ taken: value });

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
    return [
      { key: 0, text: 'Static LUM', value: 0 },
      { key: 1, text: 'Static R', value: 1 },
      { key: 2, text: 'Static B', value: 2 },
      { key: 3, text: 'Static G', value: 3 },

    ];
  }

  // *******************************
  // This is used to populate drop down frame lists
  renderDropDownFrames() {
    return [
      { key: 0, text: 'Light', value: 0 },
      { key: 1, text: 'Flat', value: 1 },
      { key: 2, text: 'Dark', value: 2 },
      { key: 3, text: 'Bias', value: 3 },
    ];
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
            className='exposure'
            defaultValue={this.state.exposure}
            onChange={this.exposureChange}
          />
        </Grid.Column>
        <Grid.Column>
          <Dropdown
            fluid
            className='Frame'
            selection={this.state.frame}
            options={this.renderDropDownFrames()}
            placeholder='Light'
            onChange={this.frameChange}
          />
        </Grid.Column>
        <Grid.Column>
          <Dropdown
              fluid
              className='filter'
              selection={this.state.filter}
              options={this.renderDropDownFilters()}
              placeholder='Filter'
              onChange={this.filterChange}
            />
          </Grid.Column>
          <Grid.Column>
          <Input
            fluid
            placeholder='Repeat'
            className='repeat'
            defaultValue={this.state.repeat}
            onChange={this.repeatChange}
          />
        </Grid.Column>
        <Grid.Column>
          <Input
            fluid
            placeholder='Binning'
            className='binning'
            defaultValue={this.state.binning}
            onChange={this.binningChange}
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
