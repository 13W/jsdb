var Query = require('./lib/query');
// like sift.js
module.exports = function (query, array) {
    query = new Query(query);
    const filter = array => array.filter(data => query.execute(data));
    if (!array) {
        return filter;
    }

    return filter(array);
};

module.exports.use = object => Object.assign(Query.prototype, object);
