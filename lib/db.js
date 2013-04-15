"use strict";

var      utils = require('./utils'),
       Storage = require('./storage').Storage,
    Collection = require('./collection').Collection,
     getAtPath = utils.getAtPath,
        extend = utils.extend,
         clone = utils.clone;

function Db() {
    this.name = 'test';
    this.Storage = Storage;
    this.collections = {};
    this.indexes = this.getCollection('system.indexes');
}

Db.init = function() {
    return new Db;
};

Db.prototype = {
    init                :   function(config) {
        this.Storage.init(config);
    },
    createDotPath       :   function(collectionName) {
        var ptr = this,
            collection = this.collections[collectionName],
            path = collectionName.split('.'),
            key;
        while (key = path.shift()) {
            ptr = ptr[key] = ptr[key] || path.length ? {} :collection;
        }
        return true;
    },
    removeDotPath       :   function(collectionName) {
        var path = collectionName.split('.');
        function removeLast(o, path) {
            var lastKey = path.length == 1,
                key = path.length >1 && path.shift();
            
            if (lastKey) {
                delete o[key];
            } else
            if (removeLast(o[key], path) && utils.empty(o[key])) {
                delete o[key];
            } else return false;
            return true;
        }
        removeLast(this, path);
    },
    dropCollection      :   function(collectionName) {
        this.Storage.drop(collectionName);
        delete this.collections[collectionName];
        delete this[collectionName];
    },
    getCollection       :   function(collectionName, options) {
        options = options || {};
        if (!this.Storage.exists(collectionName)) {
            this.Storage.createCollection(collectionName, options);
            var collection = this.collections[collectionName] = this.collections[collectionName] || new Collection(collectionName);
            collection.setDb(this);
            if (!/^system/.test(collectionName))
                this.indexes.insert({
                    v: 1,
                    ns: collection.getFullName(),
                    key: {
                        _id: 1
                    },
                    name: '_id_',
                    background: true
                });
        }
        this.createDotPath(collectionName);
        return this.collections[collectionName];
    },
    getCollectionNames  :   function() {
        return this.Storage.getNames();
    }
};

exports.Db = Db;