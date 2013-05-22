"use strict";
var utils = require('./utils'),
    methods = require('./methods');

//noinspection FunctionWithInconsistentReturnsJS
function Item(object, parent, withId) {
    if (object instanceof Item) return object;
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
    this.__uuid = this.data && typeof this.data._id ==='string' && this.data._id || utils.uuid.uuid(24);
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
    clone       :   function() {
        return utils.clone(this.data);
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
    project     :   function(columns) {
        var resultData = {};
        if (utils.empty(columns)) return this.get();
        columns = utils.clone(columns);
        columns._id = columns._id === 0 ? 0 : 1;
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
                    if (methods.$project[display])
                        objPtr = methods.$project[display].call(methods.$project, objPtr, display[key], display, this, this);
                }
            }

            if (typeof objPtr === 'undefined') continue;

            var ptr = utils.getAtPath(column, resultData/*, {create: true}*/),
                ptrData = ptr[0].previous,
                ptrKey = ptr[0].key;
            ptrData[ptrKey] = objPtr;
        }
        return utils.empty(resultData) ? void(0) :resultData;
    }
};

exports.Item = Item;