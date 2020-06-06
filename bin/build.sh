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
export app="Build All TSX Cmd v1.3"
if [ $# -lt 2 ]
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
export install_dir=$(pwd)
for s in $(echo $values | jq -r "to_entries|map(\"\(.key)=\(.value|tostring)\")|.[]" ./private/version.json ); do
    export $s
done
export details=build_$(git rev-list --all --count)_v${version}_${date}_${1}

package_tar() {
  cd ${base_dir}
  tar -czf $1.tar -C $1 .
  rm -rf $1
  cd ${install_dir}
}

build_tsx_cmd () {
  folder=${base_dir}"tsx_cmd_"$1"_"${details}
  mkdir -p ${folder}
  echo " Building" ${folder}
  if [ "$(uname -m)" == "aarch64" ] || [ "$(uname -m)" == "armv7l" ]; then
    ${meteor_build} build --directory ${folder}
  else
    ${meteor_build} build --architecture $1 --directory ${folder}
  fi
  package_tar ${folder}
}

if [ "$(uname -m)" == "aarch64" ] || [ "$(uname -m)" == "armv7l" ]; then
  export meteor_build=~/meteor/meteor
else
  export meteor_build=meteor
fi

if [ "$(uname -s)" == "Linux" ]; then
  export build_type="os.$(uname -s).$(uname -m)"
fi

if [ "$(uname -s)" == "Darwin" ]; then
  export build_type="os.osx.$(uname -m)"
fi

build_tsx_cmd ${build_type}
#build_tsx_cmd "os.linux.x86_64"
#build_tsx_cmd "os.windows.x86_32"

echo ""
echo " *******************************"
echo "  Finished: "${app}
echo "  Location: "${folder}".tar"
echo " *******************************"
echo ""
