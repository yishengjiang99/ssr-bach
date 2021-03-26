require('child_process').execSync(
  `wa compile src/go.c \
    -o dist/go.wasm`
);
