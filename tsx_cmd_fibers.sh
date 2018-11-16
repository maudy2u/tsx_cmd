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
echo " *******************************"
echo " Update TSX Cmd Fibers v1.0"
echo " *******************************"

if [ "$(uname)" == "Darwin" ]; then
    echo Mac in ${install_dir}
    export PATH=${install_dir}/mongodb-osx-x86_64-4.0.0/bin:${install_dir}/node-v8.11.3-darwin-x64/bin:$PATH

elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    # Do something under GNU/Linux platform
    echo Linux
    if [ "$(uname -p)" == "aarch64" ]; then
      export PATH=${install_dir}/node-v8.11.3-linux-armv7l/bin:$PATH
    elif [ "$(uname -p)" == "armv7l" ]; then
      export PATH=${install_dir}/node-v6.14.4-linux-armv7l/bin:$PATH
    else
      echo NO NODEJS supported
      echo $(uname -s) $(uname -p) - Not Supported
      exit 5
    fi
else
    # Do something under 64 bits Windows NT platform
    echo $(uname -s) $(uname -p) - Not Supported
    exit 5
fi

cd ${install_dir}/bundle/programs/server
echo " *******************************"
echo " TSX_CMD - fix for fibers deploy"
echo " *******************************"
npm uninstall fibers
npm install fibers
cd ${install_dir}

echo " *******************************"
echo " TSX_CMD - updated"
echo " *******************************"
