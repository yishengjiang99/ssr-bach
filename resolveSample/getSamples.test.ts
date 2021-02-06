// const mod = require("./sample.wasmmodule.js")();
// mod();

let Module;
export async function ggetSample(instrumentId, midi, durationMs, velocity) {
  Module =
    Module ||
    (await new Promise((resolve) => {
      require("./sample.wasmmodule.js")().then((Module) => resolve(Module));
    }));

  const ptr = Module._malloc(33 * 48 * 2 * Float32Array.BYTES_PER_ELEMENT);
  Module._sample(ptr, instrumentId, midi, durationMs, velocity); //111);
  return Module.HEAPF32.subarray(
    ptr >> 2,
    (ptr + durationMs * 48 * 2 * Float32Array.BYTES_PER_ELEMENT) >> 2
  ).buffer;
}
/**
 * emcc sample.c -o sample.wasmmodule.js --post-js ff.js \
 -s EXPORTED_FUNCTIONS='["_sample","drumSample"]' \
  -s EXTRA_RUNTIME_FUNCTIONS='["_getValue"]'
 */
// function getSample(instrumentId, midi, durationMs, velocity) {
//   Module["onRuntimeInitiated"] = () => {
//     const ptr = Module._malloc(durationMs * 48 * 2 * Float32Array.BYTES_PER_ELEMENT);
//     Module._sample(ptr, instrumentId, midi, durationMs, velocity);
//     return Buffer.from(
//       Module.HEAPF32.subarray(
//         ptr >> 2,
//         (ptr + durationMs * 48 * 2 * Float32Array.BYTES_PER_ELEMENT) >> 2
//       ).buffer
//     );
//   };
// }
// function getDrumSample(presetId, midi, durationMs, velocity) {
//   Module["onRuntimeInitiated"] = () => {
//     const ptr = Module._malloc(durationMs * 48 * 2 * Float32Array.BYTES_PER_ELEMENT);
//     Module._drumSample(ptr, presetId, midi, durationMs, velocity);
//     return Buffer.from(
//       Module.HEAPF32.subarray(
//         ptr >> 2,
//         (ptr + durationMs * 48 * 2 * Float32Array.BYTES_PER_ELEMENT) >> 2
//       ).buffer
//     );
//   };
// }
(async () => {
  try {
    process.stdout.write(await ggetSample(11, 22, 122, 122));
  } catch (e) {
    console.log(e);
  }
})();
