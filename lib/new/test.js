/**
 * User: Vladimir Bulyga <zero@ccxx.cc>
 * Project: jsdb
 * Date: 12.01.14 23:57
 */
    
    
require('lo');
var util = require('util');
var Database = require('./db'),
    db = new Database('test');

var test = db.getCollection('test');

var Obj = {
    name : 'test item',
    id: 112,
    plainArray: ['item1', 'item2', 'item3'],
    deepArray: [
        {
            name: 'item4'
        },
        {
            name: 'item5'
        },
        {
            name: 'item6'
        }
    ],
    deep: [{deep: [{path: 'ok'}]}]
};



//test.ensureIndex({'deep.hello': 1, group: 1}, {unique: false});
//test.ensureIndex({group: 1, hello: 1}, {unique: false});
test.ensureIndex({group: 1}, {unique: false});
test.ensureIndex({hello: 1}, {unique: false});
//test.insert({deep: {hello: 'world', group: 'test'}});
//test.insert({deep: {hello: 'world'}, group: 'test'});
test.insert({hello: 'me', group: 'world'});
test.insert({hello: 'day', group: 'next'});
test.insert({hello: 'day', group: 'world'});
test.insert({hello: 'day', group: 'test'});


//var result = test.find({deep:{hello: 'world'}});
var result = test.find({hello: 'day', group: 'world'});
//console.log(util.inspect(test.indexes.all, false, null, true));
console.log(util.inspect(result, false, null, true));

