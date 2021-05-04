const fs = require("fs");
fs.writeFileSync(
	`build/adsr.js`,
	`// prettier-ignore
  const wasmBinary = new Uint8Array([
    ${fs.readFileSync("adsr.wasm").join(",")}
  ]);
  const module = new WebAssembly.Module(wasmBinary);
  const mem = new WebAssembly.Memory({
    initial: 100, //100 x 64k ..just putting in some safe values now
    maximum: 100,
  });
  const instance = new WebAssembly.Instance(module, {
    env: {
      memory: mem,

      sinf:(x)=>Math.sin(x),
      powf: (base, exp) => Math.pow(base, exp),
      table: new WebAssembly.Table({ element: "anyfunc", initial: 6 }),
    },
  });

	export default {
    mem,
    HEAPU8: new Uint8Array(mem.buffer),
    ...instance.exports,
  };
	
	`
);
