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
export install_dir=$(pwd)
export app="Building TSX Cmd v1.2"
if [ $# -eq 0 ]
  then
    echo ""
    echo " *******************************"
    echo " "${app}
    echo " *******************************"
    echo ": You need to provide one parameter to build - this directory to use"
    echo ": e.g."
    echo ""
    echo " tsx_cmd_build.sh ~/tsx_cmd"
    echo " tsx_cmd_build.sh ~/app"
    echo ""
    echo " *******************************"
    echo ""
fi

echo ""
echo " *******************************"
echo " "${app}
echo " *******************************"

if [ $# -eq 1 ]; then
  echo ""
  echo " *******************************"
  echo  Building...
  echo " *******************************"
  ~/meteor/meteor build --directory ${1}

  export PATH=${1}/mongodb/bin:${1}/nodejs/bin:$PATH

  cd ${1}/bundle/programs/server
  echo " *******************************"
  echo " TSX_CMD - fix for fibers deploy"
  echo " *******************************"
  echo ""
  npm uninstall fibers
  npm install fibers
  echo " *******************************"
  echo " TSX_CMD - reinstall npm"
  echo " *******************************"
  echo ""
  npm install amdefine ansi-styles chalk escape-string-regexp has-ansi promise source-map strip-ansi type-of ansi-regex asap eachline meteor-promise semver source-map-support supports-color underscore
  cd ${1}

  echo " *******************************"
  echo " TSX_CMD - updated"
  echo " *******************************"
fi
