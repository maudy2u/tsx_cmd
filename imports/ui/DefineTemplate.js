import React, { Component } from 'react'
import { withTracker } from 'meteor/react-meteor-data';
import { Button, Modal, Header, Icon, } from 'semantic-ui-react'

import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';

import EditorSeriesForm from './EditorSeriesForm.js';

class DefineTemplate extends Component {

  deleteEntry() {
      TakeSeriesTemplates.remove(this.props.seriesTemplate._id);
  }

  state = { modalOpen: false }
  handleOpen = () => this.setState({ modalOpen: true })
  handleClose = () => this.setState({ modalOpen: false })

  editEntry() {
    console.log('In the DefineTemplate editEntry');
    this.handleOpen();
  }

  render() {
//    <input type="checkbox" checked={!!this.props.takeSeriesTemplate.checked} name={this.props.takeSeriesTemplate.name} readOnly="" tabIndex="0" />
    return (
      <tr>
        <td>
          <div className="ui checked checkbox">
            <input type="checkbox" checked="" name={this.props.seriesTemplate.name} readOnly="" tabIndex="0" />
            <label></label>
          </div>
        </td>
        <td>{this.props.seriesTemplate.name}</td>
        <td>{this.props.seriesTemplate.description}</td>
        <td>
          <Button.Group basic size='small'>
            <Button icon='delete' onClick={this.deleteEntry.bind(this)}/>
            <Button icon='edit' onClick={this.editEntry.bind(this)}/>
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
                <EditorSeriesForm key={this.props.seriesTemplate._id} template={this.props.seriesTemplate} />
              </Modal.Description>
            </Modal.Content>
          </Modal>
        </td>
      </tr>
    )
  }

}

export default withTracker(() => {
    return {
      takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
  };
})(DefineTemplate);
