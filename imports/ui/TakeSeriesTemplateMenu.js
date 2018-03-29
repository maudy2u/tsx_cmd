import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';

import { Modal, Button, Item, Radio, Icon, Table, } from 'semantic-ui-react'

import TakeSeries from './TakeSeries.js'

// Filter component - represents a single filter item
class TakeSeriesTemplateMenu extends Component {


  newTemplate = '';
  addNewTemplate() {
    const id = TakeSeriesTemplates.insert(
      {
        name: "New Take Series",
        description: "EDIT ME",
        processSeries: 'across series',
        createdAt: new Date(),
        series: [],
      }
    )
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
          <Button icon='add' onClick={this.addNewTemplate.bind(this)}/>
          <Button icon='upload' />
        </Button.Group>
        <Button.Group basic size='small'>
          <Button icon='settings' onClick={this.loadTestDataMeteorMethod.bind(this)}/>
          <Button icon='find' onClick={this.chkTestData.bind(this)}/>
        </Button.Group>
        {/* <Button.Group>
          <Button circular icon='add' onClick={this.handleAddOpen.bind(this)} />
          <Button circular icon='edit' onClick={this.handleEditOpen.bind(this)} />
          <Button circular icon='delete' onClick={this.handleDelOpen.bind(this)} />
       </Button.Group> */}
       {/* {this.createNewTemplateSeries()} */}
       {/* {this.editTemplateSeries()}
       {this.deleteCheckedTemplateSeries()} */}
       <Item.Group divided>
         {this.props.takeSeriesTemplates.map( (takeSeriesTemplate)=>{
           return <TakeSeries key={takeSeriesTemplate._id} seriesTemplate={takeSeriesTemplate} />
         })}
       </Item.Group>
      </div>
      )
  }
}
export default withTracker(() => {
    return {
      takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
  };
})(TakeSeriesTemplateMenu);

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
