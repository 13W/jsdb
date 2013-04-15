"use strict";
var     events = require('events'),
         utils = require('./utils'),
          util = require('util'),
          Item = require('./item').Item,
     getAtPath = utils.getAtPath,
        extend = utils.extend,
         clone = utils.clone;

//noinspection FunctionWithInconsistentReturnsJS
function Cursor(collection, indexItems, options) {
    if (!options && !Array.isArray(indexItems)) {
        options = indexItems || {};
        indexItems = [];
    }
    var self = this;
    this.collection = collection;
    this.collectionName = collection.collectionName;
    this.options = options;
    this.query = options.query;
    this.result = null;
    this.items = [];
    this.indexItems = indexItems || [];
    this.inspect = function() {return '{"cursor": "' + this.collectionName +'"}'};
    if (options.stream) {
        this.stream = new CursorStream(this);
        process.nextTick(function() {
            self.calculate();
        });
        return this.stream;
    }
}

function CursorStream(cursor) {
    this.cursor = cursor;
    this.colection = cursor.collection;
    this.collectionName = cursor.collectionName;
    this.options = cursor.options;
    this.query = cursor.options.query;
    this.inspect = function() {return '{"cursorStream": "' + this.collectionName +'"}'};
    events.EventEmitter.call(this);
}

util.inherits(CursorStream, events.EventEmitter);

Cursor.prototype = {
    projectionFuncs :   {
        $matchAll   :   function(data, value, property, object, self) {
            if (!Array.isArray(data)) return void 0;
            var result = [];
            for (var i in data) {
                var item = data[i].subItem(i);//new Item(data[i], object);
                if (item.check(value, self)) result.push(data[i]);
            }
            return result;
        },
        $           :   function(data, value) {
            if (!Array.isArray(data)) return void 0;
            return data[value];
        },
        $slice      :   function(data, value) {
            if (!Array.isArray(data)) return void 0;
            if (!(Array.isArray(value) && value.length === 2)) return void 0;
            var start = value[0], length = value[1];
            return data.slice(start, length);
        }
        
    },
    aggregationFuncs:   {
        $add: function(data, value, property, object, self) {},
        $addToSet: function(data, value, property, object, self) {},
        $and: function(data, value, property, object, self) {},
        $avg: function(data, value, property, object, self) {},
        $cmp: function(data, value, property, object, self) {},
        $concat: function(data, value, property, object, self) {},
        $cond: function(data, value, property, object, self) {},
        $dayOfMonth: function(data, value, property, object, self) {},
        $dayOfWeek: function(data, value, property, object, self) {},
        $dayOfYear: function(data, value, property, object, self) {},
        $divide: function(data, value, property, object, self) {},
        $eq: function(data, value, property, object, self) {},
        $first: function(data, value, property, object, self) {},
        $geoNear: function(data, value, property, object, self) {},
        $group: function(data, value, property, object, self) {},
        $gt: function(data, value, property, object, self) {},
        $gte: function(data, value, property, object, self) {},
        $hour: function(data, value, property, object, self) {},
        $ifNull: function(data, value, property, object, self) {},
        $last: function(data, value, property, object, self) {},
        $limit: function(data, value, property, object, self) {},
        $lt: function(data, value, property, object, self) {},
        $lte: function(data, value, property, object, self) {},
        $match: function(data, value, property, object, self) {},
        $max: function(data, value, property, object, self) {},
        $millisecond: function(data, value, property, object, self) {},
        $min: function(data, value, property, object, self) {},
        $minute: function(data, value, property, object, self) {},
        $mod: function(data, value, property, object, self) {},
        $month: function(data, value, property, object, self) {},
        $multiply: function(data, value, property, object, self) {},
        $ne: function(data, value, property, object, self) {},
        $not: function(data, value, property, object, self) {},
        $or: function(data, value, property, object, self) {},
        $project: function(data, value, property, object, self) {},
        $push: function(data, value, property, object, self) {},
        $second: function(data, value, property, object, self) {},
        $skip: function(data, value, property, object, self) {},
        $sort: function(data, value, property, object, self) {},
        $strcasecmp: function(data, value, property, object, self) {},
        $substr: function(data, value, property, object, self) {},
        $subtract: function(data, value, property, object, self) {},
        $sum: function(data, value, property, object, self) {},
        $toLower: function(data, value, property, object, self) {},
        $toUpper: function(data, value, property, object, self) {},
        $unwind: function(data, value, property, object, self) {},
        $week: function(data, value, property, object, self) {},
        $year: function(data, value, property, object, self) {}
    },
    calculate       :   function() {
        var data = this.collection.data,
            query = this.query,
            result = [];
        this.items.splice(0);
        if (this.indexItems.length && this.indexItems.length <= data.length) data = this.indexItems;
        console.inspect(query, data === this.indexItems, this.collection.data.length, this.indexItems.length);
        for (var i in data) {
            if (!this.options.sort && this.options.limit-1 < result.length) break;
            if (!data[i].check) console.inspect(data[i]);
            var filterResult = data[i].check(query, this),
                resultData = data[i].get();
            
//            console.inspect(data[i], query, filterResult);
            if (!filterResult) continue;
            if (this.options.stream) {
                this.stream.emit('data', data[i]);
                continue;
            }
            if (this.options.columns) {
                resultData = {};
                for (var column in this.options.columns) {
                    var display = this.options.columns[column];

                    if (/\.\$$/.test(column)) {
                        column = column.substr(0, column.length-2);
                        display = {$: display};
                    }

                    if (display <= 0) continue;

                    var objPtr = data[i].getAtPath(column);
                    if ({}.toString.call(display) === '[object Object]') {
                        for (var key in display) {
                            if (this.projectionFuncs[display])
                                objPtr = this.projectionFuncs[display].call(this.projectionFuncs, objPtr, display[key], display, data[i], this);
                        }
                    }

                    if (typeof objPtr === 'undefined') continue;
                    
                    var ptr = getAtPath(column, resultData, {create: true}),
                        ptrData = ptr[0].previous,
                        ptrKey = ptr[0].key;
                    ptrData[ptrKey] = objPtr;
                }
            }
            if (!~this.items.indexOf(data[i])) {
                this.items.push(data[i]);
                result.push(extend({}, resultData));
            }
        }
        if (this.options.stream) {
            this.stream.emit('end');
            return;
        }
        
        if (this.options.sort) {
            //TODO: sort results
            if (this.options.limit) {
                result = result.slice(0, this.options.limit);
                this.items.splice(this.options.limit);
            }
        }
        
        this.result = result;
    },
    count           :   function(callback) {
        if (!this.result) this.calculate();
        return typeof callback === 'function' ? callback(null, this.result.length) : this.result.length;
    },
    toArray         :   function(callback) {
        if (!this.result) this.calculate();
        return typeof callback === 'function' ? callback(null, this.result) : this.result;
    },
    forEach         :   function(callback) {
        if (!this.result) this.calculate();
        var data = this.options.items ? this.items : this.result;
        for(var i in data) callback(data[i], i);
    },
    map             :   function(callback) {
        if (!this.result) this.calculate();
        return this.result.map(callback);
    },
    limit           :   function(n) {this.options.limit = n || Infinity},
    sort            :   function(sort) {this.options.sort = sort},
    find            :   function(query, columns, options, callback) {
        options = options || {};
        options.fake = true;
        var collection = this.collection.new('subCollection.'+this.collectionName, options);
        if (!this.result) this.calculate();
        collection.data = this.items;
        return collection.find(query, columns, options, callback);
    },
    subCollection   :   function(path, options) {
        if (!this.result) this.calculate();
        var subCollection = this.collection.new('subCollection.' + this.collectionName, {fake: true}),
            filter = {},
            column = {};
        filter[path] = {$exists: true};
        column[path] = 1;
        options = options || {};
        options.items = true;
        
        this.find(filter, column, options).forEach(function(e) {
            var subItems    = e.subItem(path);
            if (!subItems) return;
            if (!Array.isArray(subItems) && !Array.isArray(subItems.get())) {
                subCollection.data = subCollection.data.concat(subItems);
                return;
            }
            if (!Array.isArray(subItems) && Array.isArray(subItems.get())) {
                for (var i in subItems.get()) {
                    subCollection.data = subCollection.data.concat(subItems.subItem(i));
                }
                return;
            }
            
            if (subItems) subCollection.data = subCollection.data.concat(subItems);
        });

        return subCollection;
    }
};

exports.Cursor = Cursor;