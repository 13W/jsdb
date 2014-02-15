/**
 * User: Vladimir Bulyga <zero@ccxx.cc>
 * Project: jsdb
 * Date: 12.01.14 23:52
 */

var Collection = require('./collection');

function Database(dbName) {
    this.name = dbName;
    this.spool = {};
}

Database.prototype.getCollection = function (collectionName) {
    return new Collection(this, collectionName);
};

module.exports = Database;