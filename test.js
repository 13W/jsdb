const Query = require('./lib/query'),
    async = require('async'),
    fs = require('fs'),
    readline = require('readline'),
    dataset = [],
    testQuery = {"category_code" : "web", "founded_year" : {$gte: 2004}, "acquisition.acquired_year": {$gt: 2010}};

const mingo = require('mingo'),
    sift = require('sift'),
    Bout = require('mongo-bout').filter;

function loader(cb) {
    const reader = readline.createInterface({
        input: fs.createReadStream('./datasets/companies.json')
    });

    reader.on('line', function (line) {
        var json = JSON.parse(line);
        json._id = json._id.$oid;
        dataset.push(json);
    });

    reader.on('close', function () {
        console.log('Complete loading data set, length:', dataset.length);
        cb();
    });
}

function startTestJsDB(callback) {
    var query = new Query(testQuery);
    console.time('Request time: JsDB');
    var result = dataset.filter(entry => query.execute(entry));
    console.timeEnd('Request time: JsDB');
    console.log('Counts:', result.length);
    callback();
}

function startTestBout(callback) {
    var filter = Bout(testQuery);
    console.time('Request time: Bout');
    var result = filter(dataset);
    console.timeEnd('Request time: Bout');
    console.log('Counts:', result.length);
    callback();
}

function startTestSift(callback) {
    var query = sift(testQuery);
    console.time('Request time: Sift');
    var result = dataset.filter(entry => query(entry));
    console.timeEnd('Request time: Sift');
    console.log('Counts:', result.length);
    callback();
}

function startTestMingo(callback) {
    console.time('Request time: Mingo');
    var count = new mingo.Query(testQuery).find(dataset).count();
    console.timeEnd('Request time: Mingo');
    console.log('Counts:', count);
    callback();
}

function testDirectFilter(callback) {
    console.time('Request time: Direct Filter');
    // "category_code" : "web", "founded_year" : {$gte: 2004}, "acquisition.acquired_year": {$gt: 2010}
    var result = dataset.filter(entry => entry['category_code'] === 'web' && entry['founded_year'] >= 2004 &&
        entry.acquisition && entry.acquisition.acquired_year > 2010);
    console.timeEnd('Request time: Direct Filter');
    console.log('Counts:', result.length);
    callback();
}

async.parallel([
    loader
], function () {
    async.series([
        startTestMingo,
        startTestBout,
        startTestSift,
        startTestJsDB,
        testDirectFilter
    ], function () {
        console.log('Complete!');
    });
});
