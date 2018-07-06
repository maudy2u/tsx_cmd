#!/bin/bash
# This file us used to prepare a brand new meteor app via meteor create app_name
# alias meteor=$HOME/meteor/meteor

# source: https://andyfelong.com/2018/02/update-mongodb-3-6-on-odroid-c2-with-ubuntu-16-04-3-arm64/
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5
echo "deb [ arch=amd64,arm64,ppc64el,s390x ] http://repo.mongodb.com/apt/ubuntu xenial/mongodb-enterprise/3.6 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-enterprise.list
sudo apt-get update
sudo apt-get upgrade
sudo apt-get install mongodb-enterprise

# INSTALL METEOR
cd ~
git clone --depth 1 --branch release-1.4-universal-beta https://github.com/4commerce-technologies-AG/meteor.git
cd meteor
meteor —version
cd ~
alias meteor=$HOME/meteor/meteor

# CONNECT WORKING VERSION OF MONGODB
mv ~/meteor/dev_bundle/mongodb/bin/mongo ~/meteor/dev_bundle/mongodb/bin/mongo-hide
ln -s /usr/bin/mongo ~/meteor/dev_bundle/mongodb/bin/mongo
mv ~/meteor/dev_bundle/mongodb/bin/mongod ~/meteor/dev_bundle/mongodb/bin/mongod-hide
ln -s /usr/bin/mongod ~/meteor/dev_bundle/mongodb/bin/mongod

