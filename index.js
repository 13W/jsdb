require('lo');
var Db = require('./lib/db').Db,
    db = Db.init();




var c = db.getCollection('testFind', {
    source  :   './tests/data.json',
    type    :   'fileJSON'
});
module.exports = db;

/*
var testItem = c.find({"name" : "assignee"}).subCollection('systemProperties');

console.inspect(testItem.find().toArray());
testItem.update({}, {$set: {tenant: 'yeap!'}}, {sync: true});
console.inspect(c.find({"name" : "assignee"}).find().toArray());
*/

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
        .subCollection('systemProperties').find({tenant: {$exists: true}}, {tenant:1, _id: 0})
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
                        {
                            $exists: true
                        },


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
/*
console.inspect(c.find({
    $and:[
        {
            'systemProperties.createdOn' :{
                $or:
                    [1364826904803, 1364826904808]
            }
        }, 
        {
            'arr.key':'absd'
        }
    ]
}).toArray());
*/
//console.inspect(c.find({'arr.key': 'csd'}).toArray());
//console.inspect(c.find({'sdasdasd': 'csd'}).toArray());

/*
    c.update({'systemProperties.createdOn' :{$in:[1364826904803, 1364826904808]}}, 
        {
            $set: {group: 'RelationshipType', 'systemProperties.tenant': 'dell'},
            $inc: {'systemProperties.createdOn':1000}
        }, {}, function() {
        console.inspect(c.find({'systemProperties.createdOn' :{$in:[1364826905803, 1364826905808]}}).toArray());
    });
*/
/*
var z = db.getCollection('test');
z.save({hello: []});
z.update({},{$pushAll: {hello: [{test: 'ok!'}, 'pipka', {my: {name: ['is', 'vovik']}}]}}, {sync: true});
console.inspect(z.find().toArray());
z.update({},{$pullAll: {hello: [{'my.name': 'vovik'}, 'pipka']}}, {sync: true});
console.inspect(z.find().toArray());
*/
/*
var test = db.getCollection('test');
test.save({id: 'index1', name: 'hello1', i: 45});
test.save({id: 'index1', name: 'hello2', i: 23});
test.save({id: 'index1', name: 'hello5', i: 22});
test.save({id: 'index2', name: 'hello3', i: 67});
test.save({id: 'index2', name: 'hello66', i: 664});
test.save({id: 'index1', name: 'hello43', i:2});
test.save({id: 'index1', name: 'hello', i: 75});
test.save({id: 'index3', name: 'hello53', i: 25});
*/
//console.inspect(test.find({}).toArray());
//console.inspect(test.find({$or: [{_id: 'index1', name: 'hello2'}, {_id: 'index3'}]}).toArray());

/*
test.group({
    key: {id:1},
    initial: {count: 0},
    reduce: function(data, initial) {
        initial.count++;
    }
}, function(error, response) {console.inspect(error, response)});
*/
//console.inspect(test.find().toArray());
/*
test.mapReduce(
    function() {
        
         //noinspection JSUnresolvedFunction
         
        emit(this.id, this.i);
    },
    function(key, values) {
        var o = 0;
        for (var i in values) o+=values[i];
        return o;
    },
    {query: {}},
    console.inspect
);
*/
/*
console.inspect(test._index);
test.update({id: 'index2'}, {$set: {id: 'index1'}}, {sync: true});
test.remove({id: 'index3'}, {sync: true});
console.warn(test.find({id: 'index1'}, {name:1, i:1}).sort({i: 1}).skip(2).limit(2).toArray());
console.inspect(test.findOne({id: 'index3'}));
*/
//test.remove({_id:})
