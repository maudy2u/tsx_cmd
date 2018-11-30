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
export const Filters = new Mongo.Collection('filters');

/*
  _id
  name
  slot
  flat_exposure
 */

export const subFrameTypes = [
  'Light',
  'Flat',
  'Dark',
  'Bias',
];

export function renderDropDownFilters() {
  var filters = Filters.find().fetch();
  var filterArray = [];
  for (var i = 0; i < filters.length; i++) {
    filterArray.push({
      key: filters[i]._id,
      text: filters[i].name,
      value: filters[i].name });
  }
  return filterArray;
};

// *******************************
// Get the filters from TheSkyX
Filters.helpers({

  getFilterIndexFor: function(filterName) {
    var filter = Filters.find({name: filterName}).fetch();
    return filter.slot;
  },

});
