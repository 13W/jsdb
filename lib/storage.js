"use strict";
var path = require('path'),
      fs = require('fs'),
    Item = require('./item').Item;

function Storage(config) {
    this.config = config;
    this.scope = {};
}

Storage.prototype = {
    init        :   function(config) {
        var self = this;
        for (var collectionName in config) {
            var cConfig = self.config[collectionName],
                source  = cConfig.source,
                type    = cConfig.type;
            
            this.scope[collectionName] = [];
            
            switch (type) {
                case    'fileJSON'  :
                    self.fromJSON(source, collectionName);
                    break;
                case    'mongodb'   :
                    self.fromMongoDB(source, collectionName);
                    break;
            }
            
            self.config[collectionName] = config[collectionName];
        }
    },
    get         :   function(collectionName) {
        return this.scope[collectionName] = this.scope[collectionName] || []; 
    },
    getNames    :   function() {
        return Object.keys(this.scope);
    },
    flush       :   function(collectionName) {
        this.scope[collectionName] && this.scope[collectionName].splice(0);
    },
    insert      :   function(collectionName, data) {
        this.scope[collectionName].push(new Item(data));
    },
    remove      :   function(collectionName, data) {
        var collection = this.get(collectionName),
            index = collection.indexOf(data);
        if (~index) collection.splice(index, 1);
    },
    fromJSON    :   function(filename, collectionName) {
        var self = this,
            data;
        if (!fs.existsSync(filename)) throw new Error('json not found');
        data = require(filename);
        
        for (var i in data) {
            self.insert(collectionName, data[i]);
        }
    },
    fromMongoDB :   function(source, collectionName) {
        self.flush(collectionName);
    }
};

//noinspection JSClosureCompilerSyntax
exports.Storage = new Storage({});