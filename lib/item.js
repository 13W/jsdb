"use strict";
var utils = require('./utils');

function Item(object, parent, withId) {
    this.data = object;
    this.isNew = true;
    this.updated = false;
    this.__parent = parent;
    this.__root = parent && parent.__root || this;
    this.__prevObj = null;
    this.__prevKey = null;
    this.__path = null;
    this.__childrens = [];
    this.__links = {};
    if (withId && this.data && !this.data._id && {}.toString.call(this.data) === '[object Object]') {
        this.data._id = utils.uuid.uuid(24);
    }
    this.__uuid = this.data && this.data._id || utils.uuid.uuid(24);
}

Item.prototype = {
    inspect     :   function() {
        return this.__uuid;
    },
    toString    :   function() {
        return this.__uuid;
    },
    get         :   function() {
        return this.data;
    },
    set         :   function(value) {
        this.data = value;
        this.updated = true;
        if (this.__prevObj && this.__prevKey)
            this.__prevObj[this.__prevKey] = this.data;
        return this;
    },
    parent      :   function() {
        return this.__parent;
    },
    root        :   function() {
        return this.__root;
    },
    subItem     :   function(path) {
        var self = this,
            result = utils.getAtPath(path, self.get(), {}, self.__path);
        if (!result.length) return void 0;
        
        function subItem(e) {
            var item = new Item(e.data, self);
            item.__prevObj = e.previous;
            item.__prevKey = e.key;
            item.__path    = e.path;
            return item;
        }
        
        return result.length === 1
            ? subItem(result[0])
            : result.map(subItem);
    },
    getAtPath   :   function(path) {
        var result = utils.getAtPath(path, this.get());
        if (!result.length) return void 0;
        return result.length === 1 
            ? result[0].data 
            : result.map(function(e) {return e.data});
    },
    setAtPath   :   function(path, value) {
        var result = utils.getAtPath(path, this.get(), {create: true});
        for (var i in result) {
            var object = result[i].previous,
                key    = result[i].key;
            object[key] = value;
        }

        this.set(this.get());
        this.__root.updated = true;
        return this;
    },
    removeAtPath:   function(path) {
        var result = utils.getAtPath(path, this.get());
        for (var i in result) {
            var object = result[i].previous,
                key    = result[i].key;
            delete object[key];
        }
    },
    extend      :   function() {
        var args = [{}, this.get()].concat(arguments);
        return new Item(utils.extend.apply(null, args), this);
    },
    projectionFunctions:   {
        $matchAll   :   function(data, value, property, object, self) {
            if (!Array.isArray(data)) return void 0;
            var result = [];
            for (var i in data) {
                var item = data[i].subItem(i);
                if (item.check(value, self)) result.push(data[i]);
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
    },
    queryFunctions   :   {
        $all        :   function(data, value) {
            data = data.get();
            if (!Array.isArray(data)) return false;
            for (var i in value) {
                if (!~data.indexOf(value[i])) return false;
            }
            return true;
        },
        $and        :   function(data, value, property, object, cursor) {
            for (var i in value) {
                if (!data.check(value[i], cursor)) return false;
            }
            return true;
        },
        $elemMatch  :   function(data, value, property, object, cursor) {
            data = data.get();
            if (!Array.isArray(data)) return false;
            for (var i in data) {
                var item = data[i].subItem(i);//new Item(data[i], object);
                if (!item.check(value, cursor)) return false;
            }
            return true;
        },
        $exists     :   function(data, value) {
            return value ? !!data.get() : !data.get();
        },
        $explain    :   function() {
            console.warn('not implemented');
            return true;
        },
        $gt         :   function(data, value) {
            return data.get() > value
        },
        $gte        :   function(data, value) {
            return data.get() >= value
        },
        $hint       :   function() {
            console.warn('not implemented');
            return true;
        },
        $in         :   function(data, value) {
            return !!~value.indexOf(data.get())
        },
        $isolated   :   function() {
            console.warn('not implemented');
            return true;
        },
        $lt         :   function(data, value) {
            return data.get() < value
        },
        $lte        :   function(data, value) {
            return data.get() <= value
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
            return data.get() % value[0] === value[1];
        },
        $ne         :   function(data, value) {
            return data.get() !== value;
        },
        $nin        :   function(data, value) {
            return !this.$in(data, value)
        },
        $nor        :   function(data, value, property, object, self) {
            return !this.$or.apply(this, arguments);
        },
        $not        :   function(data, value, property, object, cursor) {
            return !data.check(value, cursor);
        },
        $options    :   function(data, value, property) {
            if (!property.$regex) throw new Error('$options can be set only with $regex');
            return true;
        },
        $or         :   function(data, value, property, object, cursor) {
            for (var i in value)
                if (data.check(value[i], cursor)) return true;
            
            return false;
        },
        $orderBy    :   function(data, value, property, object, cursor) {
            if (!property.$query) throw new Error('Must use only with $query');
            cursor.options.sort = value;
            return true;
        },
        $query      :   function(data, value, property, object, cursor) {
            return data.check(value, cursor);
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
            data = data.get();
            if (!Array.isArray(data)) return false;
            return data.length === value;
        },
        $snapshot   :   function() {
            console.warn('not implemented');
            return true;
        },
        $type       :   function(data, value) {
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
            data = data.get();
            switch (value) {
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
        $regex      :   function(data, value, property) {
            property.$options = property.$options || '';
            var pattern = new RegExp(value, property.$options || '');
            return typeof data.get() === 'string' && pattern.test(data.get());
        },
        $where      :   function(data, value) {
            return !!(new Function('try {return ' + value + '} catch(e) {return false}')).call(data.get());
        }
    },
    updateFunctions:    {
        $addToSet   :   function(data, value, property, object, cursor, operators) {
            for (var path in value) {
                var query = value[path],
                    items = data.subItem(path);
                var result = utils.forAllItems(items, function(item) {
                    item.update(query, cursor, operators);
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
        $inc        :   function(data, value) {
            for (var key in value) {
                var itemValue = data.getAtPath(key);
                if (itemValue === parseFloat(itemValue))
                    data.setAtPath(key, itemValue+value[key]);
            }
        },
        $pop        :   function(data, value) {
            for (var key in value) {
                var queryValue = value[key],
                    items = data.subItem(key);
                utils.forAllItems(items, function(item) {
                    var itemValue = item.get();
                    if (!Array.isArray(itemValue)) return;
                    if (parseInt(queryValue) === queryValue) {
                        if (queryValue >0) itemValue.pop();
                        else itemValue.shift();
                    } else
                    if ({}.toString.call(queryValue) === '[object Object]') {
                        var indexes = [];
                        for (var index in itemValue) {
                            var subItem = item.subItem(index),
                                check = subItem.check(queryValue);
                            
                            if (check) indexes.push(index);
                        }
                        indexes.reverse().forEach(function(index) {
                            itemValue.splice(index, 1);
                        });
                    }
                });
            }
        },
        $pull       :   function(data, value) {
            for (var key in value) {
                var queryValue = value[key],
                    items = data.subItem(key);
                utils.forAllItems(items, function(item) {
                    var itemValue = item.get();
                    if (!Array.isArray(itemValue)) return;
                    var indexes = [];
                    for (var index in itemValue) {
                        var subItem = item.subItem(index),
                            check = subItem.check(queryValue);

                        if (check) indexes.push(index);
                    }
                    indexes.reverse().forEach(function(index) {
                        itemValue.splice(index, 1);
                    });
                });
            }
        },
        $pullAll    :   function(data, value) {
            for (var key in value) {
                var queryValue = value[key],
                    items = data.subItem(key);
                utils.forAllItems(items, function(item) {
                    var itemValue = item.get();
                    if (!(Array.isArray(itemValue) || Array.isArray(queryValue))) return;
                    var indexes = [];
                    for (var index in itemValue) {
                        var subItem = item.subItem(index);
                        for (var i in queryValue) {
                            var check = subItem.check(queryValue[i]);

                            if (check && !~indexes.indexOf(index)) indexes.push(index);
                        }
                    }
                    indexes.sort().reverse().forEach(function(index) {
                        itemValue.splice(index, 1);
                    });
                });
            }
        },
        $push       :   function(data, value) {
            for (var key in value) {
                var queryValue = value[key],
                    items = data.subItem(key);
                utils.forAllItems(items, function(item) {
                    var itemValue = item.get();
                    if (!Array.isArray(itemValue)) return;
                    itemValue.push(queryValue);
                });
            }
        },
        $pushAll    :   function(data, value) {
            for (var key in value) {
                var queryValue = value[key],
                    items = data.subItem(key);
                utils.forAllItems(items, function(item) {
                    var itemValue = item.get();
                    if (!(Array.isArray(itemValue) || Array.isArray(queryValue))) return;
                    for (var i in queryValue) 
                        itemValue.push(queryValue[i]);
                });
            }
        },
        $rename     :   function(data, value) {
            for (var oldKey in value) {
                var newKey = value[oldKey],
                    oldKeyValue = data.getAtPath(oldKey);
                data.setAtPath(newKey, oldKeyValue);
                data.removeAtPath(oldKey);
            }
        },
        $set        :   function(data, value) {
            for(var key in value) {
                data.setAtPath(key, value[key]);
            }
        },
        $unset      :   function(data, value) {
            for(var key in value) {
                if (value[key] === "") data.removeAtPath(key);
                else {
                    var query = {};
                    query[key] = value[key];
                    if (data.check(query)) data.removeAtPath(key);
                }
            }
        }
    },
    _update     :   function(path, value) {
        
    },
    update      :   function(query, cursor, operators) {
        var self = this;
        operators = operators || [];
        for (var path in query) {
            var queryMethod = self.updateFunctions[path],
                queryValue = query[path],
                queryOps = utils.clone(operators);
            if (queryMethod) {
                queryOps.push(path);
                queryMethod.call(self.queryFunctions, self, queryValue, query, self.root(), cursor, queryOps);
            }
        }
    },
    check       :   function(query, cursor) {
        var self = this;
        
        for (var path in query) {
            var queryMethod = self.queryFunctions[path],
                queryValue = query[path];
            if (queryMethod) {
                if (!queryMethod.call(self.queryFunctions, self, queryValue, query, self.root(), cursor)) return false;
                continue;
            }

            var pathItem = self.subItem(path) || new Item(void 0);
            
            if (!({}.toString.call(queryValue) === '[object Object]' || Array.isArray(queryValue))) {
                var pathValue = Array.isArray(pathItem) ? pathItem.map(function(e) {return e.get()}) : Array.isArray(pathItem.get()) ? pathItem.get() : [pathItem.get()];
                if (!~pathValue.indexOf(queryValue)) return false;
                else continue;
            }
            if (!Array.isArray(pathItem)) {
                if (!pathItem.check(queryValue, cursor)) return false;
            } else {
                for (var i in pathItem) {
                    if (!pathItem[i].check(queryValue, cursor)) return false;
                }
            }
        }
        
        return true;
    },
    project     :   function(columns) {
        var resultData = {};
        if (utils.empty(columns)) return this.get();
        for (var column in columns) {
            var display = columns[column];

            if (/\.\$$/.test(column)) {
                column = column.substr(0, column.length-2);
                display = {$: display};
            }

            if (display <= 0) continue;

            var objPtr = this.getAtPath(column);
            if ({}.toString.call(display) === '[object Object]') {
                for (var key in display) {
                    if (this.projectionFunctions[display])
                        objPtr = this.projectionFunctions[display].call(this.projectionFunctions, objPtr, display[key], display, this, this);
                }
            }

            if (typeof objPtr === 'undefined') continue;

            var ptr = utils.getAtPath(column, resultData, {create: true}),
                ptrData = ptr[0].previous,
                ptrKey = ptr[0].key;
            ptrData[ptrKey] = objPtr;
        }
        return resultData;
    }
};

exports.Item = Item;