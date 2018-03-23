import React, { Component } from 'react';
import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';

import DefineTemplate from './DefineTemplate.js'
import EditorSeriesForm from './EditorSeriesForm.js';
import { Modal, Button, Radio, Icon } from 'semantic-ui-react'

// Filter component - represents a single filter item
export default class TakeSeriesTemplate extends Component {

  toggleChecked() {
    // Set the checked property to the opposite of its current value
    TakeSeriesTemplates.update(this.props.takeSeriesTemplate._id, {
      $set: { checked: !this.props.takeSeriesTemplate.checked },
    });
  }

  confirmedDeleteTemplateSeries(template) {
    TakeSeriesTemplates.remove(template._id);
  }
  deleteCheckedTemplateSeries() {

    return (
      <Modal
        open={this.state.modalDelOpen}
        onClose={this.handleDelClose}
        closeIcon>
        <Modal.Header>
          Delete Template
        </Modal.Header>
        <Modal.Content>
     <p>Are you sure you want to delete this template</p>
    </Modal.Content>
    <Modal.Actions>
     <Button negative>No</Button>
     <Button positive icon='checkmark' labelPosition='right' content='Yes' />
     {/* onClick={this.confirmedDeleteTemplateSeries(template)} */}
   </Modal.Actions>
  </Modal>
)
  }

  editTemplateSeries() {
    // Clear form
    var selTemplate = this.props.takeSeriesTemplates[0];
    //key={selTemplate._id} template={selTemplate} />
    if (typeof selTemplate == 'undefined') {
      this.addNewTemplate();
      selTemplate = this.newTemplate;
    }
      return (
        <Modal
          open={this.state.modalEditOpen}
          onClose={this.handleEditClose}
          closeIcon>
          <Modal.Header>Edit Series</Modal.Header>
          <Modal.Content>
            <Modal.Description>
              <EditorSeriesForm key={selTemplate._id} template={selTemplate} />
            </Modal.Description>
          </Modal.Content>
          <Modal.Actions>
            <Button circular icon='save'  onClick={this.handleEditClose} inverted/>
            <Button circular icon='cancel'  onClick={this.handleEditClose} inverted/>
          </Modal.Actions>
        </Modal>
      )
  }

  newTemplate = '';
  addNewTemplate() {
    if( this.state.modalAddOpen == true ) {
      this.newTemplate = TakeSeriesTemplates.insert({
        name: "",
        processSeries: "across series",
        series: {
          order: 0,
          checked: false,
          series: [
            { order: 'Order', value: 0 },
            { exposure: 'Exposure', value: 1 },
            { binning: 'Binning', value: 1 },
            { frame: 'Frame', value: 'Light' },
            { filter: 'LUM', value: 0 },
            { repeat: 'Repeat', value: 1 },
          ],
        },
        createdAt: new Date(), // current time
      })
    }
  }

  createNewTemplateSeries() {
//    const { open } = this.addTemplate
//            <EditorSeriesForm key={this.newTemplate._id} template={this.newTemplate} />
//onOpen={this.addNewTemplate()}>
    return (
      <Modal
        open={this.state.modalAddOpen}
        onClose={this.handleAddClose}
        closeIcon>
        <Modal.Header>Create Series</Modal.Header>
        <Button.Group>
          {/* <Button circular icon='save'  onClick={this.handleAddClose} />
          <Button circular icon='cancel'  onClick={this.handleAddClose}/> */}
          <Button circular icon='add' onClick={this.addNewTemplate()} />
          {/* <Button circular icon='edit' onClick={this.handleAddClose} />
          <Button circular icon='delete' onClick={this.handleAddClose} /> */}
       </Button.Group>
        <Modal.Content>
          <Modal.Description>
            hello
          </Modal.Description>
        </Modal.Content>
      </Modal>
    )
  }

  state = { modalAddOpen: false, modalEditOpen: false, modalDelOpen: false, }
  handleAddOpen = () => this.setState({ modalAddOpen: true })
  handleAddClose = () => this.setState({ modalAddOpen: false })
  handleEditOpen = () => this.setState({ modalEditOpen: true })
  handleEditClose = () => this.setState({ modalEditOpen: false })
  handleDelOpen = () => this.setState({ modalDelOpen: true })
  handleDelClose = () => this.setState({ modalDelOpen: false })


  render() {
    return (
      <div>
        <Button.Group>
          <Button circular icon='add' onClick={this.handleAddOpen} />
          <Button circular icon='edit' onClick={this.handleEditOpen} />
          <Button circular icon='delete' onClick={this.handleDelOpen} />
       </Button.Group>
       {this.createNewTemplateSeries()}
       {/* {this.editTemplateSeries()}
       {this.deleteCheckedTemplateSeries()} */}
        <table className="ui selectable celled table">
          <thead>
            <tr>
              <th>#</th>
              <th>Take Series Name</th>
              <th>Details</th>
              <th>DeleteX</th>
            </tr>
          </thead>
          <tbody>
            {/* {TakeSeriesTemplates.map( (takeSeriesTemplate)=>{
              return <DefineTemplate key={takeSeriesTemplate._id} seriesTemplate={takeSeriesTemplate} />
            })} */}
          </tbody>
        </table>
      </div>
      )
  }
}

/*

sendTSXTest() {

  // on the client
  Meteor.call("tsx_feeder", function (error) {
    // identify the error
    if (error && error.error === "logged-out") {
      // show a nice error message
      Session.set("errorMessage", "Please log in to post a comment.");
    }
  });

  Meteor.call("tsx_mountRaDec", function (error) {
    // identify the error
    if (error && error.error === "logged-out") {
      // show a nice error message
      Session.set("errorMessage", "Please log in to post a comment.");
    }
  });

}




      <li className={filterClassName}>
      <button className="ok" onClick={this.sendTSXTest.bind(this)}>
        &times;
      </button>

        <button className="delete" onClick={this.deleteThisFilter.bind(this)}>
          &times;
        </button>

        <input
          type="checkbox"
          readOnly
          checked={!!this.props.filter.checked}
          onClick={this.toggleChecked.bind(this)}
        />

        <span className="text">{this.props.filter.slot}: {this.props.filter.name}</span>
      </li>
    );
  }
}
*/
