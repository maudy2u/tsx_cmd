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
if [ "$(uname)" == "Darwin" ]; then
    echo Mac in ${install_dir}

    # install mongodb
    curl https://fastdl.mongodb.org/osx/mongodb-osx-ssl-x86_64-4.0.0.tgz -o mongodb-osx-ssl-x86_64-4.0.0.tgz
    tar -xvf mongodb-osx-ssl-x86_64-4.0.0.tgz
    rm ${install_dir}/mongodb-osx-ssl-x86_64-4.0.0.tgz

    # install nodejs
    curl https://nodejs.org/dist/v8.11.3/node-v8.11.3-darwin-x64.tar.gz -o node-v8.11.3-darwin-x64.tar.gz
    tar -xvf node-v8.11.3-darwin-x64.tar.gz
    rm ${install_dir}/node-v8.11.3-darwin-x64.tar.gz

    # install tsx__cmd - assumes already downloaded
    tar -xvf tsx_cmd3.tar.gz

    # extracting bundle
    export PATH=${install_dir}/mongodb-osx-x86_64-4.0.0/bin:${install_dir}/node-v8.11.3-darwin-x64/bin:$PATH
    mkdir -p ${install_dir}/db
    export MONGO_URL='mongodb://localhost/tsx_cmd'
    export PORT=3000
    export ROOT_URL='http://127.0.0.1'
    cd ${install_dir}/bundle/programs/server
    npm uninstall fibers
    npm install fibers
    cd ${install_dir}
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    # Do something under GNU/Linux platform
    echo Linux
    # install mongodb
    curl https://fastdl.mongodb.org/osx/mongodb-osx-ssl-x86_64-4.0.0.tgz -o mongodb-osx-ssl-x86_64-4.0.0.tgz
    tar -xvf mongodb-osx-ssl-x86_64-4.0.0.tgz

    # install nodejs
    curl https://nodejs.org/dist/v8.11.3/node-v8.11.3-darwin-x64.tar.gz -o node-v8.11.3-darwin-x64.tar.gz
    tar -xvf node-v8.11.3-darwin-x64.tar.gz

    # install tsx__cmd - assumes already downloaded
    tar -xvf tsx_cmd3.tar

    export PATH=${install_dir}/mongodb-osx-x86_64-4.0.0/bin:${install_dir}/node-v8.11.3-darwin-x64/bin:$PATH
    mkdir -p ${install_dir}/db
    export MONGO_URL='mongodb://localhost/tsx_cmd'
    export PORT=3000
    export ROOT_URL='http://127.0.0.1'
    cd ${install_dir}/bundle/programs/server
    npm uninstall fibers
    npm install fibers
    cd ${install_dir}
elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ]; then
    # Do something under 32 bits Windows NT platform
    Echo windows32
elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW64_NT" ]; then
    # Do something under 64 bits Windows NT platform
    echo windows64
fi
