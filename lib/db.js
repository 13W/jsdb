"use strict";

var      utils = require('./utils'),
       Storage = require('./storage').Storage,
    Collection = require('./collection').Collection,
     getAtPath = utils.getAtPath,
        extend = utils.extend,
         clone = utils.clone;

function Db() {
    this.Storage = Storage;
}

/**
 *
 copyTo
 getMongo
 getSiblingDB
 getSisterDB
 getName
 stats
 getCollection
 commandHelp
 runCommand
 adminCommand
 addUser
 logout
 removeUser
 auth
 createCollection
 getProfilingLevel
 getProfilingStatus
 dropDatabase
 shutdownServer
 cloneDatabase
 cloneCollection
 copyDatabase
 repairDatabase
 help
 printCollectionStats
 setProfilingLevel
 eval
 dbEval
 groupeval
 groupcmd
 group
 resetError
 forceError
 getLastError
 getLastErrorObj
 getLastErrorCmd
 getPrevError
 getCollectionNames
 tojson
 toString
 isMaster
 currentOp
 currentOP
 killOp
 killOP
 getReplicationInfo
 printReplicationInfo
 printSlaveReplicationInfo
 serverBuildInfo
 serverStatus
 hostInfo
 serverCmdLineOpts
 version
 serverBits
 listCommands
 printShardingStatus
 fsyncLock
 fsyncUnlock
 setSlaveOk
 getSlaveOk
 loadServerScripts
 */

Db.prototype = {
    init                :   function(config) {
        this.Storage.init(config);
    },
    getCollection       :   function(collectionName) {
        return new Collection(collectionName);
    },
    getCollectionNames  :   function() {
        return this.Storage.getNames();
    }
};