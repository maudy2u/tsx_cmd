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
    echo ": e.g."
    echo ": tsx_cmd_install.sh init"
    echo ""
    echo ": 1. Run this from the directory you wish to install."
    echo ": 2. You need to pass the INIT variable."
    echo ": 3. If you are updating then please use tsx_cmd_update.sh"
    echo ": "
    echo " *******************************"
    echo ""
    exit 1
fi

if [ "${1}" == "init" ]; then
  if [ "$(uname)" == "Darwin" ]; then
    echo MAC in ${install_dir}
    export APP='https://github.com/maudy2u/tsx_cmd/releases/download/RC8/tsx_cmd_Darwin_i386_build_355_v3.4.5_2018-12-27_RC8.tar'
    export MONGO='https://fastdl.mongodb.org/osx/mongodb-osx-ssl-x86_64-4.0.5.tgz'
    export NODEJS='https://nodejs.org/dist/v8.11.1/node-v8.11.1-darwin-x64.tar.gz'
    export MONGO_PARAMS="-C ./mongodb --strip-components=1"
  elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    if [ "$(uname -p)" == "aarch64" ]; then
      echo armv8 in ${install_dir}
      echo ""
      echo " *******************************"
      echo " tsx_cmd - armv8"
      echo " Currently uses the same armv7 versions"
      echo " MongoDB is apt installed"
      export APP='https://github.com/maudy2u/tsx_cmd/releases/download/RC8/tsx_cmd_Linux_armv7_build_355_v3.4.5_2018-12-27_RC8.tar'
#      export NODEJS='https://nodejs.org/dist/v8.11.3/node-v8.11.3-linux-armv7l.tar.xz'
      export NODEJS='https://nodejs.org/dist/v6.16.0/node-v6.16.0-linux-armv7l.tar.gz'
    elif [ "$(uname -p)" == "armv7l" ]; then
      echo armv7 in ${install_dir}
      echo ""
      echo " *******************************"
      echo " Mongodb - CAN BE BUILT MANUALLY. CHECKED HERE:"
      echo " (it can take a while on ODroid-XU4)"
      echo " ./bin/mongod_arm_build.sh"
      export APP='https://github.com/maudy2u/tsx_cmd/releases/download/RC8/tsx_cmd_Linux_armv7_build_355_v3.4.5_2018-12-27_RC8.tar'
      export MONGO='https://github.com/maudy2u/tsx_cmd/releases/download/armv7_mongo/mongoDB_armv7.tar'
      export NODEJS='https://nodejs.org/dist/v6.16.0/node-v6.16.0-linux-armv7l.tar.gz'
      export MONGO_PARAMS="-C ./mongodb/bin"
    else
      echo $(uname -s) $(uname -p) - NO NODEJS supported... yet
      echo $(uname -s) $(uname -p) - NO mongoDB supported... yet
      exit 5
    fi
  else
      # Do something under 64 bits Windows NT platform
      echo $(uname -s) $(uname -p) - Not Supported
      exit 5
  fi
else
  echo Nothing to do.
  exit 1
fi

mkdir -p ${install_dir}/db
export MONGO_URL='mongodb://localhost/tsx_cmd'
export PORT=3000
export ROOT_URL='http://127.0.0.1'

cd ${install_dir}

if [ "$(uname -p)" == "aarch64" ]; then
  echo ""
  echo " *******************************"
  echo "Mongodb - apt-get install mongodb-enterprise 3.6 multiverse"
  echo " *******************************"
  # source: https://andyfelong.com/2018/02/update-mongodb-3-6-on-odroid-c2-with-ubuntu-16-04-3-arm64/
  sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5
  echo "deb [ arch=amd64,arm64,ppc64el,s390x ] http://repo.mongodb.com/apt/ubuntu xenial/mongodb-enterprise/3.6 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-enterprise.list
  sudo apt update
  sudo apt install g++ build-essential -y
  sudo apt install mongodb-enterprise -y
  echo ""
  echo " *******************************"
  echo " NodeJS - Download " ${MONGO}
  echo " *******************************"
  wget -O nodejs.tar.gz "${NODEJS}"
  echo ""
  echo " *******************************"
  echo "TSX_CMD - Download " ${APP}
  echo " *******************************"
  wget -O tsx_cmd.tar "${APP}"
else
  echo ""
  echo " *******************************"
  echo "Mongodb - Download and extract" ${MONGO}
  echo " *******************************"
  mkdir -p ./mongodb/bin
  curl -L "${MONGO}" -o mongodb.tgz
  tar -xf mongodb.tgz ${MONGO_PARAMS}
  rm ${install_dir}/mongodb.tgz
  echo ""
  echo " *******************************"
  echo " NodeJS - Download " ${MONGO}
  echo " *******************************"
  curl -L "${NODEJS}" -o nodejs.tar.gz
  echo ""
  echo " *******************************"
  echo "TSX_CMD - Download " ${APP}
  echo " *******************************"
  curl -L "${APP}" -o tsx_cmd.tar
fi

echo ""
echo " *******************************"
echo " NODEJS - Extract" ${NODEJS}
echo " *******************************"
mkdir -p ./nodejs
tar -xf nodejs.tar.gz -C ./nodejs --strip-components=1
rm ${install_dir}/nodejs.tar.gz
export PATH=${install_dir}/mongodb/bin:${install_dir}/nodejs/bin:$PATH

echo ""
echo " *******************************"
echo " TSX_CMD - Extract" ${APP}
echo " *******************************"
tar -xf tsx_cmd.tar
rm ${install_dir}/tsx_cmd.tar

cd ${install_dir}/bundle/programs/server
echo ""
echo " *******************************"
echo " TSX_CMD - fix for fibers deploy"
echo " *******************************"
npm uninstall fibers
npm install fibers

echo ""
echo " *******************************"
echo " TSX_CMD - update npm installs"
echo " *******************************"
npm install amdefine ansi-styles chalk escape-string-regexp has-ansi promise source-map strip-ansi type-of ansi-regex asap eachline meteor-promise semver source-map-support supports-color underscore

cd ${install_dir}

echo ""
echo " *******************************"
echo " TSX_CMD - installed"
echo " *******************************"
echo '{' > ./settings.json
echo '  "enable_log": "yes",' >> ./settings.json
echo '  "enable_debug": "no",' >> ./settings.json
echo '  "enable_info": "no",' >> ./settings.json
echo '  "enable_warn": "yes",' >> ./settings.json
echo '  "removed-to-enable: log_file_location": "/media/odroid/PENSIVE2/tsx_cmd_logs"' >> ./settings.json
echo '}' >> ./settings.json
