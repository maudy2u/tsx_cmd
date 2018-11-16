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
    echo "Install TSX Cmd v1.0"
    echo " *******************************"
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
    exit 1
fi

mkdir -p ${install_dir}/db
export MONGO_URL='mongodb://localhost/tsx_cmd'
export PORT=3000
export ROOT_URL='http://127.0.0.1'

if [ "$(uname)" == "Darwin" ]; then
    echo Mac in ${install_dir}

    # install mongodb
    echo " *******************************"
    echo "Mongodb - Download and extract"
    echo " *******************************"
    curl https://fastdl.mongodb.org/osx/mongodb-osx-ssl-x86_64-4.0.0.tgz -o mongodb-osx-ssl-x86_64-4.0.0.tgz
    tar -xf mongodb-osx-ssl-x86_64-4.0.0.tgz
    rm ${install_dir}/mongodb-osx-ssl-x86_64-4.0.0.tgz

    # install nodejs
    echo " *******************************"
    echo "nodejs - Download and extract"
    echo " *******************************"
    curl https://nodejs.org/dist/v8.11.3/node-v8.11.3-darwin-x64.tar.gz -o node-v8.11.3-darwin-x64.tar.gz
    tar -xf node-v8.11.3-darwin-x64.tar.gz
    rm ${install_dir}/node-v8.11.3-darwin-x64.tar.gz

    # install tsx__cmd - assumes already downloaded
    echo " *******************************"
    echo " TSX_CMD - Extract" ${1}
    echo " *******************************"
    # https://drive.google.com/drive/folders/1yUPU6A0gbBv5UnuSp308lvctY4d6aUtw?usp=sharing
    export PATH=${install_dir}/mongodb-osx-x86_64-4.0.0/bin:${install_dir}/node-v8.11.3-darwin-x64/bin:$PATH

elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    # Do something under GNU/Linux platform
    echo Linux

    # install nodejs
    if [ "$(uname -p)" == "aarch64" ]; then

      # install mongodb
      echo " *******************************"
      echo "Mongodb - apt-get install"
      echo " *******************************"
      # source: https://andyfelong.com/2018/02/update-mongodb-3-6-on-odroid-c2-with-ubuntu-16-04-3-arm64/
      sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5
      echo "deb [ arch=amd64,arm64,ppc64el,s390x ] http://repo.mongodb.com/apt/ubuntu xenial/mongodb-enterprise/3.6 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-enterprise.list
      sudo apt update
      sudo apt install g++ build-essential -y
      sudo apt install mongodb-enterprise -y

      echo " *******************************"
      echo "nodejs - Download and extract"
      echo " *******************************"
      # armv7
      curl https://nodejs.org/dist/v8.11.3/node-v8.11.3-linux-armv7l.tar.xz -o node-v8.11.3-linux-armv7l.tar.xz
      tar -xf node-v8.11.3-linux-armv7l.tar.xz
      rm ${install_dir}/node-v8.11.3-linux-armv7l.tar.xz
      export PATH=${install_dir}/node-v8.11.3-linux-armv7l/bin:$PATH
      # armv8
      #curl https://nodejs.org/dist/v8.11.3/node-v8.11.3-linux-arm64.tar.xz -o node-v8.11.3-linux-arm64.tar.xz
      #tar -xf node-v8.11.3-linux-arm64.tar.xz
      #rm ${install_dir}/node-v8.11.3-linux-arm64.tar.xz
    elif [ "$(uname -p)" == "armv7l" ]; then
      # install mongodb
      echo " *******************************"
      echo "Mongodb - BUILD - NEED TO BE BUILT FOR ARMv7"
      echo "run the following (it can take a while on ODroid-XU4)"
      echo " ./mongod_arm_build.sh"
      echo " *******************************"

      echo " *******************************"
      echo "nodejs - Download and extract"
      echo " *******************************"
      # armv7
      curl https://nodejs.org/dist/latest-v6.x/node-v6.14.4-linux-armv7l.tar.gz -o node-v6.14.4-linux-armv7l.tar.gz
      tar -xf node-v6.14.4-linux-armv7l.tar.gz
      rm ${install_dir}/node-v6.14.4-linux-armv7l.tar.gz
      # FIX for odroid
      #npm install -g node-gyp
      rm ~/.node-gyp
      export PATH=${install_dir}/node-v6.14.4-linux-armv7l/bin:$PATH
    else
      echo NO NODEJS supported
    fi

else
    # Do something under 64 bits Windows NT platform
    echo $(uname -s) $(uname -p) - Not Supported
    exit 5
fi
  
# install tsx__cmd - assumes already downloaded
echo " *******************************"
echo " TSX_CMD - Extract" ${1}
echo " *******************************"
# https://drive.google.com/drive/folders/1yUPU6A0gbBv5UnuSp308lvctY4d6aUtw?usp=sharing
tar -xf ${1}

echo " *******************************"
echo " TSX_CMD - fix for fibers deploy"
echo " *******************************"
cd ${install_dir}/bundle/programs/server
npm uninstall fibers
npm install fibers
cd ${install_dir}

echo " *******************************"
echo " TSX_CMD - installed"
echo " *******************************"
