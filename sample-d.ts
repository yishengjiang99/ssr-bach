import fs from "fs";

async function main(params: any) {
  const wasi = new WASI({
    args: process.argv,
    env: process.env,
  });
  const importObject = { wasi_snapshot_preview1: wasi.wasiImport };

  const wasm = await WebAssembly.compile(fs.readFileSync("./sample.wasm"));
  const instance = await WebAssembly.instantiate(wasm, importObject);

  wasi.start(instance);
}
main({});
