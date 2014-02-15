/**
 * User: Vladimir Bulyga <zero@ccxx.cc>
 * Project: jsdb
 * Date: 15.01.14 22:53
 */

var getAtPath = require('./utils').getAtPath,
    unique = require('./utils').unique;

function Index(data, options) {
    this.name = options.name;
    this.options = options;
    this.data = data;
    this.key = options.key;
    this.createSpool();
    this.ensureIndex();
}

Index.prototype.indexes = {};

Index.prototype.createSpool = function () {
    if (!this.spool) {
        if (this.indexes.hasOwnProperty(this.name)) {
            this.spool = this.indexes[this.name];
        } else {
            this.spool = this.indexes[this.name] = {data: {}};
        }
    }
};

Index.prototype._addToIndex = function (key, item) {
    var index = this.spool.data[key] = this.spool.data[key] || [];
    if (this.options.unique && index.length) {
        throw new Error('duplicate key error index: ' + this.name + '  dup key: { : "' + key + '" }');
    }
    index.push(item);
};

Index.prototype._ensureIndex = function (items) {
    //noinspection JSUnresolvedFunction
    if (items && !Array.isArray(items)) {
        items = [items];
    }
    var key = this.key,
        keys = Object.getOwnPropertyNames(key),
        keysLength = keys.length >>> 0,
        data = items || this.data,
        length = data.length,
        k, i, z, x;
    
    for (i = 0; i < length; i += 1) {
        var item = data[i],
            parts = {};
        for (k = 0; k < keysLength; k += 1) {
            var values = getAtPath(item, keys[k]);
            parts[keys[k]] = values;
        }
        var indexKeys = this._createKeys(parts),
            self = this;
        console.log(indexKeys, parts);
        indexKeys.forEach(function (key) {
            self._addToIndex(key, item);
        });
    }
};

Index.prototype.ensureIndex = function (items) {
    if (this.options.unique) {
        this.spool.unique = true;
    }
    if (this.options.background) {
        setImmediate(this._ensureIndex.bind(this, items));
    } else {
        this._ensureIndex(items);
    }
};

Index.prototype._getIndex = function (key) {
    return this.spool.data[key];
};

Index.prototype._createKeys = function (data) {
    var keys = Object.getOwnPropertyNames(this.key),
        length = keys.length,
        pool = [],
        k;
    for (k = 0; k < length; k += 1) {
        //noinspection JSLint
        var key = keys[k],
            values = data[key].map(function (value) {
                //noinspection JSLint
                switch (true) {
                    case value === null             :
                    case +value === value           :
                    case String(value) === value    :
                    case Boolean(value) === value   :
                        return value;
                    case value instanceof Date      :
                        return value.getTime();
                    case Array.isArray(value)       :
                    case typeof value === 'object'  :
                        return '';
                    default                         :
                        return '';
                }
            });
        
        pool.push(values);
    }

    function matrix(array) {
        var result = [];
        function ck(list, index, prefix) {
            var c;
            if (index === list.length) {
                result.push(prefix);
                return;
            }
            if (!list[index].length) {
                list[index].push('');
            }
            for(c in list[index]) {
                ck(list, index+1, (prefix ? (prefix+":") : '')+list[index][c]);
            }
        }

        ck(array, 0, '');
        return result;
    }
    
    return matrix(pool);
};

Index.prototype.search = function (query) {
    var indexKeys = {},
        keys = Object.getOwnPropertyNames(this.key),
        length = keys.length,
        k;
    
    for (k = 0; k < length; k += 1) {
        var key = keys[k];
        indexKeys[key] = getAtPath(query, key);
    }
    
    var formattedKeys = this._createKeys(indexKeys),
        self = this;
    
    var result = formattedKeys.map(function(key) {
        return self._getIndex(key);
    });
    
    return unique([].concat.apply([], result));
};

exports.Index = Index;