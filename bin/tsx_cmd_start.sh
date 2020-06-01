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
echo ''
echo '*******************************'
export install_dir=$(pwd)
mkdir -p ${install_dir}/db
mkdir -p /tmp/mongod
export MONGO_URL='mongodb://localhost/tsx_cmd'
export PORT=3000
export ROOT_URL='http://127.0.0.1'
export METEOR_SETTINGS="$(cat ${install_dir}/settings.json)"
export PATH=${install_dir}/mongodb/bin:${install_dir}/nodejs/bin:$PATH

tsx_cmd() {
  cd ${install_dir}/bundle
  node main.js
}

if [ "$(uname)" == "Darwin" ]; then
  if [ "$(uname -p)" == "i386" ]; then
    echo Mac in ${install_dir}
    ulimit -n 1024
    mongod --dbpath ${install_dir}/db --logpath /tmp/mongod/mongod_log --journal &
    tsx_cmd
  else
    echo "$(expr substr $(uname -s) 1 10)" - not yet supported1
  fi
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
  if [ "$(uname -p)" == "aarch64" ]; then
    echo Linux aarch64_$(uname -p) in ${install_dir}
    # export PATH=${install_dir}/mongodb-osx-x86_64-4.0.0/bin:${install_dir}/node-v8.11.3-linux-arm64/bin:$PATH
    # https://nodejs.org/dist/v8.11.3/node-v8.11.3-linux-armv7l.tar.xz
    mongod --dbpath ${install_dir}/db --logpath /tmp/mongod/mongod_log &
    tsx_cmd
  elif [ "$(uname -p)" == "armv7l" ]  || [ "$(uname -m)" == "armv7l" ] ; then
    echo Linux ARM-32bit_$(uname -p) in ${install_dir}
    mongod --dbpath ${install_dir}/db --logpath /tmp/mongod/mongod_log --journal &
    tsx_cmd
  elif [ "$(uname -p)" == "x86_64" ]; then
    echo Linux x86_64_$(uname -p) in ${install_dir}
    # export PATH=${install_dir}/mongodb-osx-x86_64-4.0.0/bin:${install_dir}/node-v8.11.3-linux-arm64/bin:$PATH
    # https://nodejs.org/dist/v8.11.3/node-v8.11.3-linux-armv7l.tar.xz
    mongod --dbpath ${install_dir}/db --logpath /tmp/mongod/mongod_log &
    tsx_cmd
  else
    echo "$(expr substr $(uname -s) 1 10)" - not yet supported2
  fi
else
    echo "$(expr substr $(uname -s) 1 10)" - not yet supported3
fi
