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
 if [ "$(uname -p)" == "aarch64" ]; then
   ${METEOR} add ostrio:files@=1.6.0 flemay:less-autoprefixer semantic:ui@=2.2.6_5 jquery react-meteor-data froatsnook:sleep package-stats-opt-out session vsivsi:job-collection dburles:collection-helpers ostrio:logger ostrio:loggerconsole ostrio:loggerfile ostrio:meteor-root ostrio:loggermongo
   ${METEOR} npm install --save-dev babel-plugin-transform-class-properties@6.24.1
   ${METEOR} npm install --save @babel/runtime react-simple-range react-datetime-bootstrap react-timekeeper react@15.6.2 react-dom@15.6.2 shelljs@0.7.8 bootstrap@^3.3 semantic-ui-react@0.78.3 formsy-semantic-ui-react formsy-react@1.1.5 xregexp
 else
   ${METEOR} remove standard-minifier-css
   ${METEOR} add ostrio:files@1.6.6 semantic:ui@=2.2.6_5 juliancwirko:postcss less jquery react-meteor-data froatsnook:sleep package-stats-opt-out session vsivsi:job-collection dburles:collection-helpers ostrio:logger ostrio:loggerconsole ostrio:loggerfile ostrio:meteor-root ostrio:loggermongo
   ${METEOR} npm install --save-dev babel-plugin-transform-class-properties@6.24.1 postcss@6.0.22 postcss-load-config@1.2.0 autoprefixer
   ${METEOR} npm install --save @babel/runtime react-simple-range react-datetime-bootstrap react-timekeeper react@15.6.2 react-dom@15.6.2 shelljs@0.7.8 bootstrap@^3.3 semantic-ui-react@0.78.3 formsy-semantic-ui-react formsy-react@1.1.5 xregexp postcss-easy-import postcss-nested postcss-simple-vars rucksack-css
 fi

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

echo " *******************************"
echo " TSX_CMD - installed"
echo " *******************************"
echo '{' > ./settings.json
echo '  "enable_log": "yes",' >> ./settings.json
echo '  "enable_debug": "no",' >> ./settings.json
echo '  "enable_info": "no",' >> ./settings.json
echo '  "enable_warn": "yes",' >> ./settings.json
echo '  "tsx_cmd_db": "tsx_cmd",' >> ./settings.json
echo '  "mongo_port": "27017",' >> ./settings.json
echo '  "removed-to-enable: backup_location": "/home/odroid/app",' >> ./settings.json
echo '  "removed-to-enable: log_file_location": "/media/odroid/PENSIVE2/tsx_cmd_logs"' >> ./settings.json
echo '}' >> ./settings.json
sed -i.bak s/tsx_cmd/meteor/g ./settings.json
sed -i.bak s/271017/3001/g ./settings.json


# meteortyos breaks job-collection
# ${METEOR}  add meteortoys:allthings
