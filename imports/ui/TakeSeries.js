import React, { Component } from 'react'
import { withTracker } from 'meteor/react-meteor-data';
import { Button, Modal, Item, Header, Icon, Table, } from 'semantic-ui-react'

import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';

import TakeSeriesTemplateEditor from './TakeSeriesTemplateEditor.js';

class TakeSeries extends Component {

  state = { modalOpen: false }
  handleOpen = () => this.setState({ modalOpen: true })
  handleClose = () => this.setState({ modalOpen: false })

  deleteEntry() {
      TakeSeriesTemplates.remove(this.props.seriesTemplate._id);
  }

  editEntry() {
    console.log('In the DefineTemplate editEntry');
    this.handleOpen();
  }

  copyEntry() {
    console.log('In the DefineTemplate editEntry');

    orgSeries = this.props.seriesTemplate;

    // get the id for the new object
    const id = TakeSeriesTemplates.insert(
      {
        name: orgSeries.name + ' Duplicated',
        description: orgSeries.description,
        processSeries: orgSeries.processSeries,
        createdAt: new Date(),
        series: [],
      }
    )

    var series = orgSeries.series;
    for (var i = 0; i < series.length; i++) {
      seriesMap = series[i];
      TakeSeriesTemplates.update({_id: id}, {
        $push: { 'series': seriesMap },
      });
    }
  }

  seriesDetails() {
    var template = this.props.seriesTemplate;
    var seriesArray = template.series;
    var details = "";
    for (var i = 0; i < seriesArray.length; i++) {
      series = seriesArray[i];
      if(details != "") { details += ", "};
      details += series.filter + ':' + series.repeat + 'x' + series.exposure + 's';
    }

    return details
  }

  render() {
//    <input type="checkbox" checked={!!this.props.takeSeriesTemplate.checked} name={this.props.takeSeriesTemplate.name} readOnly="" tabIndex="0" />
    return (
      <Item>
        <Item.Content>
          <Item.Header as='a'>
            {this.props.seriesTemplate.name}
          </Item.Header>
          <Item.Meta>
            {/* <Checkbox
              toggle
              checked={this.state.checked}
              onChange={this.onChangeChecked.bind(this)}
            /> */}
            {this.props.seriesTemplate.description}
          </Item.Meta>
          <Item.Description>
            {this.seriesDetails()}
          </Item.Description>
          <Item.Extra>
            <Button.Group basic size='small'>
              <Button icon='edit' onClick={this.editEntry.bind(this)}/>
              <Button icon='copy' onClick={this.copyEntry.bind(this)}/>
              <Button icon='delete' onClick={this.deleteEntry.bind(this)}/>
            </Button.Group>
            <Modal
              open={this.state.modalOpen}
              onClose={this.handleClose}
              closeIcon>
              <Modal.Header>Edit Series</Modal.Header>
              <Modal.Content>
                <Modal.Description>
                  <TakeSeriesTemplateEditor key={this.props.seriesTemplate._id} template={this.props.seriesTemplate} />
                </Modal.Description>
              </Modal.Content>
            </Modal>
          </Item.Extra>
        </Item.Content>
      </Item>
    )
  }

}

export default withTracker(() => {
    return {
      takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
  };
})(TakeSeries);
