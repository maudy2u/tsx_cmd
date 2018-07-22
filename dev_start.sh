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
if [ "$(uname -s)" == "Darwin" ]; then
  if [ "$(uname -p)" == "i386" ]; then
    meteor --settings ./settings.json
  else
    echo $(uname -s) $(uname -p) - Not Supported
    exit 5
  fi
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then

  if [ "$(expr substr $(uname -p) 1 5)" == "aarch64" ]; then
    ~/meteor/meteor --settings ./settings.json
  else
    echo $(uname -s) $(uname -p) - Not Supported
    exit 5
  fi
else
    # Do something under 64 bits Windows NT platform
    echo $(uname -s) $(uname -p) - Not Supported
    exit 5
fi
