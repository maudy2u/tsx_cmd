import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';

import { Modal, Button, Radio, Icon } from 'semantic-ui-react'

import DefineTemplate from './DefineTemplate.js'
import EditorSeriesForm from './EditorSeriesForm.js';

// Filter component - represents a single filter item
class TakeSeriesTemplate extends Component {


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

  //{this.testMeteorMethod.bind(this)}
  loadTestDataMeteorMethod() {

    // on the client
    Meteor.call("loadTestDataAllTakeSeriesTemplates", function (error) {
      // identify the error
      if (error && error.error === "logged-out") {
        // show a nice error message
        Session.set("errorMessage", "Please log in to post a comment.");
      }
    });
  }

  chkTestData() {
    var takeSeries = this.props.takeSeriesTemplates;
    console.log('test');
  }

  render() {

    var test0 = this.props.takeSeriesTemplates;
    var test1 = this.props.takeSeriesTemplates.series;

    return (
      <div>
        <Button.Group basic size='small'>
          <Button icon='settings' onClick={this.loadTestDataMeteorMethod.bind(this)}/>
          <Button icon='find' onClick={this.chkTestData.bind(this)}/>
          <Button icon='upload' />
        </Button.Group>
        {/* <Button.Group>
          <Button circular icon='add' onClick={this.handleAddOpen.bind(this)} />
          <Button circular icon='edit' onClick={this.handleEditOpen.bind(this)} />
          <Button circular icon='delete' onClick={this.handleDelOpen.bind(this)} />
       </Button.Group> */}
       {/* {this.createNewTemplateSeries()} */}
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
            {this.props.takeSeriesTemplates.map( (takeSeriesTemplate)=>{
              return <DefineTemplate key={takeSeriesTemplate._id} seriesTemplate={takeSeriesTemplate} />
            })}
          </tbody>
        </table>
      </div>
      )
  }
}
export default withTracker(() => {
    return {
      takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
  };
})(TakeSeriesTemplate);

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
