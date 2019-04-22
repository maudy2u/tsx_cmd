#!/bin/bash
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
# This file us used to prepare a brand new meteor app via meteor create app_name
# alias meteor=$HOME/meteor/meteor

# source: https://andyfelong.com/2018/02/update-mongodb-3-6-on-odroid-c2-with-ubuntu-16-04-3-arm64/
# sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5
# echo "deb [ arch=amd64,arm64,ppc64el,s390x ] http://repo.mongodb.com/apt/ubuntu xenial/mongodb-enterprise/3.6 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-enterprise.list
# sudo apt update
# sudo apt install mongodb-enterprise

# CONNECT WORKING VERSION OF MONGODB
# mv ~/meteor/dev_bundle/mongodb/bin/mongo ~/meteor/dev_bundle/mongodb/bin/mongo-hide
# ln -s /usr/bin/mongo ~/meteor/dev_bundle/mongodb/bin/mongo
# mv ~/meteor/dev_bundle/mongodb/bin/mongod ~/meteor/dev_bundle/mongodb/bin/mongod-hide
# ln -s /usr/bin/mongod ~/meteor/dev_bundle/mongodb/bin/mongod

echo *******************************
install_dir=$(pwd)
os = $(expr substr $(uname -s) 1 5)
arch = $(uname -p)
if [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
  if [ "$(uname -p)" == "aarch64" ]; then
    cd ~
    git clone --depth 1 --branch release-1.4-universal-beta https://github.com/4commerce-technologies-AG/meteor.git
    cd meteor
    ./meteor —version
    cd ~
    alias meteor=$HOME/meteor/meteor

    # REMOVING THIS AS ABOVE RUNS FOR DEV MODE
    # # source: https://andyfelong.com/2018/02/update-mongodb-3-6-on-odroid-c2-with-ubuntu-16-04-3-arm64/
    # #sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5
    # sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 4B7C549A058F8B6B
    # #echo "deb [ arch=amd64,arm64,ppc64el,s390x ] http://repo.mongodb.com/apt/ubuntu xenial/mongodb-enterprise/3.6 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-enterprise.list
    # echo "deb [ arch=amd64,arm64,ppc64el,s390x ] http://repo.mongodb.com/apt/ubuntu xenial/mongodb-enterprise/4.1 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-enterprise.list
    # sudo apt update -y
    # # sudo apt install mongodb-enterprise -y
    # sudo apt install mongodb-server-core:arm64 -y
    #
    # # CONNECT WORKING VERSION OF MONGODB
    # mv ~/meteor/dev_bundle/mongodb/bin/mongo ~/meteor/dev_bundle/mongodb/bin/mongo-hide
    # ln -s /usr/bin/mongo ~/meteor/dev_bundle/mongodb/bin/mongo
    # mv ~/meteor/dev_bundle/mongodb/bin/mongod ~/meteor/dev_bundle/mongodb/bin/mongod-hide
    # ln -s /usr/bin/mongod ~/meteor/dev_bundle/mongodb/bin/mongod
  elif [ "$(uname -p)" == "armv7l" ]; then
    cd ~
    #export GIT_SSL_NO_VERIFY=1
    git clone --depth 1 https://github.com/4commerce-technologies-AG/meteor.git
    cd meteor
    ./meteor --version
    cd ~
    alias meteor=$HOME/meteor/meteor
  elif [ "$(uname -p)" == "x86_64" ]; then
    cd ~
    curl https://install.meteor.com/ | sh
    ./meteor --version
    cd ~
  else
    echo "$(expr substr $(uname -s) 1 10)" - not yet supported
    exit 5
  fi
else
    echo "$(expr substr $(uname -s) 1 10)" - not yet supported
    exit 5
fi
