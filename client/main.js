import 'eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css'
//import 'semantic-ui-css/semantic.min.css'
import React from 'react';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';

import App from '../imports/ui/App.js';

Meteor.startup(() => {
  render(<App />, document.getElementById('render-target'));
});
