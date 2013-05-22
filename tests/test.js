var db = require('../'),
    jp = require('JSONPath').eval,
    jessup = require('jessup').eval;

var memwatch = require('memwatch');
/*
memwatch.on('leak', function() {
    console.inspect('leak', arguments);
});
memwatch.on('stats', function() {
    console.inspect('stats', arguments);
});
memwatch.on('gc', function(d) {
    if (d.compacted) {
        console.log("postgc:", msFromStart(), memwatch.stats().current_base);
    }
});
*/
var assets = db.getCollection('app.assets', {
    source: './dataset/app.assets.json',
    type: 'jsonStream'
});
//var profiler = require('profiler');

//assets.insert({hello: 'world'});
//console.inspect(assets.find().toArray());
//assets.ensureIndex({displayName: 1});
//assets.ensureIndex({'dq.action': 1, 'dq.messageType': 1});

/*
var z = { "_id": { "$oid": "514b338f2b08ee000000b52e" }, "amount": { "code": { "key": "514b32b3dc70990000000788", "displayName": "USD", "type": "core.lookup", "name": "usd" }, "type": "core.currency", "amount": 531000, "normalizedAmount": { "code": { "key": "514b32b3dc70990000000788", "displayName": "USD", "type": "core.lookup", "name": "usd" }, "amount": 531000, "convertedOn": { "$date": 1363882896664 } } }, "associatedOpportunity": false, "description": "Service Assurance", "displayName": "BPA", "dq": [
    { "action": "linker", "messageType": "error", "date": { "$date": 1363883470252 }, "message": "Missing relationship link for product and csvLoad:BPA", "path": "relationships[?(@.relation.name == 'product')].id", "type": "core.dq.tag", "_id": { "$oid": "514b35d0fdaefe000000aa9e" } }
], "extensions": { "master": { "contractNumber": { "value": "6859222501", "type": "string" }, "serialNumber": { "value": "CP100001963", "type": "string" } } }, "externalIds": [
    { "id": "CP100001963", "schemeId": { "key": "514b32b6dc70990000000a9b", "displayName": "CSV Load", "type": "app.lookup", "name": "csvLoad" }, "_id": { "$oid": "514b338f2b08ee000000b530" } },
    { "id": "514b334a2b08ee000000019e", "schemeId": { "key": "514b32b6dc70990000000a9d", "displayName": "Batch Load", "type": "app.lookup", "name": "batchLoad" }, "_id": { "$oid": "514b338f2b08ee000000b52f" } }
], "keywords": [ "bpa" ], "relationships": { "product": { "relation": { "displayName": "Product", "key": "514b32b3dc70990000000708", "type": "core.lookup", "name": "product" }, "targets": [
    { "schemeId": { "name": "csvLoad" }, "type": "app.product/covered", "id": "BPA" }
] }, "customer": { "relation": { "displayName": "Customer", "key": "514b32b3dc709900000006f7", "type": "core.lookup", "name": "customer" }, "targets": [
    { "_id": { "$oid": "514b35cefdaefe000000a6a8" }, "type": "core.contact/organization", "displayName": "MTC - ZAIN", "relationships": {}, "key": "514b33662b08ee0000004e43", "revisionId": 1, "_relationships": { "primaryContact": { "relation": { "displayName": "Primary Contact", "key": "514b32b3dc70990000000706", "type": "core.lookup", "name": "primaryContact" }, "targets": [
        { "type": "core.contact/person" }
    ] } } }
], "firstTarget": "MTC - ZAIN" }, "reseller": { "relation": { "displayName": "Reseller", "key": "514b32b3dc7099000000070d", "type": "core.lookup", "name": "reseller" }, "targets": [
    { "_id": { "$oid": "514b35cefdaefe000000a6aa" }, "type": "core.contact/organization", "displayName": "ABC Distribution", "relationships": {}, "key": "514b33612b08ee0000003fe5", "revisionId": 1 }
], "firstTarget": "ABC Distribution" } }, "systemProperties": { "createdBy": "admin@guidance.com", "createdOn": { "$date": 1363882901457 }, "dlOn": { "$date": 1363882895485 }, "expiredOn": { "$date": 253370764800000 }, "lastModifiedBy": "_dataloader", "lastModifiedOn": { "$date": 1363883596764 }, "qRank": 1, "revisionId": 1, "tenant": "guidance" }, "tags": [], "type": "app.asset/covered" }
*/

function test() {
    var start = new Date().getTime();
    console.log('Start!');
//    console.log(jessup({assets: assets.jsItems}, '$.assets[?(@.displayName === "BPA")]').length);
//    console.inspect(jp({assets: assets.jsItems}, 'assets[?(@.displayName === "BPS-Gold-34596")]').length);
//    console.inspect(assets.find({'dq.action': "linker", 'dq.messageType': "error"}).count());
    assets.update({displayName: 'BPA'}, {$set: {displayName: 'Test!!!'}});
//    console.log(assets.find({'displayName': "BPA", 'dq.action': "linker", 'dq.messageType': "error"}).count());
    console.log(assets.find({'displayName': "Test!!!", 'dq.action': "linker", 'dq.messageType': "error"}).count());
//    console.log(assets.findOne({displayName: "Test!!!"}));
    var end = new Date().getTime();
    console.log('Complete %ds', (end-start)/1000);
}
require('lo');
//console.inspect(process.memoryUsage());
setTimeout(function() {
//    assets.reIndex();
    setTimeout(function() {
//        if (typeof gc === 'function') gc();
//        profiler.resume();
        memwatch.gc();
        var hd = new memwatch.HeapDiff();
        test();
        var diff = hd.end();
        console.inspect(diff);
//        test();
//        var start = new Date().getTime();
//        console.inspect(assets._index);
//        assets.group({
//            key: {displayName:1},
//            cond: {'dq.action': "linker", 'dq.messageType': "error"},
//            initial: {count: 0},
//            reduce: function(data, initial) {
//                initial.count+=1;//data.amount && data.amount.amount;
//            }
//        }, function(error, result) {
//            var end = new Date().getTime();
//            console.inspect(result);
//            console.log('Complete %ds', (end-start)/1000);
//            console.inspect(process.memoryUsage());
//        });
    }, 2300)
}, 2300);
