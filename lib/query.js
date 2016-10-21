/**
 * Created by zero on 21.10.16.
 */
'use strict';

const common = require('./common'),
    search = common.search,
    getFirstKey = common.getFirstKey;

function Query(query) {
    if (!(this instanceof Query)) {
        return new Query(query);
    }

    this.query = query;
    this.flow = [];
    this.init(Object.assign({}, query));
}

Query.prototype.init = function (query) {
    for (var key in query) {
        if (!query.hasOwnProperty(key)) {
            continue;
        }
        this.compile(key, query);
    }
};

Query.prototype.compile = function compile(key, query) {
    var operator,
        options,
        args = [];

    if (key[0] === '$') {
        if (!this[key]) {
            throw new Error('Path couldn\'t contain $ in itself');
        }
        operator = key;
        options = query[key];
        key = undefined;
    }

    if (!operator) {
        operator = '$match';
        args = [key, query[key]];
    } else {
        args = [options, query];
    }

    this.flow.push({operator, args, validator: this[operator](...args)});
};

Query.prototype.execute = function execute(entry) {
    return this.flow.every(operation => {
        var result = operation.validator(entry);
        if (!result) {
            // console.error(`Failed on ${operation.operator}`, entry, ...operation.args);
        }

        return result;
    });
};

Query.prototype.$exists = function $exists(options) {
    return data => !!data === !!options;
};

Query.prototype.$gt = function $gt(value) {
    return data => data > value;
};

Query.prototype.$gte = function $gt(value) {
    return data => data >= value;
};

Query.prototype.$lt = function $gt(value) {
    return data => data < value;
};

Query.prototype.$lte = function $gt(value) {
    return data => data <= value;
};

Query.prototype.$eq = function $eq(value) {
    return data => data === value;
};

Query.prototype.$and = function $and(array) {
    var operations = array.map(query => new Query(query));
    return data => operations.every(query => query.execute(data));
};

Query.prototype.$all = Query.prototype.$and;

Query.prototype.$or = function $or(array) {
    var operations = array.map(query => new Query(query));
    return data => operations.some(query => query.execute(data));
};

Query.prototype.$not = function $not(query) {
    query = new Query(query);
    return data => !query.execute(data);
};

Query.prototype.$in = function $in(array) {
    return data => array.some(entry => entry === data);
};

Query.prototype.$nin = function $nin(array) {
    return data => array.every(entry => entry !== data);
};

Query.prototype.$ne = function $ne(value) {
    return data => data !== value;
};

Query.prototype.$nor = function $nor(array) {
    var operations = array.map(query => new Query(query));
    return data => operations.every(query => !query.execute(data));
};

Query.prototype.$size = function $size(size) {
    return data => data && data.length >>> 0 === size;
};

Query.prototype.$mod = function $mod(array) {
    return data => data % array[0] === array[1];
};

Query.prototype.$regex = function $regex(pattern, options) {
    var $options = options ? options.$options : '',
        regex = new RegExp(pattern, $options);
    return data => regex.exec(data);
};

Query.prototype.$text = function $text() {
    // not implemented yet
    return data => false;
};

Query.prototype.$type = function $type() {
    // not implemented yet
    return data => true;
};

Query.prototype.$where = function $where(comprator) {
    var func = new Function('try {return ' + comprator + '} catch(e) {return false}');
    return data => func.call(data);
};

Query.prototype.$elemMatch = function $elemMatch(params) {
    var query = new Query(params);
    return data => {
        return (data.forEach ? data : [data]).some(data => query.execute(data));
    };
};

Query.prototype.toString = function toString() {
    return JSON.stringify(this.query);
};

Query.prototype.$match = function $match(key, value) {
    var query;
    if (value !== null && typeof key === 'object') {
        query = new Query(key);
        value = key;
        key = null;
    } else {
        var firstKey = getFirstKey(value);
        if (firstKey && firstKey[0] === '$') {
            if (!this[firstKey]) {
                throw new Error(`Operation "${firstKey}" is not defined.`);
            }
            query = new Query(value);
        }
    }

    var comparator = (data, key) => {
        if (key) {
            var searchResult = search(key, data);
            data = searchResult.value;
            if (searchResult.key === '$' && Array.isArray(data)) {
                return data.some(entry => comparator(entry, searchResult.incompletePath));
            }
        }

        if (query) {
            return query.execute(data);
        }

        if (value === null || typeof value !== 'object') {
            return data === value;
        }

        return false;
    };

    return data => comparator(data, key);
};

module.exports = Query;
