"use strict";

/*!
 Math.uuid.js (v1.4)
 http://www.broofa.com
 mailto:robert@broofa.com

 Copyright (c) 2010 Robert Kieffer
 Dual licensed under the MIT and GPL licenses.
 */

function UUID() {
    this.CHARS = '0123456789abcdef'.split('');
}

UUID.prototype = {
    uuid        :   function (len, radix) {
        var chars = this.CHARS, uuid = [], i;
        radix = radix || chars.length;

        if (len) {
            // Compact form
            for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];
        } else {
            // rfc4122, version 4 form
            var r;

            // rfc4122 requires these characters
            uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
            uuid[14] = '4';

            // Fill in random data.  At i==19 set the high bits of clock sequence as
            // per rfc4122, sec. 4.1.5
            for (i = 0; i < 36; i++) {
                if (!uuid[i]) {
                    r = 0 | Math.random()*16;
                    uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
                }
            }
        }

        return uuid.join('');
    },
    uuidFast    :   function() {
        var chars = this.CHARS, uuid = new Array(36), rnd=0, r;
        for (var i = 0; i < 36; i++) {
            if (i==8 || i==13 ||  i==18 || i==23) {
                uuid[i] = '-';
            } else if (i==14) {
                uuid[i] = '4';
            } else {
                if (rnd <= 0x02) rnd = 0x2000000 + (Math.random()*0x1000000)|0;
                r = rnd & 0xf;
                rnd = rnd >> 4;
                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
            }
        }
        return uuid.join('');
    },
    uuidCompact :   function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }
};

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
                if (val instanceof Date) {
                    target[val] = new Date(val.getTime());
                }
                if ({}.toString.call(val) !== '[object Object]' || val instanceof RegExp || val === null) {
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

function empty(object) {
    //noinspection LoopStatementThatDoesntLoopJS,JSUnusedLocalSymbols
    for (var i in object) return false;
    return true;
}

function deepEqual(a, b) {
    if (a === b) return true;
    if (empty(a)) return false;
    for (var i in a) {
        var typeofA = {}.toString.call(a[i]),
            typeofB = {}.toString.call(b[i]);
//        if (typeofA === '[object Object]' && '[object Object]' === typeofB && !deepEqual(a[i], b[i])) return false;
        if (Array.isArray(a[i]) && Array.isArray(b[i])) {
            if (a[i].length !== b[i].length) return false;
            for (var n in a[i]) {
                if (!~b[i].indexOf(a[i][n]) && !deepEqual(a[i][n], b[i][n])) return false;
            }
        } 
        else
        if (typeofA === '[object Date]' && '[object Date]' === typeofB && a[i].getTime() !== b[i].getTime()) return false;
        else
        if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
}

function deepKey(o) {
    var k, out,
        key = '';
    if (Array.isArray(o)) {
        out = [];
        for (k in o) 
            out.push(deepKey(o[k]));
        key += out.sort().join('_');
    } else
    if ({}.toString.call(o) === '[object Object]') {
        out = [];
        var objKeys = Object.keys(o).sort();
        for (k in objKeys) 
            if (o.hasOwnProperty(objKeys[k])) out.push(objKeys[k] + '=' + deepKey(o[objKeys[k]]));
        key += out.sort().join('_');
    } else
    if ({}.toString.call(o) === '[object Date]') key+= o.getTime();
    else
    key += o+"";
    
    return key;
}

function hashCode(s){
    return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
}

module.exports = {
    clone       :   clone,
    extend      :   extend,
    getAtPath   :   getAtPath,
    forAllItems :   forAllItems,
    empty       :   empty,
    uuid        :   new UUID,
    hashCode    :   hashCode,
    deepEqual   :   deepEqual,
    deepKey     :   deepKey,
    deepKeyHash :   function(object) {
        //noinspection JSCheckFunctionSignatures
        return hashCode(deepKey(object)).toString(16);
    }
};