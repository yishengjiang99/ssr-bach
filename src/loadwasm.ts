import { createWriteStream, writeFileSync } from "fs";
import { ffp } from "./sinks";

const fs = require("fs");
const flsf: Buffer = fs.readFileSync("./file.sf2");
const ab = new Uint8Array(fs.readFileSync("./read-wasm-sfno/re2ad.wasm"));

export async function loadReader(): Promise<{
  sample: (
    presetId: number,
    midiNote: number,
    velocity: number,
    duration: number
  ) => Buffer
}> {
  // const memory = new WebAssembly.Memory({ initial: 256 });
  // @ts-ignore
  let memory = new WebAssembly.Memory({
    initial: 1024,
    maximum: 10240,
    // @ts-ignore
  });

  const optimizedPow = (n, b) => {
    if (b < 0)
    {
      return 1 / optimizedPow(n, -1 * b);
    } else if (n == 2 && b > 0.083 && b < 0.08333)
    {
      return 1.059463094359295;
    } else if (n == 2 && b > 0.16 && b < 0.1666)
    {
      return 1.122462048309373;
    } else if (n == 2 && b == 0.25)
    {
      // && b<0.17){
      return 1.189207115002721;
    } else
    {
      return Math.pow(n, b);
    }
  };
  const { instance, module } = await WebAssembly.instantiate(ab, {
    env: {
      memory: memory,
      table: new WebAssembly.Table({
        initial: 1024,
        element: "anyfunc",
      }),
      tableBase: 0,
      __table_base: 0,
      _abort: () => console.log("abort!"),
      _grow: () => memory.grow(1),
      memset: (ptr, val, size) => {
        const bb = memory.buffer.slice(ptr, ptr + size);
        Buffer.from(bb).fill(val);
      },
      pow: optimizedPow,
      powf: optimizedPow,
    },
  });
  const HEAP8 = new Uint8Array(memory.buffer);
  const heapf32 = new Float32Array(memory.buffer);
  const sfptr = memory.buffer.byteLength - flsf.byteLength;
  HEAP8.set(flsf, sfptr);
  //@ts-ignore
  instance.exports.load_sf(sfptr, flsf.byteLength);
  let wptr = 0;
  return {
    sample: (preset: number, midi: number, velocity: number, seconds: number): Buffer => {
      const n = seconds * 31000;

      //@ts-ignore
      const ptr = instance.exports.ssample(preset, midi, velocity, n);

      const cp = Buffer.from(
        memory.buffer.slice(ptr, ptr + n * Float32Array.BYTES_PER_ELEMENT)
      );
      //@ts-ignore
      instance.exports.free(ptr);
      return cp;
    }
  }
}


// let m = 42;
// loadReader().then((sample) => {

//   process.stdout.write(sample(4, (m += 2), 120, 0.5));
// });

