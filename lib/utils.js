"use strict";
function clone(object) {
    return JSON.parse(JSON.stringify(object));
}

function extend() {
    if (arguments.length < 1 || typeof arguments[0] !== 'object') {
        return false;
    }

    if (arguments.length < 2) return arguments[0];

    var target = arguments[0];

    // convert arguments to array and cut off target object
    var args = [].slice.call(arguments, 1);

    var key, val, src, clone;

    args.forEach(function (obj) {
        if (typeof obj !== 'object') return;

        for (key in obj) {
            if (obj[key] !== void(0) && obj.hasOwnProperty(key)) {
                src = target[key];
                val = obj[key];

                if (val === target) continue;
                if (val instanceof Date || val instanceof RegExp || typeof val !== 'object' || val === null) {
                    target[key] = val;
                    continue;
                }

                if (typeof src !== 'object') {
                    clone = (Array.isArray(val)) ? [] : {};
                    target[key] = extend(clone, val);
                    continue;
                }

                if (Array.isArray(val)) {
                    clone = (Array.isArray(src)) ? src : [];
                } else {
                    clone = (!Array.isArray(src)) ? src : {};
                }

                target[key] = extend(clone, val);
            }
        }
    });

    return target;
}

function getAtPath(path, object, options, realPath) {
    options = options || {};
    realPath = realPath && [realPath] || [];
    if (!path.split) console.inspect(path, object);
    var result = [],
        splittedPath = Array.isArray(path) ? path : path.split(/\./),
        key, ptr = object, prevPtr, prevKey;
    
    while(ptr && (key = splittedPath.shift())) {
        prevPtr = ptr;
        prevKey = key;
        ptr = ptr[key] = ptr[key] || options.create && {};
        realPath.push(key);
        if (Array.isArray(ptr) && splittedPath.length) {
            var arrayPath = splittedPath.splice(0);
            for(var i in ptr) {
                var arrayResult = getAtPath(clone(arrayPath), ptr[i], options, [realPath.join('.'), i]);
                if (arrayResult.length)
                    result = result.concat(arrayResult);
            }
            return result;
        }
    }
    if (ptr)
        result.push({data: ptr, previous:prevPtr, key:prevKey, path: realPath.join('.')});
    
    return result;
}

function forAllItems(items, callback) {
    if (!items) return void 0;
    if (Array.isArray(items))
        for (var i in items) callback(items[i]);
    else
        callback(items);
    
    return true;
}

module.exports = {
    clone       :   clone,
    extend      :   extend,
    getAtPath   :   getAtPath,
    forAllItems :   forAllItems
};