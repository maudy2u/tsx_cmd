#!/bin/bash
# tsx cmd - A web page to send commands to TheSkyX server
#     Copyright (C) 2018  Stephen Townsend
#
#     This program is free software: you can redistribute it and/or modify
#     it under the terms of the GNU Affero General Public License as
#     published by the Free Software Foundation, either version 3 of the
#     License, or (at your option) any later version.
#
#     This program is distributed in the hope that it will be useful,
#     but WITHOUT ANY WARRANTY; without even the implied warranty of
#     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#     GNU Affero General Public License for more details.
#
#     You should have received a copy of the GNU Affero General Public License
#     along with this program.  If not, see <http://www.gnu.org/licenses/>.
#

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
