/*
tsx cmd - A web page to send commands to TheSkyX server
    Copyright (C) 2018  Stephen Townsend

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Mongo } from 'meteor/mongo';
import { Random } from 'meteor/random';

// Used to store the filters currently available/active on TSX
export const FlatSeries = new Mongo.Collection('flatSeries');

const defaultFlat = {
  _id: '',
  frame: 'Flat',
  filter: '',
  exposure: 0,
  repeat: 1,
};

export function updateFlatRotation( fid, name, value ) {
  FlatSeries.update({_id: fid}, {
    $set: {
      rotatorPosition: value,
    }
  });
}

export function addFlatSeries() {
  var nid = Random.id();
  const id  = FlatSeries.insert(
    {
      rotatorPosition: 0,
      filtergroup: [
        {
          _id: nid,
          frame: 'Flat',
          filter: '',
          exposure: 0,
          repeat: 1,
        },
      ]
    },
  );
  return id;
}

export function addFlatFilter(flatSeries_id){
  console.log('flat id: '+flatSeries_id);
  var fs = FlatSeries.findOne({_id:flatSeries_id});
  console.log('FlatSeries: ' + fs.rotatorPosition);
  var fg = fs.filtergroup;
  console.log('filtergroup: ' + fg);
  var nid = Random.id();
  var nf = defaultFlat;
  nf._id=nid;
  fg.push(nf);
  FlatSeries.upsert({_id: fs._id}, {
    $set: {
      filtergroup: fg,
    }
  });
}

export function updateFlatFilter(
  flatSeries_id,
  filter_id,
  name,
  value,
 ){
  var fs = FlatSeries.findOne({_id:flatSeries_id});
  var newgroup = [];
  for( var i=0; i<fs.filtergroup.length; i++ ) {
    var filter = fs.filtergroup[i];
    if( filter._id == filter_id ) {
      if( name == 'frame') {
        filter.frame = value;
      }
      else if( name == 'filter') {
        filter.filter = value;
      }
      else if( name == 'exposure') {
        filter.exposure = value;
      }
      else if( name == 'repeat') {
        filter.repeat = value;
      }
    }
    newgroup.push(filter);
  }
  FlatSeries.upsert({_id: fs._id}, {
    $set: {
      filtergroup: newgroup,
    }
  });
}

export function deleteFlatFilter(flatSeries_id, filter_id ){
  console.log('flat id: '+flatSeries_id);
  var fs = FlatSeries.findOne({_id:flatSeries_id});
  var newgroup = [];
  for( var i=0; i<fs.filtergroup.length; i++ ) {
    var filter = fs.filtergroup[i];
    if( filter._id != filter_id ) {
      newgroup.push(filter);
    }
  }
  FlatSeries.upsert({_id: fs._id}, {
    $set: {
      filtergroup: newgroup,
    }
  });
}
