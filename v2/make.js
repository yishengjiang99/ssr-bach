require("child_process").execSync(
    `emcc go.c \
    -s EXPORTED_METHODS='["_malloc"]' \
    -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap","addOnInit"]' \
    -o go.js`);