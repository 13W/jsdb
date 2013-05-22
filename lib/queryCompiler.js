var utils = require('./utils');
function QueryCompiler(caller, query, methods, options) {
    var self = this;
    self.caller = caller;
    self.query = utils.extend({},query);
    self.methods = methods;
    self.sequence = [];
    self.compiledQuery = null;
    self.options = utils.extend({}, {waifFor: true}, options);
    self.compile();
}

//noinspection JSPotentiallyInvalidConstructorUsage
QueryCompiler.prototype = {
    new         :   function(caller, query, methods, options) {
        return new QueryCompiler(caller, query, methods, options);
    },
    inspect     :   function() {
        return JSON.stringify(this.query);
    },
    toSequence  :   function(method, context, query, params, path, options) {
        this.sequence.push(this.wrapMethod(method, context, query, params, path, this, options || this.options))
    },
    compile     :   function(query, methods, options) {
        var self = this;
        query = query || self.query;
        methods = methods || self.methods;
        
        for (var key in query) {
            if (typeof methods === 'function') {
                self.toSequence(methods, {}, query[key], query, key, options);
            } else
            if (methods && key[0] === '$' && (key in methods)) {
                self.toSequence(methods[key], methods, query[key], query, null, options);
            } else
            if ({}.toString.call(query[key]) == '[object Object]') {
                //noinspection JSPotentiallyInvalidConstructorUsage
                self.toSequence(function(data, query) {return self.compileAndRun(query, data, options)}, {}, query[key], query, key);
            } else {
                self.toSequence(function(data, query, queryObj, item, pItem) {
//                    if (options.update) {}
                    if (data === query) return true;
                    if (Array.isArray(query) && ~query.indexOf(data)) return true;
                    if ((data instanceof Date) && data.getTime() == new Date(query).getTime()) return true;
                    if ((query instanceof RegExp)) return query.test(data);
                    return {
                        type: 'error',
                        path: pItem.path,
                        require: query,
                        expected: data
                    };
                }, {}, query[key], query, key, options);
            }
        }
    },
    forAllItems :   function(data, waitFor, isItems, item, callback) {
        var self = this;
        data = Array.isArray(data) ? data : [data];
        for(var i in data) {
            var result = callback(isItems ? data[i].value : data[i], item, data[i], self);
            if (result !== (typeof waitFor !== 'undefined' ? waitFor : true)) return result;
        }
        if (typeof waitFor !== 'undefined') return waitFor;
        return  true;
    },
    wrapMethod  :   function() {
        var self = this,
            method = [].shift.call(arguments),
            context = [].shift.call(arguments),
            query = [].shift.call(arguments),
            queryObj = [].shift.call(arguments),
            path = [].shift.call(arguments),
            options = [].shift.call(arguments);
        return function(data, item) {
            data = path ? self.followPath(path, data, undefined, undefined, undefined, options) : data;
            return self.forAllItems(data, void 0, !!path, item, function(data, item, pItem) {
                return method.call(context || {}, data, query, queryObj, item, pItem, self);
            });
        }
    },
    followPath  :   function(path, object, prevObj, prevKey, fullPath, options) {
        function createPath(path, key) {
            var _path = [];
            path && _path.push(path);
            key && _path.push(key);
            return _path.join('.');
        }

        function createResult(value) {
            return {
                value: value,
                prevObj: prevObj,
                prevKey: prevKey,
                path: createPath(fullPath, prevKey)
            }
        }
        var self = this,
            followResult = createResult(object);
        options = options || {};
//        if (options.create && !object) prevObj[prevKey] = {};
        if (!object) return [followResult];
        path = Array.isArray(path) ? path : (path && path.split('.') || []);
        if (!path.length) return [followResult];
        if (Array.isArray(object) && !{}.hasOwnProperty.call(object, parseInt(path[0]))) {
            var result = [],
                strPath = path.join('.');
            for (var i in object) {
                var tmpResult = self.followPath(strPath, object[i], object, i, followResult.path, options);
                result = result.concat(tmpResult.filter(function(e) {return typeof e.value !== 'undefined'}));
            }
            return result;
        }
        var key = path.shift();
        return self.followPath(path, object[key], object, key, followResult.path, options);
    },
    compileAndRun   :   function(query, data, methods, options) {
        var self = this;
//        return new QueryCompiler(self.caller, query, self.methods).execute(data);
        if (!query.__compiledQuery) {
            //noinspection JSPotentiallyInvalidConstructorUsage
            Object.defineProperties(query, {
                __compiledQuery: {
                    enumerable: false,
                    writable: false,
                    configurable: false,
                    value: new QueryCompiler(self.caller, query, methods || self.methods, options)
                }
            });
        }
        return query.__compiledQuery.execute(data);
    },
    execute     :   function(item) {
        if (!item) return item;
        var sequence = this.sequence,
            data = item.get ? item.get() : item;
        for (var i in sequence) {
            var result = sequence[i](data, item);
            if (result !== true) return result;
        }
        return true;
    }
};

exports.queryCompiler = QueryCompiler;