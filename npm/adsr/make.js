const fs = require("fs");
fs.writeFileSync(
  `./index.js`,
  `// prettier-ignore
  export const wasmBinary = new Uint8Array([
    ${fs.readFileSync("./build/adsr.wasm").join(",")}
  ]);
  ${fs.readFileSync("initadsr.js")}`
);
