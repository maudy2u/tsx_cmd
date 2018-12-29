
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
    echo "Restore DB TSX Cmd v1.1"
    echo " *******************************"
    echo ": You need to provide one parameter to build - the file name of "
    echo ": an exported db, export_db.tar"
    echo ": e.g."
    echo ""
    echo " tsx_cmd_db_restore.sh ./export_db.tar"
    echo ""
    echo " *******************************"
    echo ""
    exit 1
fi

echo ""
echo " *******************************"
echo tsx_cmd_db_restore.sh restore an exported "export_db.tar"
echo " *******************************"
echo ""

mkdir -p "${install_dir}/import"
cd "${install_dir}"
tar -xvf ${1} -C ./import
mv ./import/export/meteor ./import/export/tsx_cmd 

mongorestore --drop -d tsx_cmd "${install_dir}/import/export/tsx_cmd"

echo ""
