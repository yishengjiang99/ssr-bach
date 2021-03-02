import { createReadStream, readFileSync } from "fs";
import { Transform } from "stream";
import { ffp } from "./ffp";
const ab = new Uint8Array(readFileSync("./rjb.wasm"));

export async function lpf_transform(fc, q, sr) {
  let output;
  return WebAssembly.instantiate(ab, {
    env: {
      memory: new WebAssembly.Memory({
        initial: 16,
        maximum: 32,
        //@ts-ignore
        shared: true,
      }),
    },
  }).then(({ instance: { exports } }) => {
    //@ts-ignore
    //  exports.calc_filter_coeffs(fc, sr, q);

    return exports;
  });
}

// (async () => {
//   createReadStream("song.pcm")
//     .pipe(await lpf_transform(1000, 4, 48000))
//     .pipe(ffp({ ac: 1, ar: 48000 }));
// })();
