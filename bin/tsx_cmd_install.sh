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
    echo ": tsx_cmd_install.sh init 192.168.0.1"
    echo ""
    echo ": 1. Run this from the directory you wish to install."
    echo ": 2. You need to pass the INIT variable."
    echo ": 3. If you are updating then please use tsx_cmd_update.sh"
    echo ": 4. Enter the IP address you wish tsx_cmd to use, needed"
    echo ":    for downloads and uploads."
    echo ": "
    echo " *******************************"
    echo ""
    exit 1
fi

if [ "${1}" == "init" ]; then

  if [ "$(uname)" == "Darwin" ]; then
    echo " *******************************"
    echo " tsx_cmd - Mac in" ${install_dir}
    export APP='https://github.com/maudy2u/tsx_cmd/releases/download/untagged-1d84598b3568064b6d82/tsx_cmd_os.osx.x86_64_v3.6.5_2020-06-07_RC33.626.tar'
    export MONGO='https://fastdl.mongodb.org/osx/mongodb-osx-ssl-x86_64-4.0.5.tgz'
    export NODEJS='https://nodejs.org/dist/v8.11.1/node-v8.11.1-darwin-x64.tar.gz'
    # https://nodejs.org/dist/v8.11.3/node-v8.11.3-darwin-x64.tar.xz
    export MONGO_PARAMS="-C ./mongodb --strip-components=1"

  elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    echo " *******************************"
    echo " Installing mongo-tools"
    echo " Needed for mongodump to backup database"
    sudo apt install mongo-tools

    if [ "$(uname -p)" == "aarch64" ]; then
      echo ""
      echo " *******************************"
      echo " tsx_cmd - aarch64/armv8 in" ${install_dir}
      export APP='https://github.com/maudy2u/tsx_cmd/releases/download/untagged-1d84598b3568064b6d82/tsx_cmd_os.Linux.aarch64_v3.6.5_2020-06-07_RC33.626.tar'
      export MONGO='http://downloads.mongodb.org/linux/mongodb-linux-arm64-ubuntu1604-3.6.8.tgz'
      export NODEJS='https://nodejs.org/dist/v8.11.3/node-v8.11.3-linux-arm64.tar.xz'
      export MONGO_PARAMS="-C ./mongodb  --strip-components=1"

    elif [ "$(uname -p)" == "armv7l" ] || [ "$(uname -m)" == "armv7l" ] ; then
      echo armv7 in ${install_dir}
      echo ""
      echo " *******************************"
      echo " tsx_cmd - armhf/armv7 in" ${install_dir}
      echo " Mongodb - CAN BE BUILT MANUALLY."
      echo " (it can take a few hours to build)"
      echo "  CHECK HERE: ./bin/mongod_arm_build.sh"
      export APP='https://github.com/maudy2u/tsx_cmd/releases/download/untagged-1d84598b3568064b6d82/tsx_cmd_os.Linux.armv7l_v3.6.5_2020-06-07_RC33.626.tar'
      export MONGO='https://github.com/maudy2u/tsx_cmd/releases/download/armv7_mongo/mongoDB_armv7.tar'
      export NODEJS='https://nodejs.org/dist/v6.16.0/node-v6.16.0-linux-armv7l.tar.gz'
      # https://nodejs.org/dist/v8.11.3/node-v8.11.3-linux-armv7l.tar.xz
      export MONGO_PARAMS="-C ./mongodb/bin  --strip-components=1"

    elif [ "$(uname -p)" == "x86_64" ]; then
      echo ""
      echo " *******************************"
      echo " tsx_cmd - Linux X86_64 in" ${install_dir}
      export APP='https://github.com/maudy2u/tsx_cmd/releases/download/untagged-1d84598b3568064b6d82/tsx_cmd_os.linux.x86_64_v3.6.5_2020-06-07_RC33.626.tar'
      export MONGO='http://downloads.mongodb.org/linux/mongodb-linux-x86_64-ubuntu1804-4.0.5.tgz'
      export NODEJS='https://nodejs.org/dist/v8.11.3/node-v8.11.3-linux-x64.tar.xz'
      export MONGO_PARAMS="-C ./mongodb  --strip-components=1"

    else
      echo $(uname -s) $(uname -p) - NO NODEJS supported... yet
      echo $(uname -s) $(uname -p) - NO mongoDB supported...
      exit 5
    fi
  else
      # Do something under 64 bits Windows NT platform
      echo $(uname -s) $(uname -p) - No Installer yet.
      echo Windows binary is here: https://github.com/maudy2u/tsx_cmd/releases/download/untagged-1d84598b3568064b6d82/tsx_cmd_os.windows.x86_32_v3.6.5_2020-06-07_RC33.626.tar
      exit 5
  fi
else
  echo Nothing to do.
  exit 1
fi

mkdir -p ${install_dir}/db
cd ${install_dir}

echo ""
echo " *******************************"
echo "Mongodb - Download and extract " ${MONGO}
echo " *******************************"
mkdir -p ./mongodb/bin
curl -L "${MONGO}" -o mongodb.tgz
tar -xf mongodb.tgz ${MONGO_PARAMS}
rm ${install_dir}/mongodb.tgz

echo ""
echo " *******************************"
echo " NodeJS - Download and extract " ${NODEJS}
echo " *******************************"
mkdir -p ./nodejs
curl -L "${NODEJS}" -o nodejs.tar.gz
tar -xf nodejs.tar.gz -C ./nodejs --strip-components=1
rm ${install_dir}/nodejs.tar.gz

if [ "${3}" == "" ]; then
  echo ""
  echo " *******************************"
  echo "TSX_CMD - Download " ${APP}
  echo " *******************************"
  curl -L "${APP}" -o tsx_cmd.tar
fi

echo ""
echo " *******************************"
echo " TSX_CMD - Extract" ${APP}
echo " *******************************"
if [ "${3}" == "" ]; then
  tar -xf tsx_cmd.tar
  rm ${install_dir}/tsx_cmd.tar
else
  tar -xf ${3}
fi

cd ${install_dir}/bundle/programs/server
echo ""
echo " *******************************"
echo " TSX_CMD - fix for fibers deploy"
echo " *******************************"
export PATH=${install_dir}/mongodb/bin:${install_dir}/nodejs/bin:$PATH

npm uninstall fibers
npm install fibers

echo ""
echo " *******************************"
echo " TSX_CMD - update npm installs"
echo " *******************************"
npm install amdefine ansi-styles chalk escape-string-regexp has-ansi promise source-map strip-ansi type-of ansi-regex asap eachline meteor-promise semver source-map-support supports-color underscore

cd ${install_dir}
#curl -L "https://raw.githubusercontent.com/maudy2u/tsx_cmd/master/bin/tsx_cmd_install.sh" -o "tsx_cmd_install.sh"
#chmod +x "./tsx_cmd_install.sh"
echo ""
echo " *******************************"
echo " TSX_CMD - getting shell scripts"
echo " *******************************"
curl -L "https://raw.githubusercontent.com/maudy2u/tsx_cmd/master/bin/tsx_cmd_start.sh" -o "tsx_cmd_start.sh"
chmod +x "./tsx_cmd_start.sh"
curl -L "https://raw.githubusercontent.com/maudy2u/tsx_cmd/master/bin/tsx_cmd_stop.sh" -o "tsx_cmd_stop.sh"
chmod +x "./tsx_cmd_stop.sh"
curl -L "https://raw.githubusercontent.com/maudy2u/tsx_cmd/master/bin/tsx_cmd_update.sh" -o "tsx_cmd_update.sh"
chmod +x "./tsx_cmd_update.sh"

echo ""
echo " *******************************"
echo " TSX_CMD - installed"
echo " *******************************"
echo '{' > ./settings.json
echo '  "enable_log": "yes",' >> ./settings.json
echo '  "enable_debug": "no",' >> ./settings.json
echo '  "enable_info": "no",' >> ./settings.json
echo '  "enable_warn": "yes",' >> ./settings.json
echo '  "tsx_cmd_db": "tsx_cmd",' >> ./settings.json
echo '  "meteor_db": "meteor",' >> ./settings.json
echo '  "mongo_port": "27017",' >> ./settings.json
echo '  "removed-to-enable: skySafari_files": "/media/odroid/usb_flash/tsx_cmd_skySafariSettings/",' >> ./settings.json
echo '  "removed-to-enable: backup_location": "/media/odroid/usb_flash/tsx_cmd_backups",' >> ./settings.json
echo '  "removed-to-enable: log_file_location": "/media/odroid/usb_flash/tsx_cmd_logs"' >> ./settings.json
echo '}' >> ./settings.json


if [ "${2}" != "" ]; then
  sed -i.bak s/127.0.0.1/${2}/g ./tsx_cmd_start.sh
fi
