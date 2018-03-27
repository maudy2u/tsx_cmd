import React, { Component } from 'react'
import { withTracker } from 'meteor/react-meteor-data';
import { Button, Modal, Header, Icon, Table, } from 'semantic-ui-react'

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

  render() {
//    <input type="checkbox" checked={!!this.props.takeSeriesTemplate.checked} name={this.props.takeSeriesTemplate.name} readOnly="" tabIndex="0" />
    return (
      <Table.Row>
        <Table.Cell>
          {this.props.seriesTemplate.name}
        </Table.Cell>
        <Table.Cell>
          {this.props.seriesTemplate.description}
        </Table.Cell>
        <Table.Cell>
          <Button.Group basic size='small'>
            <Button icon='edit' onClick={this.editEntry.bind(this)}/>
            <Button icon='copy' />            
            <Button icon='delete' onClick={this.deleteEntry.bind(this)}/>
          </Button.Group>
          <Modal
            open={this.state.modalOpen}
            onClose={this.handleClose}
            closeIcon>
            <Modal.Header>Edit Series</Modal.Header>
            <Button.Group>
              {/* <Button circular icon='save'  onClick={this.handleAddClose} />
              <Button circular icon='cancel'  onClick={this.handleAddClose}/> */}
              <Button circular icon='add' />
              {/* <Button circular icon='edit' onClick={this.handleAddClose} />
              <Button circular icon='delete' onClick={this.handleAddClose} /> */}
           </Button.Group>
            <Modal.Content>
              <Modal.Description>
                <TakeSeriesTemplateEditor key={this.props.seriesTemplate._id} template={this.props.seriesTemplate} />
              </Modal.Description>
            </Modal.Content>
          </Modal>
        </Table.Cell>
      </Table.Row>
    )
  }

}

export default withTracker(() => {
    return {
      takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
  };
})(TakeSeries);
