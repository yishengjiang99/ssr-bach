import { Shdr } from "./sf.types";

const assert = require("assert");
let Module = require("../go.js");

export type NoteOnProps = {
  start: number;
  end: number;
  loopStart: number;
  loopEnd: number;
  length: number;
  channelId: number;
  ratio: number;
};
export async function initGo(buffer: Buffer, n: number, outputSampleRate: number = 48000) {
  await new Promise((resolve) => {
    Module.addOnInit(resolve);
  });
  assert(buffer.byteLength / 2 >= n);
  assert(Module._malloc !== null);

  function mallocStruct(byteLength) {
    const ptr = Module._malloc(byteLength);
    const rr = Module.HEAPU8.buffer.slice(ptr, ptr + byteLength);
    const dv = new DataView(rr);

    return {
      ptr,
      dv,
    };
  }
  const sounds = new Array(16).fill(mallocStruct(40));
  let i = 0;

  return {
    noteOn: function (sampleHeader: Shdr, key: number, duration: number, channelId: number) {
      const dv: DataView = sounds[channelId].dv;
      const { start, end, startLoop, endLoop, sampleRate, originalPitch } = sampleHeader;
      const ratio = Math.pow(2, (key - originalPitch) / 12) * (sampleRate / outputSampleRate);

      dv.setUint32(0, start, true);
      dv.setUint32(4, end, true);
      dv.setUint32(8, startLoop, true);
      dv.setUint32(12, endLoop, true);
      dv.setUint32(16, duration * outputSampleRate, true);
      dv.setFloat32(20, ratio, true);
    },

    render: function (size: number) {
      const ptr = Module._malloc(size * Float32Array.BYTES_PER_ELEMENT);
      for (const sound of sounds) {
        if (sound.dv.getUint32(16, true) > 128) {
          Module._render(ptr, sound.ptr, 128);
        }
      }
      return Module.HEAPU8.slice(ptr, ptr + 128 * 4);
    },
  };
}

export function presetIndex(t) {
  const bankId = t.instrument.percussion ? 128 : 0;
  const presetId = t.instrument.number;
  const index = (presetId + bankId) << 2;
  return index;
}
