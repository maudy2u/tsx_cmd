import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { withTracker } from 'meteor/react-meteor-data';

// Import the API Model
import { SessionTemplates } from '../api/sessionTemplates.js';
import { Filters } from '../api/filters.js';
import { ImageSessions } from '../api/imageSessions.js';
import { TheSkyXInfos } from '../api/theSkyXInfos.js';
// PROBLEM: import { TheSkyXInfos } from '../api/theSkyXInfo.js';

// Import the UI
import ImageSession from './ImageSession.js';
import SessionTemplate from './SessionTemplate.js';
import Filter from './Filter.js';
import TheSkyXInfo from './TheSkyXInfo.js';


import Task from './Task.js';

// Template.myDropdown.rendered = function() {
//   // be sure to use this.$ so it is scoped to the template instead of to the window
//   this.$('.ui.dropdown').dropdown({on: 'hover'});
//   // other SUI modules initialization
// };

// App component - represents the whole app
class App extends Component {

  getImageSessions() {
    return [
      { _id: 1, description: 'M1: 33 Lumx300s, 33 Rx300s, 33 Bx300s, 33 Gx300s' },
      { _id: 2, description: 'This is task 2' },
      { _id: 3, description: 'This is task 3' },
    ];
  }

  // Default creation of sessions using above method
  renderImageSessions() {
    return this.getImageSessions().map((imageSession) => (
      <ImageSession key={imageSession._id} imageSession={imageSession} />
    ));
  }

  addNewFilter(event) {
    // Find the text field via the React ref
    const text = ReactDOM.findDOMNode(this.refs.textInput).value.trim();

    Filters.insert({
      name: text,
      createdAt: new Date(), // current time
      offset: 0,
    });
    // Clear form
    ReactDOM.findDOMNode(this.refs.textInput).value = '';
  }

  // Used to put the filter line into the table
  renderFilters() {
    // "filters" ise created in the withTracker loading at the bottom
    return this.props.filters.map((filter) => (
      <Filter key={filter._id} filter={filter} />
    ));
  }

  // *******************************
  getTasks() {
    return [
      { _id: 1, text: 'This is task 1' },
      { _id: 2, text: 'This is task 2' },
      { _id: 3, text: 'This is task 3' },
    ];
  }

  renderTasks() {
    return this.getTasks().map((task) => (
      <Task key={task._id} task={task} />
    ));
  }


  testMeteorMethod() {

    // on the client
    Meteor.call("tsx_getFilterWheelMakeModel", function (error) {
      // identify the error
      if (error && error.error === "logged-out") {
        // show a nice error message
        Session.set("errorMessage", "Please log in to post a comment.");
      }
    });
  }


  render() {
    /* https://react.semantic-ui.com/modules/checkbox#checkbox-example-radio-group
    */

    return (
      <div className="container">
        <header>
          <h1>Image Sessions</h1>
          <div class="ui breadcrumb">
            <a class="section">Home</a>
            <i class="right angle icon divider"></i>
            <a class="section">Store</a>
            <i class="right angle icon divider"></i>
            <div class="active section">T-Shirt</div>
          </div>

          <div class="ui menu">
            <div class="header item">
              Our Company
            </div>
            <a class="item active">
              About Us
            </a>
            <a class="item">
              Jobs
            </a>
            <a class="item">
              Locations
            </a>
          </div>

          <button class="circular ui icon button" onClick={this.testMeteorMethod.bind(this)}>
            <i class="icon settings"></i>
          </button>

          <form className="new-filter" onSubmit={this.addNewFilter.bind(this)} >
             <input
               type="text"
               ref="textInput"
               placeholder="Type to add new tasks"
             />
           </form>
        </header>
        Sessions found:
        <ul>
          {this.renderImageSessions()}
        </ul>
        Filters found:
        <ul>
          {this.renderFilters()}
        </ul>
        Task:
        <ul>
          {this.renderTasks()}
        </ul>
        <br/>
        <div class="ui relaxed divided list">
          <div class="item">
            <i class="large github middle aligned icon"></i>
            <div class="content">
              <a class="header">Semantic-Org/Semantic-UI</a>
              <div class="description">Updated 10 mins ago</div>
            </div>
          </div>
          <div class="item">
            <i class="large github middle aligned icon"></i>
            <div class="content">
              <a class="header">Semantic-Org/Semantic-UI-Docs</a>
              <div class="description">        <div class="ui indicating progress">
                        <div class="bar"></div>
                        <div class="label">Funding</div>
                      </div>
</div>
            </div>
          </div>
          <div class="item">
            <i class="large github middle aligned icon"></i>
            <div class="content">
              <a class="header">Semantic-Org/Semantic-UI-Meteor</a>
              <div class="description">Updated 34 mins ago</div>
            </div>
          </div>
        </div>
        <br/>


        <div class="ui checked checkbox">
          <input type="checkbox" checked="" class="hidden" readonly="" tabindex="0" />
          <label>This checkbox comes pre-checked</label>
        </div>

        <div class="ui vertical menu">
          <div class="item">Home</div>
          <div role="listbox" aria-expanded="false" class="ui left pointing dropdown link item" tabindex="0">
            <div class="text" role="alert" aria-live="polite">Messages</div>
            <i aria-hidden="true" class="dropdown icon"></i>
            <div class="menu transition">
              <div role="option" class="item">Inbox</div>
              <div role="option" class="item">Starred</div>
              <div role="option" class="item">Sent Mail</div>
              <div role="option" class="item">Drafts (143)</div>
              <div class="divider">
              </div>
              <div role="option" class="item">Spam (1009)</div>
              <div role="option" class="item">Trash</div>
            </div>
          </div>
          <div class="item">Browse</div>
          <div class="item">Help</div>
        </div>

        <div class="ui fitted toggle checkbox">
          <input type="checkbox" class="hidden" readonly="" tabindex="0" />
          <label></label>
        </div>

        <div class="ui radio checkbox">
          <input type="checkbox" class="hidden" readonly="" tabindex="0" />
          <label>Radio choice</label>
        </div>

        <div class="ui indicating progress">
          <div class="bar"></div>
          <div class="label">Funding</div>
        </div>

        <div class="ui progress success">
          <div class="bar">
            <div class="progress"></div>
          </div>
          <div class="label">Everything worked, your file is all ready.</div>
        </div>

        <div class="ui progress">
          <div class="bar">
            <div class="progress"></div>
          </div>
          <div class="label">Uploading Files</div>
        </div>

        <form class="ui form">
          <div class="field">Selected value: <b>
        </b>
          </div>
          <div class="field">
            <div class="ui radio checkbox">
              <input type="checkbox" class="hidden" name="checkboxRadioGroup" readonly="" tabindex="0" value="this" />
              <label>Choose this</label>
            </div>
          </div>
          <div class="field">
            <div class="ui radio checkbox">
              <input type="checkbox" class="hidden" name="checkboxRadioGroup" readonly="" tabindex="0" value="that" />
              <label>Or that</label>
            </div>
          </div>
        </form>

        <table class="ui striped table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Date Joined</th>
              <th>E-mail</th>
              <th>Called</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>John Lilki</td>
              <td>September 14, 2013</td>
              <td>jhlilk22@yahoo.com</td>
              <td>No</td>
            </tr>
            <tr>
              <td>Jamie Harington</td>
              <td>January 11, 2014</td>
              <td>jamieharingonton@yahoo.com</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>Jill Lewis</td>
              <td>May 11, 2014</td>
              <td>jilsewris22@yahoo.com</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>John Lilki</td>
              <td>September 14, 2013</td>
              <td>jhlilk22@yahoo.com</td>
              <td>No</td>
            </tr>
            <tr>
              <td>John Lilki</td>
              <td>September 14, 2013</td>
              <td>jhlilk22@yahoo.com</td>
              <td>No</td>
            </tr>
            <tr>
              <td>Jamie Harington</td>
              <td>January 11, 2014</td>
              <td>jamieharingonton@yahoo.com</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>Jill Lewis</td>
              <td>May 11, 2014</td>
              <td>jilsewris22@yahoo.com</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>John Lilki</td>
              <td>September 14, 2013</td>
              <td>        <div class="ui indicating progress">
                        <div class="bar"></div>
                        <div class="label">Funding</div>
                      </div>
</td>
              <td>        <div class="ui checked checkbox">
                        <input type="checkbox" checked="" class="hidden" readonly="" tabindex="0" />
                        <label>This checkbox comes pre-checked</label>
                      </div>
</td>
            </tr>
          </tbody>
        </table>



      </div>
    );
  }
}
// *******************************
// THIS IS THE DEFAULT EXPORT AND IS WHERE THE LOADING OF THE PAGE STARTS
// USE THIS POINT TO GRAB THE FILTERS
export default withTracker(() => {
  return {
    filters: Filters.find({}, { sort: { name: -1 } }).fetch(),
  };
})(App);
