/**
 * User: Vladimir Bulyga <zero@ccxx.cc>
 * Project: jsdb
 * Date: 18.01.14 23:03
 */

var Validator = require('./validator').Validator,
    getAtPath = require('./utils').getAtPath,
    getWithPath = require('./utils').getWithPath,
    nde = require('native-deep-extend'),
    extend = nde.extend,
    clone = nde.clone;

function Projector(query) {
    this.query = query;
    this.pipe = [];
    this.createPipe();
}

Projector.prototype.methods = {
    $matchAll   : function (data, opts) {
        if (!Array.isArray(data)) {
            return;
        }

        var validator = new Validator(opts);
        return 
    },
    $           : function (data, opts) {
        
    },
    $slice      : function (data, opts) {
        
    }
};

Projector.prototype.createPipe = function () {
    var self = this,
        pipe = this.pipe,
        query = this.query,
        methods = this.methods,
        keys = Object.getOwnPropertyNames(query);

    keys.forEach(function (key) {
        var value = query[key];
        if (value === 1 || value === true) {
            pipe.push(function (data, result) {
                var res = getWithPath(data, key);
                extend(result, res);
            });
        } else if (value === 0 || value === false) {
            pipe.push(function (data, result) {
                delete result[key];
            });
        } else if (typeof value === 'object') {
            pipe.push(function (data, result) {
                var keys = Object.getOwnPropertyNames(value),
                    kLength = keys.length,
                    k;
                for (k = 0; k < kLength; k += 1) {
                    var tmpKey = keys[k],
                        tmpVal = value[tmpKey];
                    if (!self.methods[tmpKey]) {
                        throw new Error("Unsupported projection option: " + tmpKey);
                    }
                    var tmpData = getWithPath(data, key),
                        res = self.methods[tmpKey].call(value, tmpData, tmpVal);

                    extend(result, res);
                }
            });
        }
    });
    
};

Projector.prototype.map = function (data) {
    
};