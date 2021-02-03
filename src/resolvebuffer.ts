import { resolve } from "path";
import { NoteEvent } from "./NoteEvent";
import { SoundFont2 } from "soundfont2";
const sf2 = SoundFont2.from(require("fs").readFileSync("./FluidR3_GM.sf2"));

const Module = require(resolve(__dirname, "../sample.wasmmodule.js"));

export const init = async () => {
  return new Promise<void>((resolve) => {
    Module["onRuntimeInitialized"] = function () {
      resolve();
    };
  });
};

export const resolveBuffer = function (note: NoteEvent): Buffer {
  const bytes = note.durationTime * 1000 * 48 * 2 * Float32Array.BYTES_PER_ELEMENT;
  if (note && note.instrument && note.instrument.percussion) {
    const ptr = Module._malloc(bytes);
    Module._drumSample(
      note.instrument.number,
      note.midi,
      note.durationTime * 1000,
      note.velocity * 0x7f
    );
    return Buffer.from(Module.HEAPF32.subarray(ptr >> 2, (ptr + bytes) >> 2).buffer);
  } else {
    const ptr = Module._malloc(bytes);
    Module._sample(
      note.trackId,
      note.midi,
      note.durationTime * 1000,
      note.velocity * 0x7f
    );
    const b = Buffer.alloc(bytes);
    for (let i = 0; i < bytes - 4; i += 4) {
      b.writeFloatLE(Module.HEAPF32[ptr], i);
    }
    return b;
    //    return Buffer.from(Module.HEAPF32.subarray(ptr >> 2, (ptr + bytes) >> 2).buffer);
    //    return Buffer.from(Module.HEAPF32.subarray(ptr >> 2, (ptr + bytes) >> 2).buffer);
  }
};
