const { execSync } = require('child_process');
const { readFileSync, writeFile, existsSync } = require('fs');
require('child_process').execSync(
  `npx wa-compile -s 34000 sdta.c -o sdta.wasm`
);
