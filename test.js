#!/usr/local/bin/node
var clone = require('native-deep-extend').clone;
var array = [],
    searches = [],
    iter  = 10000;

function wrap(message, iter,func) {
    var start = new Date().getTime();
    for(var i = 0; i < iter; i++) func(i);
    var end = new Date().getTime(),
        elapsed = (end-start)/1000;
    console.log(message, ":", Math.round(iter/elapsed),"op/sec", (elapsed), 'sec');
}

function random() {
    var out = '';
    for(var i = 0; i < Math.floor(Math.random()*25);i++) out += String.fromCharCode(97+Math.floor(Math.random()*25));
    return out;
}

function BinarySearch(t,A,f)       // t - искомый элемент,
{                                // A - упорядоченный массив, в котором ищем.
    var i = 0, j = A.length, k; 
    while (i < j)
     { k = Math.floor((i+j)/2);
       if (t <= f(A,k)) j = k;
       else i = k+1;
     }
    
    if (f(A,i) == t) return i;     // На выходе индекс искомого элемента.
    else {
        console.log(f(A, i), t, f(A,i) == t);
        return -1;}                // Если искомого элемента нет в массиве, то -1.
}
var sortCache = {};

function getValue(object, path) {
    if (!object) return object;
    var index = path.indexOf('.');
    if (!~index) return object[path];
    var key = path.substr(0, index);
    return getValue(object[key], path.substr(index+1));
}

function bsearch(array, key, value) {
    var cache, uniq = {};
    if (sortCache[key] && sortCache[key].array === array) {
        cache = sortCache[key];
    } else {
        for (var i = 0; i < array.length; i++) {
            var r = getValue(array[i], key);
            uniq[r] = uniq[r] || [];
            uniq[r].push(array[i]);
        }
        cache = {
            keys: Object.keys(uniq),
            values: uniq,
            array: array
        };
        sortCache[key] = cache;
        cache.keys.sort(function(x, y) {
            x = +x || x;y = +y || y;
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
//        console.log(cache);
    }
    var index = BinarySearch(value[key], cache.keys, function(A,i) {return A[i];/*getValue(A[i], key)*/}),
        cacheKey = cache.keys[index],
        cacheValues = cache.values[cacheKey];
        if (!cacheValues) {
            console.warn(cache, key, value[key], index, cacheKey, cacheValues);
        }
    return cacheValues;
}

function qsearch(array, query) {
    var result = array;
    for (var key in query) {
        result = bsearch(result, key, query);
//        console.log(result);
    }
    return result;
}

function qnsearch(array, query) {}

wrap('Create array', iter, function() {
    var str = random(),
        object = {name: str, num: Math.round(Math.random()*iter)};
    searches.push(str.substr(1, Math.round(Math.floor(Math.random()*str.length)/2)));
    array.push(object);
});
/*
wrap('search in array with indexOf', iter, function(i) {
    for (var n = 0; n < iter; n++) if (array[n].indexOf(searches[i]) >= 0) return;
//    if (!(array[i].indexOf(searches[i]) >=0)) console.error(array[i], searches[i]);
    console.error('Fail');
});

wrap('search in array with RegExp', iter, function(i) {
    var r = new RegExp(searches[i]);
    for (var n = 0; n < iter; n++) if (r.test(array[n])) return;
    console.error('Fail');
});
*/
//wrap('Sort', 1, function() {array.sort()});
/*
wrap('indexOf search >>>', iter, function(i) {
    var value  = array[i],
        search = array.indexOf(value);
    if (!(array[search] == value)) console.error(value, i, search, array[search]);
});

wrap('indexOf search <<<', iter, function(i) {
    var value  = array[iter-i],
        search = array.indexOf(value);
    if (!(array[search] == value)) console.error(value, i, search, array[search]);
});
*/
/*
wrap('bisection search >>>', iter, function(i) {
    var value  = array[i],
        search = bsearch(array, 'name', value);//BinarySearch(value, array);
    if (!(search[0].name == value.name)) console.error(value, i, search, array[search]);
//    if (search.length > 1) console.log(search.length);
});
*/
var errors = 0;
wrap('bisection query search >>>', iter, function(i) {
    var query  = array[i], //{name: array[i].name},
        search = qsearch(array, query);//BinarySearch(value, array);
    if (!(search && search[0].name == query.name)) /*errors++;//*/console.error(query, i, search, array[search]);
//    if (search.length > 1) console.log(search.length);
});
console.log(errors);
/*
wrap('bisection search <<<', iter, function(i) {
    var value  = array[iter-i],
        search = BinarySearch(value, array);
    if (!(array[search] == value)) console.error(value, i, search, array[search]);
});
*/
