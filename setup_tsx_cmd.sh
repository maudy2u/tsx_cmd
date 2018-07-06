#!/bin/bash
# This file us used to prepare a brand new meteor app via meteor create app_name
# alias meteor=$HOME/meteor/meteor

# PREPARE THE NEW METEOR PROJECT
~/meteor/meteor npm install --save-dev babel-plugin-transform-class-properties@6.24.1
~/meteor/meteor add semantic:ui@=2.2.6_5 flemay:less-autoprefixer jquery
~/meteor/meteor npm install --save shelljs
~/meteor/meteor add flemay:less-autoprefixer jquery
~/meteor/meteor npm install --save react@15.6.2 react-dom@15.6.2 semantic-ui-react@0.78.3

~/meteor/meteor add react-meteor-data
~/meteor/meteor add froatsnook:sleep package-stats-opt-out
~/meteor/meteor npm install --save @babel/runtime
~/meteor/meteor npm install --save react-simple-range react-datetime-bootstrap react-timekeeper
~/meteor/meteor add ostrio:logger ostrio:loggerconsole ostrio:loggerfile
~/meteor/meteor add ostrio:meteor-root
~/meteor/meteor add ostrio:loggermongo
~/meteor/meteor add dburles:collection-helpers
~/meteor/meteor add vsivsi:job-collection
~/meteor/meteor add session
~/meteor/meteor add akasha:shelljs

# meteortyos breaks job-collection
# ~/meteor/meteor add meteortoys:allthings
