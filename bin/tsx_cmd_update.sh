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
header() {
  echo " *******************************"
  echo " Update TSX Cmd v1.0"
  echo " *******************************"
}

helpinfo() {
  echo ""
  header
  echo ": 1. You need to download tsx_cmd package before running this file."
  echo ": 2. Put the file in the directory you wish to install tsx_cmd."
  echo ": 3. Run this file from within the directory"
  echo ": "
  echo ": e.g."
  echo ""
  echo " tsx_cmd_install.sh tsx_cmd_20180708_05.tar"
  echo ""
  echo " *******************************"
  echo ""
}

if [ $# -eq 0 ]
  then
    helpinfo
fi

export tarfile=${1}

install_tar_bundle() {
  if [ "$(uname)" == "Darwin" ]; then
      echo Mac in ${install_dir}

  elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
      # Do something under GNU/Linux platform
      echo Linux
      if [ "$(uname -p)" == "aarch64" ]; then
          echo ARMV8 in ${install_dir}
      elif [ "$(uname -p)" == "armv7l" ] || [ "$(uname -m)" == "armv7l" ] ; then
          echo ARMV7 in ${install_dir}
      elif [ "$(uname -p)" == "x86_64" ]; then
          echo x86_64 in ${install_dir}
      else
        echo NO NODEJS supported
        echo $(uname -s) $(uname -p) - Not Supported
      fi
  else
      # Do something under 64 bits Windows NT platform
      echo $(uname -s) $(uname -p) - Not Supported
  fi

  echo " *******************************"
  echo " Updating tsx_cmd in ${install_dir}"
  echo " *******************************"
  echo ""
  mv ./bundle ./bundle_${version}_${date}
  echo " ./bundle backed up to ./bundle_${version}_${date}"

  echo " *******************************"
  echo " TSX_CMD - Extract" ${tarfile}
  echo " *******************************"
  echo ""
  tar xf ${tarfile}
}

get_version() {
  # *******************************
  # grab current bundle variables
  for s in $(echo $values | jq -r "to_entries|map(\"\(.key)=\(.value|tostring)\")|.[]" ./bundle/programs/server/assets/app/version.json ); do
      export $s
  done
}

update_fibers() {

  cd ${install_dir}/bundle/programs/server
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
  cd ${install_dir}

  echo " *******************************"
  echo " TSX_CMD - updated"
  echo " *******************************"
}

export PATH=${install_dir}/mongodb/bin:${install_dir}/nodejs/bin:$PATH

case ${tarfile} in
     update)
          get_version
          update_fibers
          ;;
#     pattern-3|pattern-4|pattern-5)
#          commands
#          ;;
     help)
          helpinfo
          ;;
     *)
          get_version
          install_tar_bundle;
          update_fibers;
          ;;
esac
