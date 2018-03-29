import React, { Component } from 'react'
import ReactDOM from 'react-dom';
import { withTracker } from 'meteor/react-meteor-data';

import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';

import { Form, Grid, Input, Table, Button, Dropdown, } from 'semantic-ui-react'

class TakeSeriesEditor extends Component {

  // *******************************
  // Get the filters from TheSkyX
  renderDropDownFilters() {
    return [
      { key: 'l', text: 'Static LUM', value: 'LUM' },
      { key: 'r', text: 'Static R', value: 'R' },
      { key: 'g', text: 'Static B', value: 'G' },
      { key: 'b', text: 'Static G', value: 'B' },

    ];
  }

  // *******************************
  // This is used to populate drop down frame lists
  renderDropDownFrames() {
    return [
      { key: 'l', text: 'Light', value: 'light' },
      { key: 'f', text: 'Flat', value: 'flat' },
      { key: 'd', text: 'Dark', value: 'dark' },
      { key: 'b', text: 'Bias', value: 'bias' },
    ];
  }

  onChangeExposure(event) {
    const name = ReactDOM.findDOMNode(this.refs.exposure).value; //.trim();

    TakeSeriesTemplates.update(this.props.definedSeries._id, {
      $set: {
        exposure: name,
       },
    });

  }
  onChangeFrame(event) {

  }
  onChangeFilter(event) {

  }
  onChangeRepeat(event) {

  }
  onChangeBinning(event) {

  }

  deleteEntry() {
    // get the current map
    var takeSeries = TakeSeriesTemplates.findOne({_id: this.props.template._id});
    var series = takeSeries.series;
    var remove = takeSeries.series.order;
    console.log('Removing order number: ' + remove);
    // all the series
    var cursor = 0;
    var newSeries = [];
    for (var i = 0; i < series.length; i++) {
      // cannot guarantee items are sorted by order
      console.log('Comparing order number ('+series[i].order+') or remove ('+remove+')');
      if( series[i].order < remove ) {
        // do nothing
        newSeries.push(series[i]);
        console.log('No change to order');
      }
      else if (series[i].order >= remove ) {
        var newOrder = series[i].order-1;
        if( newOrder >= 0) {
          console.log('Order decreased by one');
          series[i].order = series[i].order-1;
          newSeries.push(series[i]);
        }
      }
      else {
        // for order = remove... do nothing - do not add to newSeries
        console.log('Order matches so ignore');
      }
    }
    // update
    TakeSeriesTemplates.update({_id: this.props.template._id}, {
      $set: { 'series': newSeries },
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
            className='exposure'
            defaultValue={this.props.definedSeries.exposure}
            onChange={this.onChangeExposure.bind(this)}
          />
        </Grid.Column>
        <Grid.Column>
          <Dropdown
            fluid
            className='Frame'
            options={this.renderDropDownFrames()}
            placeholder='Light'
          />
        </Grid.Column>
        <Grid.Column>
          <Dropdown
              fluid
              className='filter'
              options={this.renderDropDownFilters()}
              placeholder='Filter'
            />
          </Grid.Column>
          <Grid.Column>
          <Input
            fluid
            placeholder='Repeat'
            className='repeat'
            defaultValue={this.props.definedSeries.repeat}
          />
        </Grid.Column>
        <Grid.Column>
          <Input
            fluid
            placeholder='Binning'
            className='binning'
            defaultValue={this.props.definedSeries.binning}
          />
        </Grid.Column>
        <Grid.Column>
          <b><label>{this.props.definedSeries.order}</label></b>
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
