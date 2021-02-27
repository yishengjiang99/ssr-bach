import { createReadStream } from "fs";

const buffer = require("fs").readFileSync("./RBJ.wasm");
WebAssembly.instantiate(new Uint8Array(buffer).buffer, {
  env: {
    // this is called by `assert()`ions in the AssemblyScript.
    // Useful for debugging.
    abort(...args) {
      console.log(...args);
    },
    tbl: new WebAssembly.Table({ initial: 2, element: "anyfunc" }),
    memory: new WebAssembly.Memory({ initial: 256, maximum: 256 }),
    getFour() {
      return 4;
    },
  },
}).then(({ module, instance }) => {
  debugger;
  console.log(instance.exports);
}); //
