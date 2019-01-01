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
echo ************************
echo Install SCONS Build tools
sudo apt install scons

echo ************************
echo Create temp build location /tmp/mongod
mkdir -p /tmp/mongo-build
cd /tmp/mongo-build

echo ************************
echo Download the SConscript for ARMv7 32-bit
# wget https://andyfelong.com/wp-content/uploads/2015/12/SConscript
# wget https://gist.github.com/kitsook/f0f53bc7acc468b6e94c/raw/93ebc8dc0adf7afb0a38c1b6bf702f8a8c6b70c2/SConscript
wget https://gist.githubusercontent.com/maudy2u/0b215958fd7317f5a95ffad3db29e263/raw/93ebc8dc0adf7afb0a38c1b6bf702f8a8c6b70c2/SConscript

echo ************************
echo Clone GitHub Mongod v3.0.7 and prep code
git clone --branch "r3.0.7" --depth 1 https://github.com/mongodb/mongo.git
cd mongo
cp ../misc/SConscript src/third_party/v8-3.25/SConscript

echo ************************
echo Build Mongod
#scons --disable-warnings-as-errors --prefix=/tmp/mongo-build --js-engine=mozjs mongod
#scons --disable-warnings-as-errors --prefix=/tmp/mongo-build --js-engine=v8-3.25 mongod
scons -j 2 --wiredtiger=off --js-engine=v8-3.25 --c++11=off --disable-warnings-as-errors CXXFLAGS="-std=gnu++11" core
scons --wiredtiger=off --js-engine=v8-3.25 --c++11=off --disable-warnings-as-errors CXXFLAGS="-std=gnu++11" install

echo ************************
echo "Install mongod: ${install_dir}/mongod"
cp ./build/install/bin/mongos  ${install_dir}/mongos
cp ./build/install/bin/mongoperf  ${install_dir}/mongoperf
cp ./build/install/bin/mongod  ${install_dir}/mongod
cp ./build/install/bin/mongo  ${install_dir}/mongo
