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
export app="Build All TSX Cmd v1.2"
export version=build_$(git rev-list --all --count)_v${version}_${date}_${1}
export install_dir=$(pwd)
if [ $# < 2 ]
  then
    echo ""
    echo " *******************************"
    echo " "${app}
    echo " *******************************"
    echo ": You need to provide two parameters to build - a comment"
    echo ": and the destination folder."
    echo ": e.g."
    echo ""
    echo " tsx_cmd_build.sh test /media/odroid/IMAGING/release/"
    echo " tsx_cmd_build.sh alpha /media/odroid/IMAGING/release/"
    echo ""
    echo " *******************************"
    echo ""
    exit 1
fi

export base_dir=${2}

build_tsx_cmd () {
  folder=${base_dir}"tsx_cmd_"$1"_"${version}
  mkdir -p ${folder}
  echo " Building" ${folder}
  ~/meteor/meteor build --architecture $1 --directory ${folder}
  cd ${base_dir}
  tar -czf ${folder}.tar -C ${folder} .
  rm -rf ${folder}
  cd ${install_dir}
}

echo ""
echo " *******************************"
echo " "${app}
echo " *******************************"
echo ""
if [ "$(uname -p)" == "aarch64" ]; then
  build_type="os.linux.aarch64"
  folder=${base_dir}"tsx_cmd_"${build_type}"_"${version}
  mkdir -p ${folder}
  echo " Building" ${folder}
  ~/meteor/meteor build --directory ${folder}
  cd ${base_dir}
  tar -czf ${folder}.tar -C ${folder} .
  rm -rf ${folder}
  cd ${install_dir}
fi

build_tsx_cmd "os.osx.x86_64"
build_tsx_cmd "os.linux.x86_64"
build_tsx_cmd "os.windows.x86_32"
echo ""
echo " *******************************"
echo "  Finished: "${app}
echo " *******************************"
echo ""
