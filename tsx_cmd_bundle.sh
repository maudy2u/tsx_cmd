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
    echo "Building TSX Cmd v1.0"
    echo " *******************************"
    echo ": You need to provide one parameter to build - version or date."
    echo ": e.g."
    echo ""
    echo " tsx_cmd_bundle.sh 20180708"
    echo ""
    echo " *******************************"
    echo ""
    exit 1
fi
if [ "$(uname -s)" == "Darwin" ]; then
  if [ "$(uname -p)" == "i386" ]; then
    echo ""
    echo " *******************************"
    echo tsx_cmd_bundle.sh is creating file: ../tsx_cmd_$(uname -s)_$(uname -p)_build_$(git rev-list --all --count)_${1}.tar
    echo " *******************************"
    meteor bundle ../tsx_cmd_$(uname -s)_$(uname -p)_build_$(git rev-list --all --count)_${1}.tar
    growlnotify -n "Build $(git rev-list --all --count) of TSX Cmd" -s -m "Completed"
  else
    echo $(uname -s) $(uname -p) - Not Supported
    exit 5
  fi
elif [ "$(uname -s)" == "Linux" ]; then

  if [ "$(uname -p)" == "aarch64" ]; then
    echo ""
    echo " *******************************"
    echo tsx_cmd_bundle.sh is creating file: ../tsx_cmd_$(uname -s)_aarch64_build_$(git rev-list --all --count)_${1}.tar
    echo " *******************************"
    ~/meteor/meteor bundle ../tsx_cmd_$(uname -s)_aarch64_build_$(git rev-list --all --count)_${1}.tar

  elif [ "$(uname -p)" == "armv7l" ]; then
    echo ""
    echo " *******************************"
    echo tsx_cmd_bundle.sh is creating file: ../tsx_cmd_$(uname -s)_armv7_build_$(git rev-list --all --count)_${1}.tar
    echo " *******************************"
    ~/meteor/meteor bundle ../tsx_cmd_$(uname -s)_armv7_build_$(git rev-list --all --count)_${1}.tar
  else
    echo $(uname -s) $(uname -p) - Not Supported
    exit 5
  fi
else
    # Do something under 64 bits Windows NT platform
    echo $(uname -s) $(uname -p) - Not Supported
    exit 5
fi
