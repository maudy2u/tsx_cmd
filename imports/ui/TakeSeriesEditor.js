import React, { Component } from 'react'
import ReactDOM from 'react-dom';
import { withTracker } from 'meteor/react-meteor-data';

import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';

import { Form, Table, Button,} from 'semantic-ui-react'

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
      TakeSeriesTemplates.remove(this.props.targetSession._id);
  }



  render() {
    return (
      <Table.Row>
        <Table.Cell>
          <Form.Input
            fluid
            ref="exposure"
            placeholder='Exposure'
            name='exposure'
            defaultValue={this.props.definedSeries.exposure}
            onChange={this.onChangeExposure.bind(this)}
          />
        </Table.Cell>
        <Table.Cell>
          <Form.Select fluid ref="frame" name='Frame' options={this.renderDropDownFrames()} placeholder='Light' />
        </Table.Cell>
        <Table.Cell>
          <Form.Select fluid ref="filter" name='Filter' options={this.renderDropDownFilters()} placeholder='Filter' />
        </Table.Cell>
        <Table.Cell>
          <Form.Input fluid ref="repeat" placeholder='Repeat' name='repeat' defaultValue={this.props.definedSeries.repeat}  />
        </Table.Cell>
        <Table.Cell>
          <Form.Input fluid ref="binning" placeholder='Binning' name='binning' defaultValue={this.props.definedSeries.binning}  />
        </Table.Cell>
        <Table.Cell>
          <Button size='mini' icon='delete'  />
        </Table.Cell>
      </Table.Row>
    )
  }

}
export default withTracker(() => {
    return {
      takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
  };
})(TakeSeriesEditor);
