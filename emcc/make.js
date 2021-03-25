require("child_process").execSync(
  `emcc go.c \
  --js-library libcall.js \
    --preload-file file.sf2 \
    -s ASSERTIONS=1 \
    -g4 \
    -fsanitize=address \
    -s TOTAL_MEMORY=500mb \
    -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
    -s ABORTING_MALLOC=0 \
    -s EXPORTED_FUNCTIONS='["_malloc","_initWithPreload","_rfff","_trackInfo"]' \
    -s EXTRA_EXPORTED_RUNTIME_METHODS='["writeArrayToMemory","cwrap","addOnInit"]' \
    --source-map-base /fff/ \
    -o go.js`
);

