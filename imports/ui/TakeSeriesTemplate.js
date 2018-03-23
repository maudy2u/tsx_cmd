import React, { Component } from 'react';
import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';

import DefineTemplate from './DefineTemplate.js'
import EditorSeriesForm from './EditorSeriesForm.js';
import { Modal, Button, Radio } from 'semantic-ui-react'

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
//     const { open } = this.closeDel
//
//     return (
//       <Modal open={open} onClose={this.close}>
//         <Modal.Header>
//           Delete Account
//         </Modal.Header>
//         <Modal.Content>
//      <p>Are you sure you want to delete your account</p>
//     </Modal.Content>
//     <Modal.Actions>
//      <Button negative>No</Button>
//      <Button positive icon='checkmark' labelPosition='right' content='Yes' onClick={this.confirmedDeleteTemplateSeries(template)}/>
//    </Modal.Actions>
//   </Modal>
// )
  }

  editTemplateSeries() {
    // // Clear form
    // const { open } = this.closeEdit
    // var selTemplate = this.props.takeSeriesTemplates[0];
    // //key={selTemplate._id} template={selTemplate} />
    // if (typeof selTemplate == 'undefined') {
    //   this.addNewTemplate();
    //   selTemplate = this.newTemplate;
    // }
    //   return (
    //     <Modal open={open} onClose={this.close} >
    //       <Modal.Header>Edit Series</Modal.Header>
    //       <Modal.Content>
    //         <Modal.Description>
    //           <EditorSeriesForm key={selTemplate._id} template={selTemplate} />
    //         </Modal.Description>
    //       </Modal.Content>
    //     </Modal>
    //   )
  }

  newTemplate = '';
  addNewTemplate() {
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

  createNewTemplateSeries() {
    const { open } = this.closeAdd

    return (
      <Modal open={open} onClose={this.close} onOpen={this.addNewTemplate()}>
        <Modal.Header>Create Series</Modal.Header>
        <Modal.Content>
          <Modal.Description>
            <EditorSeriesForm key={this.newTemplate._id} template={this.newTemplate} />
          </Modal.Description>
        </Modal.Content>
      </Modal>
    )
  }

//  state = { open: false }
  addTemplate = { open: false }
  editTemplate = { open: false }
  delTemplate = { open: false }

//  show = size => () => this.setState({ size, open: true })
  showAddTemp(){ this.addTemplate= { open: true }}
  showEditTemp(){ this.editTemplate={ open: true }}
  showDelTemp(){ this.delTemplate={ open: true }}

  closeAdd(){ this.addTemplate={ open: false }}
  closeEdit(){ this.editTemplate={ open: false }}
  closeDel(){ this.delTemplate={ open: false }}


  render() {

    // Give tasks a different className when they are checked off,
    // so that we can style them nicely in CSS

//    const filterClassName = this.props.takeSeriesTemplate.checked ? 'checked' : '';
//    const { open, size } = this.state

    return (
      <div>
        <Button.Group>
          <Button circular icon='add' onClick={this.showAddTemp()} />
          <Button circular icon='edit' onClick={this.showEditTemp()} />
          <Button circular icon='delete' onClick={this.showDelTemp()} />
       </Button.Group>
       {this.createNewTemplateSeries()}
       {this.editTemplateSeries()}
       {this.deleteCheckedTemplateSeries()}
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
            {this.props.takeSeriesTemplates.map( (takeSeriesTemplate)=>{
//              return <DefineTemplate key={takeSeriesTemplate._id} seriesTemplate={takeSeriesTemplate} />
            })}
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
