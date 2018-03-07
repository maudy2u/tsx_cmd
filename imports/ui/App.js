import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { withTracker } from 'meteor/react-meteor-data';

// Import the API Model
import { SessionTemplates } from '../api/sessionTemplates.js';
import { Filters } from '../api/filters.js';
import { ImageSessions } from '../api/imageSessions.js';
import { TheSkyXInfos } from '../api/theSkyXInfo.js';

// Import the ...
import ImageSession from './ImageSession.js';
import SessionTemplate from './SessionTemplate.js';
import Filter from './Filter.js';
import TheSkyXInfo from './TheSkyXInfo.js';

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
    event.preventDefault();

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
// Layout the page here
// *******************************
  render() {
    return (
      <div className="container">
        <header>
          <h1>Imaging Sessions</h1>

          <form className="new-filter" onSubmit={this.addNewFilter.bind(this)} >
            <input
              type="text"
              ref="textInput"
              placeholder="Type to add new filters"
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
