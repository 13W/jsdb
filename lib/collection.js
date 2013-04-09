"use strict";
require('lo');
var       Item = require('./item').Item,
         utils = require('./utils'),
        Cursor = require('./cursor').Cursor,
       Storage = require('./storage').Storage,
     getAtPath = utils.getAtPath,
        extend = utils.extend,
         clone = utils.clone;

var data = {
    test: [
        {
            "name" : "assignedTeam",
            "group" : "RelationshipType",
            arr: [
                {key: 'asd'},
                {key: 'bsd'},
                {key: 'absd'},
                {key: 'csd'}
            ],
            "systemProperties" : {
                "createdOn" : 1364826904803
            }
        },
        {
            "name" : "assignee",
            "group" : "RelationshipType",
            arr: [
                {key: 'asd'},
                {key: 'bsd'},
                {key: 'csd'}
            ],
            "systemProperties" : {
                "createdOn" : 1364826904804,
                "tenant" : "hello world"
            }
        },
        {
            "name" : "associatedDocument",
            "group" : "RelationshipType",
            "systemProperties" : {
                "createdOn" : 1364826904804
            }
        },
        {
            "name" : "booking",
            "group" : "RelationshipType",
            "systemProperties" : {
                "createdOn" : 1364826904805
            }
        },
        {
            "name" : "company",
            "group" : "RelationshipType",
            "systemProperties" : {
                "createdOn" : 1364826904805
            }
        },
        {
            "name" : "contact",
            "group" : "RelationshipType",
            "systemProperties" : {
                "createdOn" : 1364826904806
            }
        },
        {
            "name" : "contacted",
            "group" : "RelationshipType",
            "systemProperties" : {
                "createdOn" : 1364826904807
            }
        },
        {
            "name" : "covered",
            "group" : "RelationshipType",
            "systemProperties" : {
                "createdOn" : 1364826904807
            }
        },
        {
            "name" : "customer",
            "group" : "RelationshipType",
            "systemProperties" : {
                "createdOn" : 1364826904808,
                "tenant" : "master"
            }
        },
        {
            "name" : "delivery",
            "group" : "RelationshipType",
            "systemProperties" : {
                "createdOn" : 1364826904808
            }
        }
    ]
};


function Collection(collectionName, options) {
    options = options || {};
    this.options = options;
    this.collectionName = collectionName;
    this.data = options.fake ? [] : Storage.get(collectionName);
    this.Storage = Storage;
    this.inspect = function() {return '{"collection": "' + collectionName +'"}'};
}

/*
 verify
 getName
 help
 getFullName
 getMongo
 getDB
 _dbCommand
 runCommand
 find
 findOne
 insert
 remove
 update
 save
 _genIndexName
 _indexSpec
 createIndex
 ensureIndex
 resetIndexCache
 reIndex
 dropIndexes
 drop
 findAndModify
 renameCollection
 validate
 getShardVersion
 getIndexes
 getIndices
 getIndexSpecs
 getIndexKeys
 count
 clean
 dropIndex
 copyTo
 getCollection
 stats
 dataSize
 storageSize
 totalIndexSize
 totalSize
 convertToCapped
 exists
 isCapped
 _distinct
 distinct
 aggregate
 group
 groupcmd
 convertToSingleObject
 mapReduce
 toString
 tojson
 shellPrint
 getShardDistribution
 getSplitKeysForChunks
 setSlaveOk
 getSlaveOk
 getQueryOptions

 */

//noinspection FunctionWithInconsistentReturnsJS
Collection.prototype = {
    new             :   function(collectionName, options) {
        return new Collection(collectionName, options)
    },
    find            :   function(query, columns, options, callback) {
        query = query || {};
        options = options || {};
        //noinspection JSPotentiallyInvalidConstructorUsage
        var defaultOptions = {
                limit: Infinity
            },
            cursor = new Cursor(this, extend({}, defaultOptions, options, {
                query: query,
                columns: columns
            }));
        
        if (!options.stream && typeof callback === 'function') return callback(null, cursor);
        return cursor;
    },
    findOne         : function (query, columns, options) {
        var result = this.find(query, columns, extend({}, options, {limit: 1})).toArray();
        return result && result[0] || null; 
    },
    insert          :   function(data) {
        this.Storage.insert(this.collectionName, data);
    },
    remove          :   function(query, options) {
        var self = this;
        if (!query) return self.Storage.flush(self.collectionName);
        options = options || {};
        options.items = true;
        options.stream = true;
        var stream = self.find(query, {}, options);
        stream.on('data', function(data) {
            self.Storage.remove(self.collectionName, data);
        });
    },
    update          :   function(query, update, options, callback) {
        var self = this;
        if (!query) return self.Storage.flush(self.collectionName);
        options = options || {};
        options.items = true;
        options.stream = !options.sync;
        var stream = self.find(query, false, options);
        if (options.sync) {
            stream.forEach(function(data) {
                data.update(update, stream);
            })
        } else {
            stream.on('data', function(data) {
                data.update(update, stream.cursor);
            });
            stream.on('end', callback);
        }
    },
    save            :   function(data) {
        this.Storage.insert(this.collectionName, data);
    }
};

exports.Collection = Collection;

var c = new Collection('testFind');

for (var i in data.test) c.save(data.test[i]);

/*
console.inspect(
    c.find({'systemProperties.createdOn': {$not: {$in: [1364826904804, 1364826904808, 1364826904805]}}})
        .subCollection('arr')
        .find({'key':{$nor:['bsd', 'asd']}})
//        .find({$where: "this.key === 'absd'"})
        .toArray()
//        .data
);
*/
/*
console.inspect(
    c.find({'systemProperties.createdOn': {$in: [1364826904803, 1364826904808, 1364826904805]}})
        .subCollection('systemProperties').find({tenant: {$exists: false}}, {tenant:1})
        .toArray()
);
*/
/*
console.inspect(c.find({$and:[{'systemProperties.createdOn': {$gte: 1364826904803}}, {'systemProperties.createdOn': {$lte: 1364826904804}}]}).toArray());
*/
/*
console.inspect(c.find(
    {
        $and: [
            {
                'systemProperties.createdOn': {
                    $gt: 1364826904802,
                    $lte: 1364826904809
                }
            },
            {
                'systemProperties.tenant': {
                    $or: [
*/
/*
                        {
                            $exists: true
                        },
*//*

                        {
                            $exists: false
                        }

                    ]
                }
            }
        ],
        name: {
            $and:[
                {
                    $regex: 'co'
                },
                {
                    $type: 2
                }
            ]
        }
    },
    {
        'systemProperties':1, 
        name:1
    },
    {
        limit: 300
    }
).toArray());
*/
//console.inspect(c.find({$and:[{'systemProperties.createdOn' :{$or:[1364826904803, 1364826904808]}}, {'arr.key':'absd'}]}).toArray());
//console.inspect(c.find({'arr.key': 'csd'}).toArray());
//console.inspect(c.find({'sdasdasd': 'csd'}).toArray());
//z.parseKey('path.to..val.in.za', 123);

//c.update({'systemProperties.createdOn' :{$in:[1364826904803, 1364826904808]}}, 
//    {
//        $set: {group: 'RelationshipType', 'systemProperties.tenant': 'dell'},
//        $inc: {'systemProperties.createdOn':1000}
//    }, {}, function() {
//    console.inspect(c.find({'systemProperties.createdOn' :{$in:[1364826905803, 1364826905808]}}).toArray());
//});
var z = new Collection('test');
z.save({hello: []});
z.update({},{$pushAll: {hello: [{test: 'ok!'}, 'pipka', {my: {name: ['is', 'vovik']}}]}}, {sync: true});
console.inspect(z.find().toArray());
z.update({},{$pullAll: {hello: [{'my.name': 'vovik'}, 'pipka']}}, {sync: true});
console.inspect(z.find().toArray());
