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

git config --global user.email "abordercollie@gmail.com"
git config --global user.name "Stephen"

git clone ssh://stephen@10.9.8.10/git/tsx_cmd

cd tsx_cmd

git branch --set-upstream-to=origin/develop

git pull ssh://stephen@10.9.8.10/git/tsx_cmd develop

git pull
