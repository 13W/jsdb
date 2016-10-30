#### JSDB

##### Very fast array filter

Test results:
```
$ node test
Complete loading data set, length: 18801
Request time: Mingo: 122.072ms
Counts: 81
Request time: Bout: 126.694ms
Counts: 81
Request time: Sift: 33.379ms
Counts: 81
Request time: FunnyDB: 16.611ms
Counts: 81
Request time: Direct Filter: 5.562ms
Counts: 81
Complete!
```

Benchmark results:
```
$ node benchmark
{"num":{"$lt":5}} x 10 items x 104,438 ops/sec ±2.69% (94 runs sampled)
{"num":{"$lt":5}} x 40 items x 35,609 ops/sec ±2.01% (92 runs sampled)
{"num":{"$lt":5}} x 120 items x 11,029 ops/sec ±1.45% (96 runs sampled)
{"num":{"$lt":5}} x 320 items x 4,389 ops/sec ±1.45% (97 runs sampled)
{"num":{"$lt":5}} x 800 items x 1,752 ops/sec ±1.67% (95 runs sampled)
{"num":{"$lt":5}} x 1920 items x 766 ops/sec ±1.36% (94 runs sampled)
{"num":{"$lt":5}} x 4480 items x 322 ops/sec ±1.63% (88 runs sampled)
{"num":{"$lt":5}} x 10240 items x 142 ops/sec ±1.60% (83 runs sampled)
{"num":{"$lt":5}} x 23040 items x 52.89 ops/sec ±1.64% (70 runs sampled)
```