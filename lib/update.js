/**
 * Created by zero on 21.10.16.
 */
'use strict';
const common = require('./common'),
    search = common.search;

function Update(query, options) {
    if (!(this instanceof Update)) {
        return new Update(query);
    }
    this.isNew = false;
    Object.assign(this, options || {});
    this.compile(query);
}

Update.prototype.compile = function compile(query) {
    this.flow = [];
    Object.keys(query).forEach(key => {
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
    });

    this.flow.filter(operation => !!operation);
};

Update.prototype.execute = function execute(entry) {
    return [].concat.apply([], this.flow.map(operation => {
        var result = operation.validator(entry);
        if (!result) {
            // console.error(`Failed on ${operation.operator}`, entry, ...operation.args);
        }

        return result;
    }));
};

Update.prototype.$inc = function $inc(params) {
    var updaters = Object.keys(params).map(path => {
        return data => {
            var property = search(path, data, {create: true, default: 0});
            if (property.value === undefined) {
                property.value = property.object[property.key] = params[path];
            } else if (property.value === null) {
                return false;
            } else {
                property.object[property.key] += params[path];
            }

            return true;
        }
    });

    return data => updaters.map(updater => updater(data));
};

Update.prototype.$mul = function $mul(params) {
    var updaters = Object.keys(params).map(path => {
        return data => {
            var property = search(path, data, {create: true, default: 0});
            if (property.value === undefined) {
                property.value = property.object[property.key] = params[path];
            } else if (property.value === null) {
                return false;
            } else {
                property.object[property.key] *= params[path];
            }

            return true;
        }
    });

    return data => updaters.map(updater => updater(data));
};

Update.prototype.$rename = function $rename(params) {
    var updaters = Object.keys(params).map(path => {
        return data => {
            var property = search(path, data, {create: true, default: ''});
            if (property.value !== undefined) {
                property.object[params[path]] = property.object[property.key];
                delete property.object[property.key];
                return true;
            }

            return property.value === undefined;
        }
    });

    return data => updaters.map(updater => updater(data));
};

Update.prototype.$setOnInsert = function $setOnInsert(params) {
    var update = undefined;
    if (this.isNew) {
        update = new Update(params, this);
    }
    return data => update && update.execute(data);
};

Update.prototype.$set = function $set(params) {
    var updaters = Object.keys(params).map(path => {
        return data => {
            var property = search(path, data, {create: true, default: undefined});
            property.object[property.key] = params[path];
            return true;
        }
    });

    return data => updaters.map(updater => updater(data));
};

Update.prototype.$unset = function $unset(params) {
    var updaters = Object.keys(params).map(path => {
        return data => {
            var property = search(path, data);
            if (property.complete) {
                delete property.object[property.key];
            }

            return true;
        }
    });

    return data => updaters.map(updater => updater(data));
};

Update.prototype.$min = function $min(params) {
    var updaters = Object.keys(params).map(path => {
        return data => {
            var property = search(path, data, {create: true, default: 0}),
                value = params[path];
            if (property.value === undefined || property.value === null || property.value > value) {
                property.object[property.key] = value;
                return true;
            }
            return false;
        }
    });

    return data => updaters.map(updater => updater(data));
};

Update.prototype.$max = function $max(params) {
    var updaters = Object.keys(params).map(path => {
        return data => {
            var property = search(path, data, {create: true, default: 0}),
                value = params[path];
            if (property.value === undefined || property.value === null || property.value < value) {
                property.object[property.key] = value;
                return true;
            }
            return false;
        }
    });

    return data => updaters.map(updater => updater(data));
};

Update.prototype.$currentDate = function $currentDate(params) {
    var updaters = Object.keys(params).map(path => {
        return data => {
            var property = search(path, data, {create: true, default: 0}),
                value = params[path],
                type = value && value.$type,
                date = new Date();

            property.object[property.key] = value === true || type === 'date' ? date : date.getTime();
            return true;
        }
    });

    return data => updaters.map(updater => updater(data));
};

Update.prototype.$ = function $(params) {
    //not implemented yet
    return data => false;
};

module.exports = Update;

var object = {
    deep: {
        path: {
            inc: 123
        }
    }
};

var update = new Update({
    $inc: {'deep.path.inc': 111, 'next.deep.path': -112},
    $mul: {'deep.path.inc': 2},
    $rename: {'deep.path': 'asd'},
    $set: {
        deep: {test: 1},
        'deep.test': 'hello  world'
    },
    $unset: {'deep.test': ''},
    $min: {'next.deep.path': -222},
    $max: {'next.deep.path1': 100500},
    $currentDate: {
        updated_at: true,
        created: {$type: 'timestamp'}
    }
});

console.time('Start update');
var result = update.execute(object);
console.timeEnd('Start update');
console.log('Update Result: ', result, object);
