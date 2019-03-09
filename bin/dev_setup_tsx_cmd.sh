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
if [ "$(uname)" == "Darwin" ]; then
  METEOR=~/.meteor/meteor
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
  if [ "$(uname -p)" == "x86_64" ]; then
    METEOR=meteor
  else
    METEOR=~/meteor/meteor
  fi
fi
  #statements
 # debug https://github.com/juliancwirko/meteor-postcss
${METEOR} remove standard-minifier-css
${METEOR} add ostrio:files@=1.6.6 semantic:ui@=2.2.6_5 juliancwirko:postcss less jquery react-meteor-data froatsnook:sleep package-stats-opt-out akasha:shelljs session vsivsi:job-collection dburles:collection-helpers ostrio:logger ostrio:loggerconsole ostrio:loggerfile ostrio:meteor-root ostrio:loggermongo
${METEOR} npm install --save-dev postcss@6.0.22 postcss-load-config@1.2.0 autoprefixer babel-plugin-transform-class-properties@6.24.1
${METEOR} npm install --save @babel/runtime react-simple-range react-datetime-bootstrap react-timekeeper react@15.6.2 react-dom@15.6.2 shelljs bootstrap@^3.3 postcss-easy-import postcss-nested postcss-simple-vars rucksack-css semantic-ui-react@0.78.3 formsy-semantic-ui-react formsy-react xregexp
## used for a semantic-ui less error
${METEOR} npm install

echo " *******************************"
echo "jq - Download and extract"
echo " "
echo " used when bundling e.g. tsx_cmd_bundle.sh"
echo " *******************************"
if [ "$(uname)" == "Darwin" ]; then
  echo " MUST INSTALL MANUALLY"
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
  sudo apt install jq
fi

# meteortyos breaks job-collection
# ${METEOR}  add meteortoys:allthings
