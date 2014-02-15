/**
 * User: Vladimir Bulyga <zero@ccxx.cc>
 * Project: jsdb
 * Date: 11.01.14 19:57
 */

var getAtPath = require('./utils').getAtPath;

function Validator(query) {
    this.query = Object(query);
    this.pipe = [];
    this.createPipe();
}

Validator.prototype.methods = {
    $all        :   function(data, value) {
        var i;
        if (!Array.isArray(data)) {
            return false;
        }
        for (i in value) {
            if (!~data.indexOf(value[i])) {
                return false;
            }
        }
        return true;
    },
    $and        :   function (data, value) {},
    $elemMatch  :   function (data, value) {},
    $exists     :   function(data, value) {
        return !!data === value;
    },
    $explain    :   function() {
        console.warn('not implemented');
        return true;
    },
    $gt         :   function(data, value) {
        return data > value;
    },
    $gte        :   function(data, value) {
        return data >= value;
    },
    $hint       :   function() {
        console.warn('not implemented');
        return true;
    },
    $in         :   function(data, value) {
        return !!~value.indexOf(data)
    },
    $isolated   :   function() {
        console.warn('not implemented');
        return true;
    },
    $lt         :   function(data, value) {
        return data < value;
    },
    $lte        :   function(data, value) {
        return data <= value;
    },
    $max        :   function() {
        console.warn('not implemented');
        return true;
    },
    $maxScan    :   function() {
        console.warn('not implemented');
        return true;
    },
    $min        :   function() {
        console.warn('not implemented');
        return true;
    },
    $mod        :   function(data, value) {
        if (!Array.isArray(value)) {
            throw new Error('$mod must be a array with two elements');
        }
        return data % value[0] === value[1];
    },
    $ne         :   function(data, value) {
        return data !== value;
    },
    $nin        :   function(data, value) {
        return !this.$in(data, value)
    },
    $nor        :   function(data, query, queryObj, item, pItem, self) {
        return !this.$or.apply(this, arguments);
    },
    $not        :   function (data, value) {
        
    },
    $options    :   function(data, query, queryObj) {
        if (!queryObj.$regex) throw new Error('$options can be set only with $regex');
        return true;
    },
    $or         :   function(data, query, queryObj, item, pItem, self) {
        for (var i in query) {
            if (self.compileAndRun(query[i], data) === true) return true;
        }

        return false;
    },
    $orderBy    :   function(data, query, queryObj, item, pItem, self) {
        if (!queryObj.$query) throw new Error('Must use only with $query');
        self.caller.options.sort = query;
        return true;
    },
    $query      :   function(data, query, queryObj, item, pItem, self) {
        return self.compileAndRun(query, data) === true;
    },
    $returnKey  :   function() {
        console.warn('not implemented');
        return true;
    },
    $showDiskLoc:   function() {
        console.warn('not implemented');
        return true;
    },
    $size       :   function(data, value) {
        if (!Array.isArray(data)) return false;
        return data.length === value;
    },
    $snapshot   :   function() {
        console.warn('not implemented');
        return true;
    },
    $type       :   function(data, query) {
        /**
         * Double	1
         String	2
         Object	3
         Array	4
         Binary data	5
         Object id	7
         Boolean	8
         Date	9
         Null	10
         Regular Expression	11
         JavaScript	13
         Symbol	14
         JavaScript (with scope)	15
         32-bit integer	16
         Timestamp	17
         64-bit integer	18
         Min key	255
         Max key	127
         */
        switch (query) {
            case    1   :   return data === parseFloat(data);
            case    2   :   return data+"" === data;
            case    3   :   return {}.toString.call(data) === '[object Object]';
            case    4   :   return Array.isArray(data);
            case    8   :   return !!data === data;
            case    9   :   return data instanceof Date;
            case    10  :   return data === null;
            case    11  :   return data instanceof RegExp;
            case    13  :   return typeof data === 'function';
            case    15  :   return typeof data === 'function';
            case    16  :   return data === parseInt(data);
            case    18  :   return data === parseInt(data);
            default     :   return false;
        }
    },
    $regex      :   function(data, query, queryObj) {
        var $options = queryObj.$options || '',
            pattern = new RegExp(query, $options || '');
        return typeof data === 'string' && pattern.test(data);
    },
    $where      :   function(data, query) {
        return !!(new Function('try {return ' + query + '} catch(e) {return false}')).call(data);
    }

};

Validator.prototype.equal = function (data, value) {
    return data === value;
};

Validator.prototype.forAll = function (data, callback) {
    var length = data.length,
        i;

    for (i = 0; i < length; i += 1) {
        if (!callback(data[i])) {
            return false;
        }
    }

    return true;
};

Validator.prototype.createPipe = function () {
    var self = this,
        pipe = this.pipe,
        query = this.query,
        methods = this.methods,
        keys = Object.getOwnPropertyNames(query);
    
    keys.forEach(function (key) {
        if (key[0] === '$') {
            if (methods.hasOwnProperty(key)) {
                pipe.push(function (data) {
                    return !!methods[key](data, query[key]);
                });
            } else {
                
            }
        } else if (typeof query[key] === 'object') {
            var validator = new Validator(query[key]);
            pipe.push(function (data) {
                return self.forAll(getAtPath(data, key), validator.validate.bind(validator));
            });
        } else {
            pipe.push(function (data) {
                return self.forAll(getAtPath(data, key), function (value) {
                    return self.equal(value, query[key]);
                });
            });
        }
    });
};

Validator.prototype.validate = function (data) {
    var pipe = this.pipe,
        length = pipe.length,
        i;
    for (i = 0; i < length; i += 1) {
        if (!pipe[i](data)) {
            return false;
        }
    }
    
    return true;
};

exports.Validator = Validator;