"use strict";
var     events = require('events'),
         utils = require('./utils'),
          util = require('util'),
          Item = require('./item').Item,
            QC = require('./queryCompiler').QueryCompiler,
       methods = require('./methods'),
     getAtPath = utils.getAtPath,
        extend = utils.extend,
         clone = utils.clone;

function CursorStream(cursor) {
    this.cursor = cursor;
    this.colection = cursor.collection;
    this.collectionName = cursor.collectionName;
    this.options = cursor.options;
    this.query = cursor.options.query;
    this.inspect = function() {
        return '{"cursorStream": "' + this.collectionName +'"}';
    };
    events.EventEmitter.call(this);
}

util.inherits(CursorStream, events.EventEmitter);

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
    this.options.skip = this.options.skip || 0;
    this.options.limit = this.options.limit || Infinity;
    this.query = options.query;
    this.compiledQuery = new QC(this, this.query, methods.$query);
    this.result = null;
    this.items = [];
    this.indexItems = indexItems || [];
    this.inspect = function() {
        return '{"cursor": "' + this.collectionName +'"}';
    };
    if (options.stream) {
        this.stream = new CursorStream(this);
        process.nextTick(function() {
            self.calculate();
        });
        return this.stream;
    }
}

function filter(array, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {limit: Infinity, map: false};
    }
    var result = [],
        unique = {},
        length = 0;
    
    //noinspection JSLint
    array = Object(array);
    //noinspection JSLint
    var iLength = array.length >>> 0,
        i;
    
    for (i =0; i < iLength; i++) {
        if (length >= options.limit) {
            break;
        }
        var map = callback.call(callback, array[i], i, array);
        if (map) {
            if (options.unique) {
                if (unique[array[i][options.unique]]) {
                    continue;
                }
                unique[array[i][options.unique]] = true;
            }
            result.push(options.map ? map : array[i]);
            length++;
        }
    }
    return result;
}

Cursor.prototype = {
    calculate       :   function() {
        var self = this,
            data = this.collection.data,
            sortCache = [],
            searchCache = {},
            result = [];
        this.items.splice(0);
        if (this.indexItems.length && this.indexItems.length <= data.length) {
            data = this.indexItems;
        }
        
        function sort(criteria) {
            function getValue(data) {
                if (Array.isArray(data)) {
                    return getValue(data[0]);
                }
                if ({}.toString.call(data)) {
                    return '';
                }
                return data;
            }
            function weight(item) {
                if (sortCache[item]) {
                    return sortCache[item];
                }
                var w = [],
                    path;
                for (path in criteria) {
                    var level = criteria[path],
                        value = item.getAtPath(path);
                    if (Array.isArray(value)) {
                        value = value[0];
                    }
                    w.push({
                        level : level,
                        value : value
                    });
                }
                sortCache[item] = w;
                return w;
            }
            return function (a, b) {
                var x = weight(a),
                    y = weight(b),
                    z = 0,
                    i;
                for (i in x) {
                    if (x[i].level > 0) {
                        z += ((x[i].value < y[i].value) ? -1 : ((x[i].value > y[i].value) ? 1 : 0));
                    }
                    if (x[i].level < 0) {
                        z +=((y[i].value < x[i].value) ? -1 : ((y[i].value > x[i].value) ? 1 : 0));
                    }
                }
                return z < 0 
                    ? -1 
                    : z > 0 
                        ? 1 
                        : 0;
            };
        }

/*
        this.items = filter(data, {limit: this.options.limit, map:1, unique: true}, function(item) {
            if (self.compiledQuery.execute(item) !== true) return false;
            var resultData = item.project(self.options.columns);
//            return resultData;
            if (!searchCache[item]) {
                searchCache[item] = extend({}, resultData);
                result.push(searchCache[item]);
                if (self.options.stream && !self.options.sort) {
                    self.stream.emit('data', item, searchCache[item]);
                }
            }
        });
        
*/
        var i;
        for (i in data) {
            if (!this.options.sort && result.length > this.options.limit-1) {
                break;
            }
            if (this.compiledQuery.execute(data[i]) !== true) {
                continue;
            }
            
            var resultData = data[i].project(this.options.columns);

            if (!searchCache[data[i]]) {
                this.items.push(data[i]);
                searchCache[data[i]] = extend({}, resultData);
                result.push(searchCache[data[i]]);
                if (this.options.stream && !this.options.sort) {
                    this.stream.emit('data', data[i], searchCache[data[i]]);
                }
            }
        }

        if (this.options.sort) {
            this.items.sort(sort(this.options.sort));
            result = [];
            var items = this.items = this.items.slice(this.options.skip, this.options.skip+this.options.limit);
            for (i in items) {
                if (this.options.stream) {
                    this.stream.emit('data', data[i], searchCache[items[i]]);
                }
                if (result.length > this.options.limit -1) break;
                result.push(searchCache[items[i]]);
            }
        }

        if (this.options.stream) {
            this.stream.emit('end');
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
    limit           :   function(n) {this.options.limit = n || Infinity; return this;},
    sort            :   function(sort) {this.options.sort = sort; return this;},
    skip            :   function(skip) {this.options.skip = skip; return this;},
    find            :   function(query, columns, options, callback) {
        options = options || {};
        var collection = this.collection.new('subCollection.'+this.collectionName, {fake: true});
        if (!this.result) this.calculate();
        collection.insert(this.items);
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
            utils.forAllItems(subItems, function(item) {
                subCollection.insert(item);
            });
        });

        return subCollection;
    }
};

exports.Cursor = Cursor;