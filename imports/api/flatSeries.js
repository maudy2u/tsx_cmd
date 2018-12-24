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
// Used to store the filters currently available/active on TSX
export const FlatSeries = new Mongo.Collection('flatSeries');

import { Random } from 'meteor/random';
import { Seriess } from './seriess.js'
import { TakeSeriesTemplates } from './takeSeriesTemplates.js'
import { TargetSessions } from './targetSessions.js'


/* Flat Series is:
  rotatorPosition: 0,
  enabledActive:false,
  filtergroup: [],
  target_id,
  flatExposures: [
    {name: lum, exposire: value},
    {name: lum, exposire: value},
    {name: lum, exposire: value},
  ]
 */

const defaultFlat = {
  _id: '',
  frame: 'Flat',
  filter: '',
  exposure: 0,
  repeat: 1,
  enabledActive: false,
};

export function   resetStoredFlat( fid ) {

  // Delete the stored flat
  deleteAnyFlatTargets(fid);

  // disable the grid
  updateFlatSeries(
    fid,
    'enabledActive',
    false,
  );

  updateFlatSeries(
    fid,
    'target_id',
    '',
  );
};

export function deleteAnyFlatTargets( fid ) {
  // remove the seriess
  let ids = Seriess.find({takeSeriesTemplate: fid}).fetch();
  for( let i=0;i<ids.length;i++ ) {
    Seriess.remove( ids[i]._id );
  }

  // remove series template
  ids = TakeSeriesTemplates.find( {name: fid} ).fetch();
  for( let i=0;i<ids.length;i++ ) {
    TakeSeriesTemplates.remove( ids[i]._id );
  }

  // remove target
  ids = TargetSessions.find( {name: fid} ).fetch();
  for( let i=0;i<ids.length;i++ ) {
    TargetSessions.remove( ids[i]._id );
  }
};

export function updateFlatSeries( fid, name, value ) {
  var fs = FlatSeries.findOne({_id:fid});
  if( typeof fs != 'undefined') {
    if( name == 'rotatorPosition') {
      fs.rotatorPosition = value;
    }
    else if( name == 'enabledActive') {
      fs.enabledActive = value;
    }
    else if( name == 'filtergroup') {
      fs.filtergroup = value;
    }
    else if( name == 'target_id') {
      fs.target_id = value;
    }
    FlatSeries.update({_id: fs._id}, {
      $set: {
        rotatorPosition: fs.rotatorPosition,
        filtergroup: fs.filtergroup,
        enabledActive: fs.enabledActive,
        target_id: fs.target_id,
      }
    });
  }
}

export function addFlatSeries() {
  var nid = Random.id();
  const id  = FlatSeries.insert(
    {
      rotatorPosition: 0,
      enabledActive:false,
      target_id: '',
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
      else if( name == 'enabledActive') {
        filter.enabledActive = value;
      }
      else if( name == 'target_id') {
        filter.target_id = value;
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

export function flatSeriesDescription( fsid ) {
    var fs = FlatSeries.findOne({_id:fsid});
    let details = "";
    for (let i = 0; i < fs.filtergroup.length; i++) {
      let fg = fs.filtergroup[i];
      if( typeof fg == 'undefined') {
        continue;
      }
      if(details != "") { details += ", "};
      details += fg.filter + '@' + fg.exposure + 'sec x'  + fg.repeat;
    }

    return details;
  }

  export function flatSeriesName( fsid ) {
      var fs = FlatSeries.findOne({_id:fsid});
      let name = "";
      for (let i = 0; i < fs.filtergroup.length; i++) {
        let fg = fs.filtergroup[i];
        if( typeof fg == 'undefined') {
          continue;
        }
        if(name != "") { name += "-"};
        name += fg.filter;
      }
      if( name == '') {
        name = '!New so edit me :)';
      }
      return name;
    }
