"use strict";
var path = require('path'),
      fs = require('fs'),
    Item = require('./item').Item;

function Storage(config) {
    this.config = config;
    this.scope = {};
    this.collections = {};
}

Storage.prototype = {
    init        :   function(config) {
        var self = this;
        for (var collectionName in config) {
            self.createCollection(collectionName, config[collectionName]);
        }
    },
    associate   :   function(collectionName, collection) {
        this.collections[collectionName] = collection;
    },
    get         :   function(collectionName) {
        return this.scope[collectionName] = this.scope[collectionName] || []; 
    },
    exists      :   function(collectionName) {
        return !!this.scope[collectionName];
    },
    createCollection:function(collectionName, config) {
        config = config || {};
        var self    = this,
            type    = config.type || '';
        
        this.scope[collectionName] = [];

        switch (type.toLowerCase()) {
            case    'json'  :
                self.fromJSON(config, collectionName);
                break;
            case    'jsonstream'  :
                self.fromJSONStream(config, collectionName);
                break;
            case    'mongodb'   :
                self.fromMongoDB(config, collectionName);
                break;
        }

        self.config[collectionName] = config;
    },
    getNames    :   function() {
        return Object.keys(this.scope);
    },
    flush       :   function(collectionName) {
        this.scope[collectionName] && this.scope[collectionName].splice(0);
    },
    insert      :   function(collectionName, data, callback) {
        function toItem(data) {return data instanceof Item ? data : new Item(data, null, true)}
        if (data instanceof Item) {
            data = Array.isArray(data.get())
                ? data.get().map(toItem)
                : [data];
        } else {
            data = Array.isArray(data)
                ? data.map(toItem)
                : [toItem(data)];
        }
        
        for (var i in data) {
            var item = data[i];
            this.scope[collectionName].push(item);
            if (typeof callback === 'function') callback(null, item);
        }
    },
    remove      :   function(collectionName, data) {
        var collection = this.get(collectionName),
            index = collection.indexOf(data);
        if (~index) collection.splice(index, 1);
    },
    renameCollection:   function(oldName, newName) {
        this.scope[newName] = this.scope[oldName];
        delete this.scope[oldName];
    },
    fromJSON    :   function(config, collectionName) {
        var self = this,
            filename = path.resolve(process.cwd(), config.source),
            data;
        
        function Insert(data) {
            if (self.collections[collectionName]) self.collections[collectionName].insert(data);
            else self.insert(collectionName, data);
        }
        if (!fs.existsSync(filename)) throw new Error('json not found');
        data = require(filename);
        
        for (var i in data) {
            Insert(data[i]);
        }
    },
    fromJSONStream: function(config, collectionName) {
        var self = this,
            filename = path.resolve(process.cwd(), config.source),
            stream = fs.createReadStream(filename),
            toJSON = new Function('str', 'return str;');

        function Insert(data) {
            if (self.collections[collectionName]) self.collections[collectionName].insert(data);
            else self.insert(collectionName, data);
        }

        stream.on('data', function(data) {
            data = data.toString('utf-8').split(/\n/);
            data.forEach(function(data) {
                try {
                    Insert(JSON.parse(toJSON(data)));
                } catch(e) {}
            });
        });
    },
    fromMongoDB :   function(source, collectionName) {
        self.flush(collectionName);
    }
};

//noinspection JSClosureCompilerSyntax
exports.Storage = new Storage({});