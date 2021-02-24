require("child_process").execSync(
    `emcc go.c \
    -s EXPORTED_FUNCTIONS='["_malloc","_free"]' \
    -s INITIAL_MEMORY=100mb \
    -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap","addOnInit"]' \
    -o go.js`);