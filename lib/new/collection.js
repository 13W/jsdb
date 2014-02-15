/**
 * User: Vladimir Bulyga <zero@ccxx.cc>
 * Project: jsdb
 * Date: 12.01.14 23:52
 */

var Index = require('./indexes').Index,
    Validator = require('./validator').Validator,
    ObjectId = require('./utils').ObjectID;

function Collection(db, collectionName) {
    this._db = db;
    this.collectionName = collectionName;

    this._fullName = this._db.name + '.' + this.collectionName;
    this.indexes = {name: {}, all: []};
    this.createIfNotExist();
}

Collection.prototype.createIfNotExist = function () {
    this.data = this._db.spool[this.collectionName];
    if (!this.data) {
        this.data = this._db.spool[this.collectionName] = [];
        this.ensureIndex({_id: 1});
    }
};

Collection.prototype.ensureIndex = function ensureIndex(keys, options) {
    if (this.collectionName === 'system.indexes') {
        return;
    }
    
    var o = this._indexSpec( keys, options );
    this._db.getCollection( "system.indexes" ).insert( o , 0, true );

    if (this.indexes.name[o.name]) {
        var i = this.indexes.all.indexOf(this.indexes.name[o.name]);
        this.indexes.all.splice(i, 1);
        delete this.indexes.name[o.name];
    }
    this.indexes.name[o.name] = new Index(this.data, o);
    this.indexes.all.push(this.indexes.name[o.name]);
};

Collection.prototype.getDB = function getDB() {
    return this._db;
};

function extend(dst, src, deep){
    var k;
    for (k in src){
        if (src.hasOwnProperty(k)) {
            var v = src[k];
            if (deep && typeof v === "object"){
                if (v.hasOwnProperty('floatApprox')) { // convert NumberLong properly
                    eval("v = " + JSON.stringify(v));
                } else {
                    v = extend(typeof (v.length) == "number" ? [] : {}, v, true);
                }
            }
            dst[k] = v;
        }
    }
    return dst;
}


Collection.prototype._indexSpec = function ( keys, options ) {
    var ret = { ns : this._fullName , key : keys , name : this._genIndexName( keys ) };

    if ( ! options ){
    }
    else if ( typeof ( options ) == "string" )
        ret.name = options;
    else if ( typeof ( options ) == "boolean" )
        ret.unique = true;
    else if ( typeof ( options ) == "object" ){
        if ( options.length ){
            var nb = 0;
            for ( var i=0; i<options.length; i++ ){
                if ( typeof ( options[i] ) == "string" )
                    ret.name = options[i];
                else if ( typeof( options[i] ) == "boolean" ){
                    if ( options[i] ){
                        if ( nb == 0 )
                            ret.unique = true;
                        if ( nb == 1 )
                            ret.dropDups = true;
                    }
                    nb++;
                }
            }
        }
        else {
            extend( ret , options );
        }
    }
    else {
        throw "can't handle: " + typeof( options );
    }

    return ret;
};

Collection.prototype._genIndexName = function ( keys ){
    var name = "";
    for ( var k in keys ){
        var v = keys[k];
        if ( typeof v == "function" )
            continue;

        if ( name.length > 0 )
            name += "_";
        name += k + "_";

        name += v;
    }
    return name;
};

Collection.prototype._validateObject = function ( o ){
    if (typeof(o) != "object")
        throw "attempted to save a " + typeof(o) + " value.  document expected.";

    if ( o._ensureSpecial && o._checkModify )
        throw "can't save a DBQuery object";
};


Collection.prototype._validateForStorage = function ( o ){
    this._validateObject( o );
    for ( var k in o ){
        if ( k.indexOf( "." ) >= 0 ) {
            throw "can't have . in field names [" + k + "]" ;
        }

        if ( k.indexOf( "$" ) == 0 && ! { "$id" : 1, "$ref" : 1, "$db" : 1 }[k] ) {
            throw "field names cannot start with $ [" + k + "]";
        }

        if ( o[k] !== null && typeof( o[k] ) === "object" ) {
            this._validateForStorage( o[k] );
        }
    }
};


Collection.prototype.insert = function ( obj , options, _allow_dot ){
    if ( ! obj )
        throw "no object passed to insert!";
    if ( ! _allow_dot ) {
        this._validateForStorage( obj );
    }

    if ( typeof( options ) == "undefined" ) options = 0;

    if ( typeof( obj._id ) == "undefined" && ! Array.isArray( obj ) ){
        var tmp = obj; // don't want to modify input
        obj = {};
        if (this.collectionName !== "system.indexes") {
            obj._id = new ObjectId();
        } 
        for (var key in tmp){
            obj[key] = tmp[key];
        }
    }
    
/*
    this._mongo.insert( this._fullName , obj, options );
    this._lastID = obj._id;
    this._printExtraInfo("Inserted", startTime);
*/
    this.data.push(obj);
    this.indexes.all.forEach(function (index) {
        index._ensureIndex(obj);
    });
};

Collection.prototype.find = function (query, fields, options) {
    var data = [],
        minimalIndex = null;
    this.indexes.all.forEach(function (index) {
        var result = index.search(query);
        console.warn(minimalIndex);
        data.push(result);
        console.log(!minimalIndex, minimalIndex && minimalIndex.length, result.length, !minimalIndex || (minimalIndex.length > result.length));
        if (!minimalIndex || (minimalIndex.length > result.length)) {
            minimalIndex = result;
        }
    });
    if (!minimalIndex) {
        minimalIndex = this.data;
    }
    var validator = new Validator(query);
    return minimalIndex.filter(validator.validate.bind(validator));
};

module.exports = Collection;