/**
 * Created by zero on 21.10.16.
 */
'use strict';

module.exports.search = function search(path, object, options) {
    var key = '',
        i = 0,
        pathLength = path.length;

    options = options || {};
    if (object && object.hasOwnProperty(path)) {
        return {
            key: path,
            value: object[path],
            object: object,
            complete: true,
            incompletePath: ''
        }
    }

    do {
        var chr = path[i];
        if (chr === '.' || !chr) {
            if (options.create && !object[key]) {
                if (i === pathLength && options.hasOwnProperty('default')) {
                    object[key] = options.default;
                } else {
                    object[key] = {};
                }
            }

            if (i === pathLength) {
                break;
            }

            if (object === undefined) {
                break;
            }

            if (key === '$') {
                break;
            }

            object = object[key];
            key = '';
        } else {
            key += chr;
        }

        i += 1;
    } while (i <= pathLength);

    return {
        complete: i === pathLength,
        incompletePath: key === '$' ? path.substr(i + 1) : '',
        object: object,
        key: key,
        value: key === '$' ? object : object && object[key]
    };
};

module.exports.getFirstKey = function getFirstKey(object) {
    for (var key in object) {
        return key;
    }
};
