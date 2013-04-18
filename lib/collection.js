"use strict";

var       Item = require('./item').Item,
         utils = require('./utils'),
        Cursor = require('./cursor').Cursor,
       Storage = require('./storage').Storage,
     getAtPath = utils.getAtPath,
        extend = utils.extend,
         clone = utils.clone;


function Collection(collectionName, options) {
    options = options || {};
    var self = this;
    self.options = options;
    self.dbName = 'test';
    self.collectionName = collectionName;
    self.data = options.fake ? [] : Storage.get(collectionName);
    self.Storage = Storage;
    self.inspect = function() {return '{"collection": "' + collectionName +'"}'};
    self._index = {};
    self.setDb = function(db) {
        self.db = db;
        self.indexes = this.db.getCollection('system.indexes');
    };
}

Collection.prototype = {
    new             :   function(collectionName, options) {
        return this.db.createCollection(collectionName, options);
    },
    aggregate       :   function(pipeline, callback) {
        
    },
    distinct        :   function() {},
    drop            :   function() {
        self.db.dropCollection(this.collectionName);
    },
    dropIndex       :   function(index) {
        var indexKeys = this._index[index];
        this.indexes.remove({ns: this.getFullName(), name: index});
        for (var key in indexKeys) {
            var items = indexKeys[key];
            for (var i in items) delete items[i].__links.indexes[index+'::'+key];
            delete indexKeys[key];
        }
    },
    dropIndexes     :   function() {
        this.resetIndexCache();
        this.indexes.remove();
    },
    _indexName      :   function(keys) {
        return Object.keys(keys).sort().map(function(p) {return p.replace(/\./g, '_')}).join('_');
    },
    ensureIndex     :   function(keys, config) {
        config = config || {};
        var self = this,
            name = config.name || self._indexName(keys);
        self.indexes.save({
            v: 1,
            ns: self.getFullName(),
            key: keys,
            name: name,
            background: true
        });
    },
    find            :   function(query, columns, options, callback) {
        query = query || {};
        options = options || {};
        if (/^system/.test(this.collectionName)) {
            options.withoutIndex = true;
        }
        if (!options.withoutIndex) {
            var indexItems = this._indexSearch(query);
        }
        var defaultOptions = {
                limit: Infinity
            },
            cursor = new Cursor(this, indexItems, extend({}, defaultOptions, options, {
                query   : query,
                columns : columns
            }));
        
        if (!options.stream && typeof callback === 'function') return callback(null, cursor);
        return cursor;
    },
    findAndModify   :   function(params, opts, callback) {
        if (typeof opts === 'function') {
            callback = opts;
            opts = {};
        }
        /** @namespace params.fields */
        var self = this,
            query = params.query,
            sort = params.sort,
            remove = params.remove,
            update = params.update,
            modified = params.new || false,
            fields = params.fields || false,
            options = {
                items: true,
                stream: !opts.sync,
                sync: !!opts.sync,
                sort: sort
            },
            result = [];
        
        function processFindAndModify(item, data) {
            if (remove) self.remove(item);
            else
            if (update) {
                self.update(item, update);
                if (modified) {
                    if (fields)
                        data = item.project(fields);
                    else
                        data = item.get();
                }
            }
            result.push(data);
        }
        
        var stream = self.find(query, !modified && fields || false, options);
        if (options.sync) {
            stream.forEach(processFindAndModify);
            return result;
        } else {
            stream.on('data', processFindAndModify);
            stream.on('end', function() {
                if (typeof callback === 'function') callback(null, result);
            });
        }
        return this;
    },
    findOne         :   function (query, columns, options) {
        var result = this.find(query, columns, extend({}, options, {limit: 1})).toArray();
        return result && result[0] || null; 
    },
    getDB           :   function() {
        return this.db;
    },
    getFullName     :   function() {
        return [this.db.name, this.collectionName].join('.')
    },
    getIndexKeys    :   function() {
        return this.getIndexes().map(function (i) {return i.key;});
    },
    getIndexes      :   function() {
        return this.getDB().getCollection("system.indexes").find({ns:this.getFullName()}).toArray();
    },
    getIndices      :   function() {
        return this.getDB().getCollection("system.indexes").find({ns:this.getFullName()}).toArray();
    },
    getName         :   function() {
        return this.collectionName;
    },
    group           :   function(params, opts, callback) {
        if (typeof opts === 'function') {
            callback = opts;
            opts = {};
        }
        /** @namespace params.keyf */
        /** @namespace params.cond */
        /** @namespace params.finalize */
        var self = this,
            reduce = params.reduce,
            initial = params.initial,
            keyf = params.keyf,
            key = !keyf && params.key,
            cond = params.cond || {},
            finalize = params.finalize,
            options = {
                items: true,
                stream: !opts.sync,
                sync: !!opts.sync
            },
            cache = {},
            result = {
                retval: [],
                count: 0,
                keys: 0,
                ok: 0
            };
        if (typeof reduce !== 'function') throw new Error('reduce has to be set');
        if (finalize && typeof finalize !== 'function') throw new Error('finalize has to be an function');
        if (keyf && typeof keyf !== 'function') throw new Error('keyf has to be an function');
        if (!(key || keyf)) throw new Error('key has to be set');
        if ({}.toString.call(key) !== '[object Object]') throw new Error('key has to be an object');
        if ({}.toString.call(initial) !== '[object Object]') throw new Error('initial has to be an object');
        function group(item, data) {
            result.count++;
            var object, deepKey;
            if (typeof keyf === "function") object = keyf(data);
            else object = item.project(key);
            deepKey = utils.deepKeyHash(object);
            cache[deepKey] = cache[deepKey] || {
                object: object,
                initial: utils.clone(initial)
            };
            reduce(data, cache[deepKey].initial);
        }
        
        function prepareResult() {
            for (var key in cache) {
                var data = cache[key],
                    object = utils.extend(data.object, data.initial);
                if (typeof finalize === 'function') finalize(object);
                result.retval.push(object);
                result.keys++;
            }
            result.ok=1;
        }
        
        var stream = self.find(cond, {}, options);
        if (options.sync) {
            stream.forEach(function(item) {
                group(item, item.get());
            });
            prepareResult();
            if (typeof callback === 'function') return callback(null, result);
            return result;
        } else {
            stream.on('data', group);
            stream.on('end', function() {
                prepareResult();
                if (typeof callback === 'function') callback(null, result);
            })
        }
        return void 0;
    },
    insert          :   function(data, callback) {
        var self = this;
        self.Storage.insert(this.collectionName, data, function(error, item) {
            self._addToIndex(item);
            if (typeof callback === 'function') callback(error, item);
        });
    },
    mapReduce       :   function(map, reduce, options, callback) {
        options = options || {};
        /** @namespace params.keyf */
        /** @namespace params.cond */
        /** @namespace params.finalize */
        var self = this,
            query = options.query || {},
            sort = options.sort,
            limit = options.limit,
            finalize = options.finalize,
            scope = options.scope || {},
            out = options.out,
            findOptions = {
                items: true,
                stream: !options.sync,
                sync: !!options.sync,
                sort: sort,
                limit: limit
            },
            cache = {},
            result = [];
        
        scope.emit = function(key, value) {
            var hashKey = utils.deepKeyHash(key);
            cache[hashKey] = cache[hashKey] || {
                key: key,
                values: []
            };
            cache[hashKey].values.push(value);
        };
        
        function mapFunction() {
            var func = (new Function('return new Function("'+Object.keys(scope).join('", "')+'", "return '+(map+"").replace(/\n/g, '')+'")'))();
            var args = [];
            for(var k in scope) args.push(scope[k]);
            return function(data) {
                func.apply(null, args).call(data);
            }
        }
        
        function prepareResult() {
            for (var i in cache) {
                var data = cache[i],
                    key = data.key,
                    value = reduce(key, data.values);
                if (typeof finalize === 'function') value = finalize(key, value);
                value = {
                    _id: key,
                    value: value
                };
                result.push(value);
            }
        }
        function done() {
            if (out) {}
            prepareResult();
            if (typeof callback === 'function') {
                callback(null, result);
                return void(0);
            }
            return true;
        }
        var stream = self.find(query, {}, findOptions),
            mapper = mapFunction();
        if (options.sync) {
            stream.forEach(function(item) {
                mapper(item.get());
            });
            return done() && result;
        } else {
            stream.on('data', function(item, data) {
                mapper(data);
            });
            stream.on('end', done);
        }
        return void 0;

    },
    _updateIndex    :   function(item) {
        this._delFromIndex(item);
        this._addToIndex(item);
    },
    _delFromIndex   :   function(item) {
        var itemIndexes = item.__links.indexes;  
        if (!itemIndexes) return;
        
        for (var index in itemIndexes) {
            var indexArray = itemIndexes[index],
                itemIndex = indexArray.indexOf(item);
            indexArray.splice(itemIndex, 1);
            if (!indexArray.length) delete itemIndexes[index];
        }
        
    },
    _toStringValue  :   function(data) {
        if (Array.isArray(data)) return 'array';
        if ({}.toString.call(data) === '[object Object]') return 'object';
        if ({}.toString.call(data) === '[object Date]') return data.getTime();
        return data;
    },
    _createKeys     :   function(array) {
        var result = [];
        function ck(list, index, prefix) {
            if (index == list.length) {
                result.push(prefix);
                return;
            }
            for(var c in list[index]) ck(list, index+1, (prefix ? (prefix+"_") : '')+list[index][c]);
        }

        ck(array, 0, '');
        return result;
    },
    _addToIndex     :   function(item) {
        var self = this,
            indexes = self.getIndexes();

        function appendToIndex(index, indexKeys, item) {
            var indexName = index.name || self._indexName(index.key);
            for (var i in indexKeys) {
                var indexKeyName = indexKeys[i];
                self._index[indexName] = self._index[indexName] || {};
                self._index[indexName][indexKeyName] = self._index[indexName][indexKeyName] || [];
                
                if (!~self._index[indexName][indexKeyName].indexOf(item)) {
                    self._index[indexName][indexKeyName].push(item);
                    var itemIndex = item.__links.indexes = item.__links.indexes || {};
                    itemIndex[indexName + '::' + indexKeyName] = self._index[indexName][indexKeyName];
                }
            }
        }

        function createIndex(data) {
            for(var i in indexes) {
                var values = [];
                for (var key in indexes[i].key) {
                    var value = [];
                    utils.forAllItems(data.subItem(key), function(item) {
                        value.push(self._toStringValue(item.get()));
                    });
                    values.push(value);
                }
                appendToIndex(indexes[i], self._createKeys(values), data);
            }
        }
        
        createIndex(item);
    },
    _indexSearch    :   function(query) {

        var self = this,
            keys = {},
            indexWeight = {},
            fullIndexes = [],
            indexes = self.getIndexes(),
            index = self._index,
            items = [],
            key, i;

        function collectKeys(query, path) {
            path = path || '';

            if (!(Array.isArray(query) || {}.toString.call(query) === "[object Object]") && path) {
                keys[path] = keys[path] || [];
                keys[path].push(query);
            } else
                for (var key in query) {
                    var value = query[key];

                    if (/^\$(?:in|all|or|and|elemMatch)$/.test(key)) {
                        for (i in value) collectKeys(value[i], path);
                        continue;
                    }
                    if (Array.isArray(value)) {
                        for (i in value) collectKeys(value[i], path);
                    }
                    path = (path && path + '.') + key;
                    if ({}.toString.call(value) === '[object Object]') {
                        collectKeys(value, path);
                        continue;
                    }
                    keys[path] = keys[path] || [];
                    keys[path].push(query[key]);
                }
            return keys;
        }

        collectKeys(query);
        for (i in indexes) {
            var searchIndex = indexes[i];
            for (key in searchIndex.key) {
                indexWeight[searchIndex.name] = indexWeight[searchIndex.name] || {
                    length: 0,
                    keys: [],
                    values: [],
                    name: searchIndex.name
                };
                if (key in keys) {
                    indexWeight[searchIndex.name].keys.push(key);
                    indexWeight[searchIndex.name].values.push(keys[key]);
                }
                indexWeight[searchIndex.name].length++;
            }
            if (indexWeight[searchIndex.name].keys.length === indexWeight[searchIndex.name].length) {
                fullIndexes.push(indexWeight[searchIndex.name]);
            }
        }
        
        for (i in fullIndexes) {
            var name = fullIndexes[i].name,
                itemKeyName = self._createKeys(fullIndexes[i].values);

            for (key in itemKeyName) {
                var indexItems = index[name] && index[name][itemKeyName[key]];
                if (!indexItems) continue;
                for (i in indexItems) {
                    items = items.concat(indexItems[i]);
                    if (items.length > self.data.length) return [];
                }
            }
        }
        return items;
    },
    reIndex         :   function() {
        var stream = this.find({}, {}, {
            items: true,
            stream: true
        });
        stream.on('data', function(item) {
            item.__links.indexes = {};
            this._addToIndex(item);
        });
    },
    remove          :   function(query, options, callback) {
        var self = this;
        
        function removeItem(item) {
            self._delFromIndex(item);
            self.Storage.remove(self.collectionName, item);
        }
        
        if (query instanceof Item) return removeItem(query);
        if (!query) return self.Storage.flush(self.collectionName);
        if (!callback && typeof options === 'function') {
            callback = options;
            options = {};
        }
        options = options || {};
        options.items = true;
        options.stream = !options.sync;
        var stream = self.find(query, {}, options);
        if (options.sync) {
            stream.forEach(removeItem);
            if (typeof callback === 'function') callback();
        } else {
            stream.on('data', removeItem);
            stream.on('end', function() {
                if (typeof callback === 'function') callback();
            });
        }
        return void 0;
    },
    renameCollection:   function(name) {
        this.Storage.renameCollection(this.collectionName, name);
        this.collectionName = name;
    },
    resetIndexCache :   function() {
        var index = this._index;
        for (var name in index) {
            var indexKeys = index[name];
            for (var key in indexKeys) {
                var items = indexKeys[key];
                for (var i in items) delete items[i].__links.indexes;
                indexKeys[key].splice(0);
            }
        }
    },
    save            :   function(data, callback) {
        var self = this;
        self.Storage.insert(this.collectionName, data, function(error, item) {
            self._addToIndex(item);
            if (typeof callback === 'function') callback(error, item);
        });
    },
    update          :   function(query, update, options, callback) {
        var self = this;
        
        function updateItem(item) {
            item.update(update, stream);
            self._updateIndex(item);
        }
        if (query instanceof Item) return updateItem(query);
        
        if (!query) return self.Storage.flush(self.collectionName);
        options = options || {};
        options.items = true;
        /** @namespace options.sync */
        options.stream = !options.sync;
        var stream = self.find(query, false, options);
        if (options.sync) {
            stream.forEach(updateItem)
        } else {
            stream.on('data', updateItem);
            if (typeof callback === 'function')
                stream.on('end', callback);
        }
        return void 0;
    },
    validate        :   function() {
        
    }
};

exports.Collection = Collection;
