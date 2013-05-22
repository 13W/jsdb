//require('lo');
var utils = require('./lib/utils.js'),
    queryCompiler = require('./lib/queryCompiler').QueryCompiler,
    methods = require('./lib/methods'),
    queryCache = {};


var o = {
    "i" : 15,
    "my": [
        {
            "hello": "world"
        },
        {
            "deep": {
                "path": "ready!!!"
            }
        }
    ]
};
var start = new Date().getTime();
var cq = new queryCompiler({}, {
    $and: [
        {
            i: {$gte: 7}
        },
        {
            "my.deep.path": o.my[1].deep.path
        }
    ], 
    "my.hello": 'world', 
    "my.not.exist": {$exists: false},
    $update: {
        $inc: {i: 5},
        $pop: {my: 1},
        $pull: {my: {hello: 'world'}},
        $push: {my: {key: 'yeap'}},
        $pushAll: {my: [{key: 'one'}, {key: 'two'}]},
        $rename: {my: 'array'},
        $set: {test: 'value'},
        $unset: {test:1}
    }
}, methods.$query);

//var cq = compileQuery.call({}, {$or: [{i: {$lte: 11}},{"my.deep.path": o.my[1].deep.path}], "my.hello": 'world', "my.not.exist": {$exists: false}}, null, null, $query);

console.log(cq.execute(o), (new Date().getTime()-start)/1000);
console.log(o);