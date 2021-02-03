emcc sample.c -o sample.wasmmodule.js --post-js ff.js  -s EXPORTED_FUNCTIONS='["_sample","_drumSample"]'   -s EXTRA_EXPORTED_RUNTIME_METHODS='["getValue"]'
