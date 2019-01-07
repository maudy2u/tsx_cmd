#!/usr/bin/env bash
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
install_dir=$(pwd)

if [ $# -eq 0 ]
  then
    echo ""
    echo " *******************************"
    echo "Bundling TSX Cmd v1.1"
    echo " *******************************"
    echo ": You need to provide one parameter to build - a comment."
    echo ": e.g."
    echo ""
    echo " tsx_cmd_bundle.sh test"
    echo " tsx_cmd_bundle.sh alpha"
    echo ""
    echo " *******************************"
    echo ""
    exit 1
fi

for s in $(echo $values | jq -r "to_entries|map(\"\(.key)=\(.value|tostring)\")|.[]" ./private/version.json ); do
    export $s
done

export details=build_$(git rev-list --all --count)_v${version}_${date}_${1}

if [ "$(uname -s)" == "Darwin" ]; then
  if [ "$(uname -p)" == "i386" ]; then
    echo ""
    echo " *******************************"
    echo tsx_cmd_bundle.sh is creating file: ../tsx_cmd_$(uname -s)_$(uname -p)_${details}.tar
    echo " *******************************"
    meteor bundle ../tsx_cmd_$(uname -s)_$(uname -p)_${details}.tar
    growlnotify -n "Build $(git rev-list --all --count) of TSX Cmd" -s -m "Completed"
  else
    echo $(uname -s) $(uname -p) - Not Supported
    exit 5
  fi
elif [ "$(uname -s)" == "Linux" ]; then

  if [ "$(uname -p)" == "aarch64" ]; then
    echo ""
    echo " *******************************"
    echo tsx_cmd_bundle.sh is creating file: ../tsx_cmd_$(uname -s)_aarch64_${details}.tar
    echo " *******************************"
    ~/meteor/meteor bundle ../tsx_cmd_$(uname -s)_aarch64_${details}.tar

  elif [ "$(uname -p)" == "armv7l" ]; then
    echo ""
    echo " *******************************"
    echo tsx_cmd_bundle.sh is creating file: ../tsx_cmd_$(uname -s)_armv7_${details}.tar
    echo " *******************************"
    ~/meteor/meteor bundle ../tsx_cmd_$(uname -s)_armv7_${details}.tar
  else
    echo $(uname -s) $(uname -p) - Not Supported
    exit 5
  fi
else
    # Do something under 64 bits Windows NT platform
    echo $(uname -s) $(uname -p) - Not Supported
    exit 5
fi
