/**
 * User: Vladimir Bulyga <zero@ccxx.cc>
 * Project: jsdb
 * Date: 15.01.14 23:00
 */

var indexId = 0;

function ObjectId (id) {
    if (!(this instanceof ObjectId)) {
        return new ObjectId(id);
    }

    if (id) {
        if (id.length !== 24) {
            throw new Error('Wrong object id ', id);
        }
        this.id = new Buffer(id, 'hex');
        return this;
    }

    id = new Buffer(12);
    id.fill(0);
    indexId += 1;
    id.writeInt32BE(parseInt(new Date()/1000,10), 0);
    id.writeInt32LE(parseInt(Math.random()*10000000,10), 4);
    id.writeInt16BE(process.pid, 7);
    id.writeInt32BE(indexId << 8, 9, true);
    this.id = id;
}

ObjectId.prototype.inspect = ObjectId.prototype.toJSON = ObjectId.prototype.toString = function () {
    return this.id.toString('hex');
};

exports.ObjectId = exports.ObjectID = ObjectId;
/**
 * 
 * @param object {Object} search object
 * @param path {String} search path
 * @param options {Object = {}}
 * @param result {Array = []}
 * @returns {*}
 */
function getAtPath(object, path, options, result) {
    options = options || {};
    result = result || [];
    if (!object) {
        if (options.mustExist) {
            return false;
        }
        return result;
    }
    var key = path,
        dotIndex = path.indexOf('.');

    //noinspection JSLint
    if (~dotIndex) {
        key = path.substr(0, dotIndex);
        path = path.substr(dotIndex + 1);
    } else {
        path = '';
    }

    var value = object[key];

    if (!value) {
        if (options.mustExist) {
            return false;
        }
    } else if (!path) {
        result.push(value);
    } else if (Array.isArray(value)) {
        //noinspection JSLint
        var length = value.length >>> 0,
            i;

        for (i = 0; i < length; i++) {
            getAtPath(value[i], path, options, result);
        }
    } else {
        getAtPath(value, path, options, result);
    }

    return result;
}

exports.getAtPath = getAtPath;

function getWithPath(object, path, options, result) {
    options = options || {};
    result = result || {};
    if (!object) {
        if (options.mustExist) {
            return false;
        }
        return result;
    }
    var key = path,
        dotIndex = path.indexOf('.');

    //noinspection JSLint
    if (~dotIndex) {
        key = path.substr(0, dotIndex);
        path = path.substr(dotIndex + 1);
    } else {
        path = '';
    }

    var value = object[key];
    
    if (!path) {
        result[key] = value;
    } else if (Array.isArray(value)) {
        var ptr = result[key] = [],
            k, l = value.length;
        for (k = 0; k < l; k += 1) {
            getWithPath(value[k], path, options, ptr);
        }
    } else if (value) {
        result[key] = result[key] || {};
        getWithPath(value, path, options, result[key]);
    } else {
        return result;
    }
}

exports.getWithPath = getWithPath;

function unique (array) {
    var keys = {},
        result = [],
        length = Object(array).length >>> 0,
        k;
    
    for (k = 0; k < length; k += 1) {
        var item = array[k];
        if (item && item._id && !keys[item._id]) {
            keys[item._id] = true;
            result.push(item);
        }
    }
    return result;
}

exports.unique = unique;