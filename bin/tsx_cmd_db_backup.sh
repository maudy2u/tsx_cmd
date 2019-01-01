
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

echo ""
echo " *******************************"
echo dev_export_db.sh created an export of the db as export_db.tar
echo " *******************************"
echo ""

mongodump --uri=mongodb://127.0.0.1:3001/meteor -o ./export --gzip  --excludeCollectionsWithPrefix=MeteorToys
tar -cf export_db.tar ./export
rm -rf ./export

echo "CREATED: export_db.tar "
echo ""
