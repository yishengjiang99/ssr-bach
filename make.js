const { execSync } = require('child_process');
const { readFileSync, writeFile, existsSync } = require('fs');
require('child_process').execSync(`wa-compile sdta.c -o sdta.wasm`);
