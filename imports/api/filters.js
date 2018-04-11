import { Mongo } from 'meteor/mongo';

// Used to store the filters currently available/active on TSX
export const Filters = new Mongo.Collection('filters');


// *******************************
// Get the filters from TheSkyX
Filters.helpers({

  renderDropDownFilters: function() {
    var filters = Filters.find().fetch();
    var filterArray = [];
    for (var i = 0; i < filters.length; i++) {
      filterArray.push({
        key: filters[i]._id,
        text: filters[i].name,
        value: filters[i].name });
    }
    return filterArray;
  },
  getFilterIndexFor: function(filterName) {
    var filter = Filters.find({name: filterName}).fetch();
    return filter.slot;
  },

});
