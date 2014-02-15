exports.queries = {
    execute     :   function(data, query, queryObj, item, pItem, self) {
        var that = this;
        ['$orderBy', '$limit', '$skip', '$query', '$update'].forEach(function(name) {
            if (query[name]) {
                that.call(that, data, query[name], null, item, pItem, self);
            }
        });
    },
    $query      :   function(data, query, queryObj, item, pItem, self) {
        var result = self.compileAndRun(query, data);
        if (result !== true) return result;
        return true;
    },
    $orderBy    :   function(data, query, queryObj, item, pItem, self) {
        self.caller.options.sort = query;
        return true;
    },
    $limit      :   function(data, query, queryObj, item, pItem, self) {
        self.caller.options.limit = query;
        return true;
    },
    $skip       :   function(data, query, queryObj, item, pItem, self) {
        self.caller.options.skip = query;
        return true;
    },
    $update     :   function(data, query, queryObj, item, pItem, self) {
        self.compileAndRun(query, data, $update, {create: true});
        return true;
    }
};

var $query = exports.$query = {
/*
    $update     :   function(data, query, queryObj, item, pItem, self) {
        self.compileAndRun(query, data, $update);
        return true;
    },
*/
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
    $and        :   function(data, query, queryObj, item, pItem, self) {
        for (var i in query) {
            var result = self.compileAndRun(query[i], data);
            if (result !== true) return result;
        }
        return true;
    },
    $elemMatch  :   function(data, query, queryObj, item, pItem, self) {
        if (!Array.isArray(data)) return false;
        for (var i in data) {
            var result = self.compileAndRun(query, data[i]);
            if (result !== true) return result;
        }
        return true;
    },
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
        return data >= value
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
        return data < value
    },
    $lte        :   function(data, value) {
        return data <= value
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
        if (!Array.isArray(value)) throw new Error('$mod must be a array with two elements');
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
    $not        :   function(data, query) {
        return self.compileAndRun(query, data) !== true;
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

var $project = exports.$project = {
    $matchAll   :   function(data, query, queryObj, item, pItem, self) {
        if (!Array.isArray(data)) return void 0;
        var result = [];
        for (var i in data) {
            var _item = item[i].subItem(i);
            if (self.compileAndRun(query, _item) === true) result.push(data[i]);
        }
        return result;
    },
    $           :   function(data, value) {
        if (!Array.isArray(data)) return void 0;
        return data[value];
    },
    $slice      :   function(data, value) {
        if (!Array.isArray(data)) return void 0;
        if (!(Array.isArray(value) && value.length === 2)) return void 0;
        var start = value[0], length = start+value[1];
        return data.slice(start, length);
    }
};

var $update = exports.$update = {
/*
    $addToSet   :   function(data, query, queryObj, item, pItem, self) {
        self.compileAndRun(query, data, function(data, query, queryObj, item, pItem) {
            if (Array.isArray(data)) {
                if (query.$each) {
                    self.compileAndRun({$each: query.$each}, data, {$each: $query.$each});
                } else
                    data.push(query);
            }
            return true;
        });
        return true;
        for (var path in query) {
            var q = query[path],
                items = data.getItem(path);
        }
        for (var path in query) {
            var _query = query[path],
                items = data.subItem(path);
            var result = utils.forAllItems(items, function(item) {
                item.update(_query, cursor, operators);
            });

            if (!result) throw new Error('Cannot apply $addToSet modifier to non-array');
        }
    },
    $each       :   function(data, value, property, object, cursor, operators) {
        if (!(~operators.indexOf('$addToSet') || ~operators.indexOf('$push'))) throw new Error('Cannot use $each without $push or $addToSet');
        if (Array.isArray(data.get()) && Array.isArray(value)) {
            var itemData = data.get();
            for(var i in value) {
                itemData.push(value[i]);
            }
        }
    },
*/
    $inc        :   function(data, query, queryObj, item, pItem, self) {
        self.compileAndRun(query, data, function(data, query, queryObj, item, pItem) {
            if (parseFloat(data) === data)
                pItem.prevObj[pItem.prevKey]+=query;
            return true;
        });
        return true;
    },
    $pop        :   function(data, query, queryObj, item, pItem, self) {
        self.compileAndRun(query, data, function(data, query) {
            query === 1 ? data.pop() : data.shift();
            return true;
        });
        return true;
    },
    $pull       :   function(data, query, queryObj, item, pItem, self) {
        self.compileAndRun(query, data, function(data, query) {
            if (Array.isArray(data))
                for(var i in data) {
                    if (self.compileAndRun(query, data[i], $query) === true) data.splice(i, 1);
                }
            return true;
        });
        return true;
    },
    $pullAll    :   function(data, query, queryObj, item, pItem, self) {
        self.compileAndRun(query, data, function(data, query, queryObj, item, pItem) {
            if (Array.isArray(data))
                data.forEach(function(data) {
                    if (self.compileAndRun(query, data, $query) === true) {
                        var index = pItem.prevObj[pItem.prevKey].indexOf(data);
                        pItem.prevObj[pItem.prevKey].splice(index, 1)
                    }
                });
            return true;
        });
        return true;
    },
    $push       :   function(data, query, queryObj, item, pItem, self) {
        self.compileAndRun(query, data, function(data, query) {
            if (Array.isArray(data))
                data.push(query);
            return true;
        });
        return true;
    },
    $pushAll    :   function(data, query, queryObj, item, pItem, self) {
        self.compileAndRun(query, data, function(data, query) {
            if (Array.isArray(data))
                query.forEach(function(query) {data.push(query)});
            return true;
        });
        return true;
    },
    $rename     :   function(data, query, queryObj, item, pItem, self) {
        self.compileAndRun(query, data, function(data, query, queryObj, item, pItem) {
            if (data) {
                pItem.prevObj[query] = data;
                delete pItem.prevObj[pItem.prevKey];
            }
            return true;
        });
        return true;
    },
    $set        :   function(data, query, queryObj, item, pItem, self) {
        self.compileAndRun(query, data, function(data, query, queryObj, item, pItem) {
            pItem.prevObj[pItem.prevKey] = query;
            return true;
        });
        return true;
    },
    $unset      :   function(data, query, queryObj, item, pItem, self) {
        self.compileAndRun(query, data, function(data, query, queryObj, item, pItem) {
            delete pItem.prevObj[pItem.prevKey];
            return true;
        });
        return true;
    }
};

var $aggregate = exports.$aggregate = {
    $add: function(data, value, property, object, self) {},
    $addToSet: function(data, value, property, object, self) {},
    $and: function(data, value, property, object, self) {},
    $avg: function(data, value, property, object, self) {},
    $cmp: function(data, value, property, object, self) {},
    $concat: function(data, value, property, object, self) {},
    $cond: function(data, value, property, object, self) {},
    $dayOfMonth: function(data, value, property, object, self) {},
    $dayOfWeek: function(data, value, property, object, self) {},
    $dayOfYear: function(data, value, property, object, self) {},
    $divide: function(data, value, property, object, self) {},
    $eq: function(data, value, property, object, self) {},
    $first: function(data, value, property, object, self) {},
    $geoNear: function(data, value, property, object, self) {},
    $group: function(data, value, property, object, self) {},
    $gt: function(data, value, property, object, self) {},
    $gte: function(data, value, property, object, self) {},
    $hour: function(data, value, property, object, self) {},
    $ifNull: function(data, value, property, object, self) {},
    $last: function(data, value, property, object, self) {},
    $limit: function(data, value, property, object, self) {},
    $lt: function(data, value, property, object, self) {},
    $lte: function(data, value, property, object, self) {},
    $match: function(data, value, property, object, self) {},
    $max: function(data, value, property, object, self) {},
    $millisecond: function(data, value, property, object, self) {},
    $min: function(data, value, property, object, self) {},
    $minute: function(data, value, property, object, self) {},
    $mod: function(data, value, property, object, self) {},
    $month: function(data, value, property, object, self) {},
    $multiply: function(data, value, property, object, self) {},
    $ne: function(data, value, property, object, self) {},
    $not: function(data, value, property, object, self) {},
    $or: function(data, value, property, object, self) {},
    $project: function(data, value, property, object, self) {},
    $push: function(data, value, property, object, self) {},
    $second: function(data, value, property, object, self) {},
    $skip: function(data, value, property, object, self) {},
    $sort: function(data, value, property, object, self) {},
    $strcasecmp: function(data, value, property, object, self) {},
    $substr: function(data, value, property, object, self) {},
    $subtract: function(data, value, property, object, self) {},
    $sum: function(data, value, property, object, self) {},
    $toLower: function(data, value, property, object, self) {},
    $toUpper: function(data, value, property, object, self) {},
    $unwind: function(data, value, property, object, self) {},
    $week: function(data, value, property, object, self) {},
    $year: function(data, value, property, object, self) {}
};